"""Phase 6: metric math, BM25/RRF, hybrid retriever và golden dataset (không cần credential)."""
import json
from pathlib import Path

import pytest

from app.rag.lexical import Bm25Index, rrf_fuse, tokenize
from eval.retrieval_metrics import CaseOutcome, Retrieved, aggregate, dedupe_docs, threshold_sweep

DATASET = Path(__file__).resolve().parents[1] / "eval" / "datasets" / "retrieval.jsonl"


def _o(id_, expected, ranked, empty=False, cat="c", types=None):
    return CaseOutcome(id_, cat, id_, expected, empty, [Retrieved(f, t, s) for f, t, s in ranked], types or [])


def test_metrics_hit_recall_mrr():
    outcomes = [
        _o("a", ["x"], [("x", "disease", 0.9), ("y", "disease", 0.8)]),                       # rank 1
        _o("b", ["x", "z"], [("y", "disease", 0.9), ("x", "disease", 0.8), ("w", "d", 0.7)]),  # rank 2, recall 1/2
        _o("c", ["x"], [("y", "disease", 0.9)]),                                               # miss
    ]
    m = aggregate(outcomes, 0.0)
    assert m["hit@1"] == pytest.approx(1 / 3)
    assert m["hit@3"] == pytest.approx(2 / 3)
    assert m["recall@3"] == pytest.approx((1 + 0.5 + 0) / 3)
    assert m["mrr"] == pytest.approx((1 + 0.5 + 0) / 3)
    assert [f["id"] for f in m["failures"]] == ["c"]


def test_threshold_empty_wrong_type_and_negative_fp():
    outcomes = [
        _o("a", ["x"], [("x", "faq", 0.5)], types=["policy"]),
        _o("n", [], [("y", "disease", 0.7)], empty=True),
    ]
    m = aggregate(outcomes, 0.0)
    assert m["wrong_type_rate"] == 1.0 and m["negative_false_positive_rate"] == 1.0
    strict = aggregate(outcomes, 0.6)
    assert strict["empty_rate"] == 1.0 and strict["negative_false_positive_rate"] == 1.0
    stricter = aggregate(outcomes, 0.8)
    assert stricter["negative_false_positive_rate"] == 0.0
    sweep = threshold_sweep(outcomes, [0.0, 0.8])
    assert sweep[1]["empty_rate"] == 1.0


def test_dedupe_docs_keeps_first_rank():
    chunks = [Retrieved("a", "t", 0.9), Retrieved("b", "t", 0.8), Retrieved("a", "t", 0.7)]
    assert [c.file_id for c in dedupe_docs(chunks)] == ["a", "b"]


def test_tokenize_strips_diacritics_and_adds_bigrams():
    assert "ho khan" in tokenize("Ho khan, kéo dài") and "keo" in tokenize("kéo")


def test_bm25_prefers_matching_doc_and_ignores_no_overlap():
    idx = Bm25Index(["đau răng khôn sưng lợi", "ho khan kéo dài", "đặt lịch khám"])
    assert idx.top("dau rang khon", 1)[0][0] == 0
    assert idx.top("xyz", 3) == []


def test_rrf_rewards_agreement():
    fused = [i for i, _ in rrf_fuse([["a", "b", "c"], ["b", "a", "d"]])]
    assert fused[:2] == ["a", "b"] and set(fused) == {"a", "b", "c", "d"}


def test_golden_dataset_is_well_formed():
    rows = [json.loads(l) for l in DATASET.read_text(encoding="utf-8").splitlines() if l.strip()]
    ids = [r["id"] for r in rows]
    assert len(ids) == len(set(ids)) and len(rows) >= 60
    from app.rag.indexer import scan_docs

    known = {d.metadata["id"] for d in scan_docs(DATASET.parents[2] / "knowledge")}
    for r in rows:
        assert r["input"].strip()
        if r.get("expect_empty"):
            assert not r["expected_documents"]
        else:
            assert r["expected_documents"] and set(r["expected_documents"]) <= known, r["id"]
        assert set(r.get("types", [])) <= {"disease", "symptom", "faq", "policy"}


@pytest.mark.asyncio
async def test_hybrid_retriever_rescues_exact_term_dense_misses(tmp_path):
    """Dense giả trả thứ hạng sai; BM25 từ khoá chính xác kéo tài liệu đúng lên đầu."""
    from app.config import Settings
    from app.rag.indexer import ensure_index
    from app.rag.retriever import KnowledgeRetriever

    k = tmp_path / "k"
    for name, body in {"a": "Chuyên về răng hàm mặt", "b": "Chuyên về eczema da liễu"}.items():
        f = k / "faq" / f"{name}.md"
        f.parent.mkdir(parents=True, exist_ok=True)
        f.write_text(f"---\nid: {name}\ntype: faq\ncanonical_name: {name}\nversion: 1\n---\n# {name}\n\n## Mục\n{body}\n", encoding="utf-8")
    s = Settings(_env_file=None, knowledge_dir=str(k), chroma_dir=str(tmp_path / "c"),
                 embedding_provider="ollama", embedding_model="fake", internal_shared_secret="x" * 40)

    class Emb:
        provider, model = "ollama", "fake"

        async def embed_documents(self, texts):
            return [[1.0, 0.0] if "răng" in t else [0.9, 0.1] for t in texts]

        async def embed_query(self, text):
            return [1.0, 0.0]  # dense ưu tiên "a" bất kể câu hỏi

    emb = Emb()
    await ensure_index(s, embedder=emb)
    r = KnowledgeRetriever(knowledge_dir=k, chroma_dir=s.chroma_dir, embedder=emb, min_score=0.0)
    dense = await r.retrieve("eczema", hybrid=False)
    hybrid = await r.retrieve("eczema", hybrid=True)
    assert dense[0].file_id == "a" and hybrid[0].file_id == "b"
