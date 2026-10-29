"""Benchmark retrieval trên golden dataset: Hit@k, Recall@k, MRR, empty/wrong-type/false-positive.

  python -m eval.run_retrieval                      # hybrid = cấu hình production (cần index + embedding)
  python -m eval.run_retrieval --mode dense        # dense thuần (so sánh)
  python -m eval.run_retrieval --mode bm25          # từ vựng, KHÔNG cần credential
  python -m eval.run_retrieval --mode all           # dense + bm25 + hybrid (RRF)
  python -m eval.run_retrieval --compare            # so với eval/reports/retrieval-baseline.json
  python -m eval.run_retrieval --save-baseline      # ghi baseline (commit cùng thay đổi knowledge/model)

Đơn vị xếp hạng là tài liệu (gộp chunk). Dense lấy MỌI chunk (min_score=0) để quét ngưỡng
`min_score` offline; chỉ số chính tính ở ngưỡng production của embedding model (--threshold).
Exit: 0 đạt; 1 dưới --fail-under hoặc tụt so với baseline; 2 index/embedding không dùng được.
"""
from __future__ import annotations

import argparse
import asyncio
import hashlib
import json
import sys
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from app.config import get_settings  # noqa: E402
from app.rag.embedding import resolve_embedding_spec, resolve_min_score  # noqa: E402
from app.rag.indexer import build_chunks, check_index, scan_docs  # noqa: E402
from app.rag.lexical import Bm25Index  # noqa: E402
from app.rag.models import RetrievedChunk  # noqa: E402
from app.rag.policy import KnowledgePolicy  # noqa: E402
from app.rag.retriever import KnowledgeRetriever, RetrievalUnavailableError  # noqa: E402
from eval.retrieval_metrics import (  # noqa: E402
    CaseOutcome,
    Retrieved,
    aggregate,
    dedupe_docs,
    threshold_sweep,
)

DATASET = ROOT / "eval" / "datasets" / "retrieval.jsonl"
REPORTS = ROOT / "eval" / "reports"
BASELINE = REPORTS / "retrieval-baseline.json"
SWEEP = [0.0, 0.3, 0.4, 0.45, 0.5, 0.55, 0.6, 0.65, 0.7]
REGRESSION_TOLERANCE = 0.02


def load_cases(path: Path = DATASET) -> list[dict]:
    return [
        json.loads(line)
        for line in path.read_text(encoding="utf-8").splitlines()
        if line.strip() and not line.lstrip().startswith("#")
    ]


def _to_retrieved(chunks: list[RetrievedChunk]) -> list[Retrieved]:
    return dedupe_docs([Retrieved(c.file_id, c.type, c.similarity_score) for c in chunks])


async def _dense(retriever: KnowledgeRetriever, case: dict, n_chunks: int, hybrid: bool) -> list[RetrievedChunk]:
    return await retriever.retrieve(
        case["input"], top_k=n_chunks, filter_types=case.get("types"), allowed_only=True,
        min_score=0.0, hybrid=hybrid,
    )


class _Lexical:
    """BM25 trên chunk của knowledge hiện hành, qua cùng KnowledgePolicy như production."""

    def __init__(self, knowledge_dir: str) -> None:
        docs = scan_docs(knowledge_dir)
        _, texts, metas, _ = build_chunks(docs)
        self.metas, self.texts = metas, texts
        self.index = Bm25Index(texts)
        self.policy = KnowledgePolicy(knowledge_dir)

    def search(self, case: dict, limit: int) -> list[RetrievedChunk]:
        types = case.get("types")
        out: list[RetrievedChunk] = []
        for i, score in self.index.top(case["input"], limit * 4):
            meta = self.metas[i]
            if types and meta["type"] not in types:
                continue
            out.append(
                RetrievedChunk(
                    file_id=meta["file_id"], canonical_name=meta["canonical_name"], type=meta["type"],
                    text=self.texts[i], metadata=meta, similarity_score=score,
                )
            )
        return self.policy.filter_chunks(out)[:limit]


async def collect(mode: str, cases: list[dict], retriever, lexical) -> list[CaseOutcome]:
    n_chunks = retriever.collection_count() if retriever is not None else 0
    outcomes: list[CaseOutcome] = []
    for case in cases:
        if mode == "bm25":
            ranked = _to_retrieved(lexical.search(case, 40))
        else:
            ranked = _to_retrieved(await _dense(retriever, case, n_chunks, hybrid=(mode == "hybrid")))
        outcomes.append(
            CaseOutcome(
                id=case["id"], category=case.get("category", ""), input=case["input"],
                expected=case.get("expected_documents") or [], expect_empty=bool(case.get("expect_empty")),
                ranked=ranked, types=case.get("types") or [],
            )
        )
    return outcomes


def _fmt(x: float) -> str:
    return f"{x:.1%}"


def render_md(report: dict) -> str:
    cfg = report["config"]
    lines = [
        "# Retrieval benchmark",
        "",
        f"- Thời điểm: {cfg['generated_at']}",
        f"- Dataset: `{cfg['dataset']}` ({cfg['cases']} case, sha256 `{cfg['dataset_sha'][:12]}`)",
        f"- Embedding: `{cfg['embedding']}`; index: `{cfg['index_collection']}` "
        f"({cfg['index_chunks']} chunk, knowledge `{cfg['knowledge_hash'][:12]}`)",
        f"- Ngưỡng min_score: {cfg['threshold']}",
        "",
        "| Mode | Hit@1 | Hit@3 | Hit@5 | Recall@5 | MRR | Empty | Wrong-type | Neg. FP |",
        "|---|---|---|---|---|---|---|---|---|",
    ]
    for mode, res in report["modes"].items():
        a = res["metrics"]
        lines.append(
            f"| {mode} | {_fmt(a['hit@1'])} | {_fmt(a['hit@3'])} | {_fmt(a['hit@5'])} | {_fmt(a['recall@5'])} "
            f"| {a['mrr']:.3f} | {_fmt(a['empty_rate'])} | {_fmt(a['wrong_type_rate'])} "
            f"| {_fmt(a['negative_false_positive_rate'])} |"
        )
    for mode, res in report["modes"].items():
        a = res["metrics"]
        lines += ["", f"## {mode}", "", "| Category | n | Hit@1 | Hit@5 | MRR |", "|---|---|---|---|---|"]
        for cat, c in a["by_category"].items():
            if "hit@1" in c:
                lines.append(f"| {cat} | {c['n']} | {_fmt(c['hit@1'])} | {_fmt(c['hit@5'])} | {c['mrr']:.3f} |")
            else:
                lines.append(f"| {cat} (neg.) | {c['n']} | - | FP {_fmt(c['false_positive_rate'])} | - |")
        if res.get("sweep"):
            lines += ["", "Quét ngưỡng min_score (thứ hạng không đổi, chỉ lọc điểm):", "",
                      "| min_score | Hit@5 | MRR | Empty | Neg. FP |", "|---|---|---|---|---|"]
            for r in res["sweep"]:
                lines.append(
                    f"| {r['threshold']} | {_fmt(r['hit@5'])} | {r['mrr']:.3f} | {_fmt(r['empty_rate'])} "
                    f"| {_fmt(r['negative_false_positive_rate'])} |"
                )
        if a["failures"]:
            lines += ["", "Trượt Hit@5:", ""]
            lines += [f"- `{f['id']}` «{f['input']}» kỳ vọng {f['expected']} -> {f['got']}" for f in a["failures"]]
        if a["false_positives"]:
            lines += ["", "Negative còn trả kết quả:", ""]
            lines += [f"- `{f['id']}` «{f['input']}» -> {f['got']}" for f in a["false_positives"]]
    return "\n".join(lines) + "\n"


def compare(report: dict, baseline: dict) -> list[str]:
    """Trả danh sách regression (rỗng = ổn). So Hit@5 và MRR theo từng mode có trong cả hai."""
    problems = []
    for mode, res in report["modes"].items():
        base = baseline.get("modes", {}).get(mode)
        if not base:
            continue
        for key in ("hit@5", "mrr"):
            delta = res["metrics"][key] - base["metrics"][key]
            if delta < -REGRESSION_TOLERANCE:
                problems.append(f"{mode}.{key}: {base['metrics'][key]:.3f} -> {res['metrics'][key]:.3f}")
        fp = res["metrics"]["negative_false_positive_rate"] - base["metrics"]["negative_false_positive_rate"]
        if fp > REGRESSION_TOLERANCE:
            problems.append(f"{mode}.negative_false_positive_rate tăng {fp:+.3f}")
    return problems


async def run(args: argparse.Namespace) -> int:
    s = get_settings()
    if args.threshold is None:
        args.threshold = resolve_min_score(s)
    cases = load_cases()
    modes = ["dense", "bm25", "hybrid"] if args.mode == "all" else [args.mode]
    needs_dense = any(m in ("dense", "hybrid") for m in modes)

    retriever = None
    manifest: dict = {}
    spec_label = "n/a (bm25)"
    if needs_dense:
        status = check_index(s)
        if not status.ok and not args.allow_stale:
            print(f"[ERROR] index không sẵn sàng ({status.reason}). Chạy: python -m app.rag.indexer --ensure")
            return 2
        manifest = status.manifest or {}
        spec_label = resolve_embedding_spec(s).label
        retriever = KnowledgeRetriever()  # hybrid bật/tắt theo từng mode
    lexical = _Lexical(s.knowledge_dir) if any(m in ("bm25", "hybrid") for m in modes) else None

    report: dict = {
        "config": {
            "generated_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
            "dataset": DATASET.name,
            "dataset_sha": hashlib.sha256(DATASET.read_bytes()).hexdigest(),
            "cases": len(cases),
            "embedding": spec_label,
            "index_collection": manifest.get("collection", "n/a"),
            "index_chunks": manifest.get("chunks", 0),
            "knowledge_hash": manifest.get("knowledge_hash", ""),
            "threshold": args.threshold,
        },
        "modes": {},
    }
    for mode in modes:
        try:
            outcomes = await collect(mode, cases, retriever, lexical)
        except RetrievalUnavailableError as exc:
            print(f"[ERROR] retrieval unavailable: {exc}")
            return 2
        threshold = 0.0 if mode == "bm25" else args.threshold  # BM25 không có thang similarity
        report["modes"][mode] = {
            "metrics": aggregate(outcomes, threshold),
            "sweep": threshold_sweep(outcomes, SWEEP) if mode != "bm25" else [],
        }

    REPORTS.mkdir(parents=True, exist_ok=True)
    md = render_md(report)
    (REPORTS / "retrieval-latest.json").write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
    (REPORTS / "retrieval-latest.md").write_text(md, encoding="utf-8")
    if args.save_baseline:
        (REPORTS / "retrieval-baseline.json").write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
        (REPORTS / "retrieval-baseline.md").write_text(md, encoding="utf-8")
    print(md)

    rc = 0
    primary = report["modes"][modes[0]]["metrics"]
    if primary["hit@5"] < args.fail_under:
        print(f"QUALITY GATE FAILED: {modes[0]} Hit@5 {primary['hit@5']:.1%} < {args.fail_under:.0%}")
        rc = 1
    if args.compare:
        if not BASELINE.is_file():
            print("[WARN] chưa có baseline để so sánh")
        else:
            problems = compare(report, json.loads(BASELINE.read_text(encoding="utf-8")))
            for p in problems:
                print(f"REGRESSION: {p}")
            rc = rc or (1 if problems else 0)
    return rc


def main() -> int:
    sys.stdout.reconfigure(encoding="utf-8")  # console Windows mặc định cp1252
    parser = argparse.ArgumentParser()
    parser.add_argument("--mode", choices=["dense", "bm25", "hybrid", "all"], default="hybrid")
    parser.add_argument("--fail-under", type=float, default=0.90, help="Hit@5 tối thiểu của mode đầu tiên")
    parser.add_argument("--threshold", type=float, default=None,
                        help="min_score áp cho chỉ số chính (mặc định: ngưỡng production của embedding model)")
    parser.add_argument("--compare", action="store_true", help="Fail nếu tụt so với retrieval-baseline.json")
    parser.add_argument("--save-baseline", action="store_true")
    parser.add_argument("--allow-stale", action="store_true", help="Cho chạy khi index lệch knowledge (không khuyến nghị)")
    return asyncio.run(run(parser.parse_args()))


if __name__ == "__main__":
    raise SystemExit(main())
