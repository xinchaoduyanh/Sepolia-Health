"""Chỉ số retrieval thuần (không I/O) để unit-test được mà không cần credential.

Đơn vị xếp hạng là TÀI LIỆU: chunk cùng file_id được gộp, giữ thứ hạng của chunk đầu tiên.
"""
from __future__ import annotations

from dataclasses import dataclass, field

KS = (1, 3, 5)


@dataclass
class Retrieved:
    file_id: str
    type: str
    score: float  # similarity (dense) hoặc điểm quy đổi; dùng cho ngưỡng


@dataclass
class CaseOutcome:
    id: str
    category: str
    input: str
    expected: list[str]
    expect_empty: bool
    ranked: list[Retrieved]  # đã gộp theo tài liệu, giảm dần
    types: list[str] = field(default_factory=list)


def dedupe_docs(chunks: list[Retrieved]) -> list[Retrieved]:
    seen: set[str] = set()
    out: list[Retrieved] = []
    for c in chunks:
        if c.file_id not in seen:
            seen.add(c.file_id)
            out.append(c)
    return out


def _above(ranked: list[Retrieved], threshold: float) -> list[Retrieved]:
    return [r for r in ranked if r.score >= threshold]


def case_metrics(o: CaseOutcome, threshold: float) -> dict:
    ranked = _above(o.ranked, threshold)
    ids = [r.file_id for r in ranked]
    exp = set(o.expected)
    m: dict = {"returned": len(ranked), "top": ids[:5]}
    if o.expect_empty:
        m["false_positive"] = len(ranked) > 0
        return m
    for k in KS:
        got = set(ids[:k])
        m[f"hit@{k}"] = bool(exp & got)
        m[f"recall@{k}"] = len(exp & got) / len(exp) if exp else 1.0
    rr = 0.0
    for rank, i in enumerate(ids, start=1):
        if i in exp:
            rr = 1.0 / rank
            break
    m["rr"] = rr
    m["empty"] = len(ranked) == 0
    if o.types and ranked:
        m["wrong_type_top1"] = ranked[0].type not in o.types
    return m


def _mean(xs: list[float]) -> float:
    return sum(xs) / len(xs) if xs else 0.0


def aggregate(outcomes: list[CaseOutcome], threshold: float) -> dict:
    pos = [(o, case_metrics(o, threshold)) for o in outcomes if not o.expect_empty]
    neg = [(o, case_metrics(o, threshold)) for o in outcomes if o.expect_empty]
    agg: dict = {"threshold": threshold, "positive_cases": len(pos), "negative_cases": len(neg)}
    for k in KS:
        agg[f"hit@{k}"] = _mean([float(m[f"hit@{k}"]) for _, m in pos])
        agg[f"recall@{k}"] = _mean([m[f"recall@{k}"] for _, m in pos])
    agg["mrr"] = _mean([m["rr"] for _, m in pos])
    agg["empty_rate"] = _mean([float(m["empty"]) for _, m in pos])
    typed = [m for _, m in pos if "wrong_type_top1" in m]
    agg["wrong_type_rate"] = _mean([float(m["wrong_type_top1"]) for m in typed])
    agg["negative_false_positive_rate"] = _mean([float(m["false_positive"]) for _, m in neg])
    cats: dict[str, dict] = {}
    for cat in sorted({o.category for o, _ in pos}):
        rows = [m for o, m in pos if o.category == cat]
        cats[cat] = {
            "n": len(rows),
            "hit@1": _mean([float(m["hit@1"]) for m in rows]),
            "hit@5": _mean([float(m["hit@5"]) for m in rows]),
            "mrr": _mean([m["rr"] for m in rows]),
        }
    for cat in sorted({o.category for o, _ in neg}):
        rows = [m for o, m in neg if o.category == cat]
        cats[cat] = {"n": len(rows), "false_positive_rate": _mean([float(m["false_positive"]) for m in rows])}
    agg["by_category"] = cats
    agg["failures"] = [
        {"id": o.id, "input": o.input, "expected": o.expected, "got": m["top"]}
        for o, m in pos
        if not m["hit@5"]
    ]
    agg["false_positives"] = [
        {"id": o.id, "input": o.input, "got": m["top"]} for o, m in neg if m["false_positive"]
    ]
    return agg


def threshold_sweep(outcomes: list[CaseOutcome], thresholds: list[float]) -> list[dict]:
    rows = []
    for t in thresholds:
        a = aggregate(outcomes, t)
        rows.append(
            {
                "threshold": t,
                "hit@5": a["hit@5"],
                "mrr": a["mrr"],
                "empty_rate": a["empty_rate"],
                "negative_false_positive_rate": a["negative_false_positive_rate"],
            }
        )
    return rows
