"""BM25 từ vựng (tiếng Việt, không phụ thuộc dịch vụ ngoài) + RRF để trộn với dense.

Token hoá: bỏ dấu + unigram và bigram âm tiết ("dau rang", "ho khan") — tiếng Việt là
đa âm tiết nên bigram bắt cụm từ y khoa tốt hơn unigram đơn thuần.
"""
from __future__ import annotations

import math
from collections import Counter
from typing import Sequence

from app.rag.text import normalize_vi


def tokenize(text: str) -> list[str]:
    syll = normalize_vi(text).split()
    return syll + [f"{a} {b}" for a, b in zip(syll, syll[1:])]


class Bm25Index:
    def __init__(self, texts: Sequence[str], k1: float = 1.5, b: float = 0.75) -> None:
        self._k1, self._b = k1, b
        self._tf = [Counter(tokenize(t)) for t in texts]
        self._len = [sum(c.values()) for c in self._tf]
        self._avg = (sum(self._len) / len(self._len)) if self._len else 0.0
        df: Counter[str] = Counter()
        for c in self._tf:
            df.update(c.keys())
        n = len(self._tf)
        self._idf = {t: math.log(1 + (n - d + 0.5) / (d + 0.5)) for t, d in df.items()}

    def scores(self, query: str) -> list[float]:
        q = set(tokenize(query))
        out: list[float] = []
        for tf, ln in zip(self._tf, self._len):
            s = 0.0
            for term in q:
                f = tf.get(term)
                if not f:
                    continue
                denom = f + self._k1 * (1 - self._b + self._b * ln / (self._avg or 1.0))
                s += self._idf.get(term, 0.0) * f * (self._k1 + 1) / denom
            out.append(s)
        return out

    def top(self, query: str, k: int) -> list[tuple[int, float]]:
        ranked = sorted(enumerate(self.scores(query)), key=lambda x: x[1], reverse=True)
        return [(i, s) for i, s in ranked[:k] if s > 0]


def rrf_fuse(rankings: Sequence[Sequence[str]], k: int = 60) -> list[tuple[str, float]]:
    """Reciprocal Rank Fusion trên danh sách id đã xếp hạng."""
    scores: dict[str, float] = {}
    for ranking in rankings:
        for rank, item in enumerate(ranking, start=1):
            scores[item] = scores.get(item, 0.0) + 1.0 / (k + rank)
    return sorted(scores.items(), key=lambda x: x[1], reverse=True)
