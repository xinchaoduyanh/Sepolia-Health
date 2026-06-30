"""Post-validate: quét response của LLM SAU khi sinh.

Bắt: (1) khẳng định chẩn đoán ("bạn bị ...", "chẩn đoán là"),
(2) markdown rác (```json), (3) rò rỉ system prompt / internal token,
(4) nhắc bệnh ngoài allowlist (truyền vào disallowed_terms từ Phase 04).
"""
from __future__ import annotations

import re
from dataclasses import dataclass, field

from app.nlu.textnorm import strip_diacritics

_DIAGNOSIS = [
    "ban bi", "ban dang bi", "chan doan la", "ket luan ban", "ban mac",
    "chac chan ban bi",
]
_LEAK = ["x-internal-token", "internal_shared_secret", "system prompt:"]
_CODE_FENCE = re.compile(r"```")


@dataclass
class PostValidateResult:
    violated: bool = False
    reasons: list[str] = field(default_factory=list)


def check(text: str, disallowed_terms: list[str] | None = None) -> PostValidateResult:
    res = PostValidateResult()
    t = strip_diacritics(text)

    if any(p in t for p in _DIAGNOSIS):
        res.violated = True
        res.reasons.append("diagnosis_assertion")
    if _CODE_FENCE.search(text):
        res.violated = True
        res.reasons.append("markdown_code_fence")
    if any(p in t for p in _LEAK):
        res.violated = True
        res.reasons.append("possible_leak")
    if disallowed_terms:
        hit = [term for term in disallowed_terms if strip_diacritics(term) in t]
        if hit:
            res.violated = True
            res.reasons.append("disallowed_mention:" + ",".join(hit))

    return res
