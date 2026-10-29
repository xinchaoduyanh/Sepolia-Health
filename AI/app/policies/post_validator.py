"""Post-validate: quét response của LLM SAU khi sinh.

Bắt: (1) khẳng định chẩn đoán ("bạn bị ...", "chẩn đoán là"),
(2) markdown rác (```json), (3) rò rỉ system prompt / internal token / secret,
(4) nhắc bệnh ngoài allowlist (truyền vào disallowed_terms từ Phase 04),
(5) khuyến nghị thuốc / chỉnh liều (scope safety).

Khớp theo cụm đã bỏ dấu, có ranh giới từ. Câu hỏi ("Bạn bị đau bao lâu rồi?")
và câu điều kiện ("Nếu bạn bị dị ứng...") KHÔNG phải khẳng định chẩn đoán.
"""
from __future__ import annotations

import re
from dataclasses import dataclass, field

from app.nlu.textnorm import strip_diacritics

_DIAGNOSIS = [
    "ban bi", "ban dang bi", "chan doan la", "ket luan ban", "ban mac",
    "chac chan ban bi", "ban co the bi", "ban co kha nang bi", "co the ban bi",
    "day la dau hieu cua", "day chinh la benh", "anh bi", "chi bi",
    "ban da mac", "ban dang mac", "ban dich thuc",
]
# Cụm điều kiện làm câu không còn là khẳng định ("nếu bạn bị...").
_CONDITIONAL = re.compile(r"\b(neu|khi|truong hop|du|giu su|truoc khi|co phai|hay cho em biet)\b")
_MEDICATION = [
    "ban nen uong", "ban nen dung", "hay uong thuoc", "ke don cho",
    "lieu luong", "uong moi ngay", "tu y dung thuoc", "dung thuoc gi",
    "toi khuyen ban uong", "nen uong thuoc", "uong thuoc khang sinh",
    "anh nen uong", "chi nen uong", "lieu dung", "tang lieu", "giam lieu",
    "ngung thuoc", "bo thuoc", "uong them thuoc", "ban co the uong",
    "nen dung thuoc", "hay dung thuoc", "mua thuoc",
]
_DOSAGE = re.compile(r"\b\d+(?:[.,]\d+)?\s*(?:mg|mcg|ml|vien|goi)\b(?:\s*/?\s*(?:ngay|lan|bua))?")
_LEAK = [
    "x-internal-token", "internal_shared_secret", "system prompt:", "ai_internal",
    "x-acting-user-id", "bridge_token", "api_key", "api key", "secret key",
    "tool_calls", "function_call", "cac huong dan he thong cua toi",
    "toi duoc huong dan rang",
]
# Secret-looking tokens, bất kể đã bỏ dấu hay chưa.
_SECRET_RE = re.compile(
    r"(?:AIza[0-9A-Za-z_\-]{20,}|sk-[A-Za-z0-9]{20,}|Bearer\s+[A-Za-z0-9._\-]{20,}"
    r"|eyJ[A-Za-z0-9_\-]{10,}\.[A-Za-z0-9_\-]{10,}\.[A-Za-z0-9_\-]{5,}"
    r"|postgres(?:ql)?://\S+|-----BEGIN [A-Z ]*PRIVATE KEY-----)"
)
_CODE_FENCE = re.compile(r"```")
_SENTENCE_SPLIT = re.compile(r"(?<=[.!?\n])")


@dataclass
class PostValidateResult:
    violated: bool = False
    reasons: list[str] = field(default_factory=list)


def _has(t: str, phrase: str) -> bool:
    return re.search(rf"(?<![a-z0-9]){re.escape(phrase)}(?![a-z0-9])", t) is not None


def _is_diagnosis_assertion(t: str) -> bool:
    for sentence in _SENTENCE_SPLIT.split(t):
        s = sentence.strip()
        if not s or s.endswith("?") or _CONDITIONAL.search(s):
            continue
        if any(_has(s, p) for p in _DIAGNOSIS):
            return True
    return False


def check(text: str, disallowed_terms: list[str] | None = None) -> PostValidateResult:
    res = PostValidateResult()
    t = strip_diacritics(text)

    if _is_diagnosis_assertion(t):
        res.violated = True
        res.reasons.append("diagnosis_assertion")
    if any(_has(t, p) for p in _MEDICATION) or _DOSAGE.search(t):
        res.violated = True
        res.reasons.append("medication_advice")
    if _CODE_FENCE.search(text):
        res.violated = True
        res.reasons.append("markdown_code_fence")
    if any(p in t for p in _LEAK) or _SECRET_RE.search(text):
        res.violated = True
        res.reasons.append("possible_leak")
    if disallowed_terms:
        hit = [term for term in disallowed_terms if strip_diacritics(term) in t]
        if hit:
            res.violated = True
            res.reasons.append("disallowed_mention:" + ",".join(hit))

    return res
