"""Pre-filter: chặn TRƯỚC khi vào LLM cho các ca nguy hiểm + cờ injection.

- self-harm / emergency red-flag -> block, trả refusal key (không vào LLM).
- prompt-injection -> KHÔNG block cứng (tránh false-positive), chỉ cờ để log
  + siết post-validate. Phòng thủ thật nằm ở kiến trúc (tách kênh) + ownership ở Be/.
"""
from __future__ import annotations

from dataclasses import dataclass

from app.nlu.textnorm import strip_diacritics

# tất cả pattern viết dạng đã bỏ dấu (so khớp với strip_diacritics)
_SELF_HARM = ["tu sat", "tu tu", "tu lam hai", "ket lieu doi", "khong muon song"]
_EMERGENCY = [
    "kho tho", "dau nguc", "co giat", "ngat xiu", "bat tinh",
    "mau khong ngung", "sot cao co giat", "kho tho du doi",
]
_INJECTION = [
    "bo qua huong dan", "bo qua chi thi", "bo qua moi", "quen het", "quen di",
    "ignore previous", "ignore above", "system prompt", "ban gio la",
    "act as", "dong vai", "in ra prompt", "lo ra prompt",
]


@dataclass
class PreFilterResult:
    blocked: bool = False
    reason: str | None = None          # "self_harm" | "emergency"
    refusal_key: str | None = None     # id prompt refusal để trả thẳng
    injection_suspected: bool = False


def _has(text: str, patterns: list[str]) -> bool:
    return any(p in text for p in patterns)


def check(text: str) -> PreFilterResult:
    t = strip_diacritics(text)
    injection = _has(t, _INJECTION)

    if _has(t, _SELF_HARM):
        return PreFilterResult(blocked=True, reason="self_harm", refusal_key="refusal-emergency",
                               injection_suspected=injection)
    if _has(t, _EMERGENCY):
        return PreFilterResult(blocked=True, reason="emergency", refusal_key="refusal-emergency",
                               injection_suspected=injection)
    return PreFilterResult(injection_suspected=injection)
