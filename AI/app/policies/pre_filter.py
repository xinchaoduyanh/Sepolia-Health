"""Pre-filter: chặn TRƯỚC khi vào LLM cho các ca nguy hiểm + cờ injection.

- self-harm / emergency red-flag -> block, trả refusal key (không vào LLM).
- prompt-injection -> KHÔNG block cứng (tránh false-positive), chỉ cờ để log
  + siết post-validate. Phòng thủ thật nằm ở kiến trúc (tách kênh) + ownership ở Be/.
"""
from __future__ import annotations

from dataclasses import dataclass

from app.nlu.textnorm import strip_diacritics
from app.rag.text import contains_phrase

_SELF_HARM_EXACT = ["tự tử", "tự sát"]
_SELF_HARM_COLLISIONS = ["tu tu", "tu sat"]
_SELF_HARM_SAFE = ["tu lam hai", "ket lieu doi", "khong muon song"]

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


def check(text: str) -> PreFilterResult:
    lower_text = text.lower()
    t_unsigned = strip_diacritics(text)
    is_telex = t_unsigned == lower_text.replace("đ", "d")
    
    injection = any(contains_phrase(text, p) for p in _INJECTION)
    
    has_self_harm = False
    if any(p in lower_text for p in _SELF_HARM_EXACT):
        has_self_harm = True
    if is_telex and any(contains_phrase(text, p) for p in _SELF_HARM_COLLISIONS):
        has_self_harm = True
    if any(contains_phrase(text, p) for p in _SELF_HARM_SAFE):
        has_self_harm = True

    if has_self_harm:
        return PreFilterResult(blocked=True, reason="self_harm", refusal_key="refusal-emergency",
                               injection_suspected=injection)
                               
    if any(contains_phrase(text, p) for p in _EMERGENCY):
        return PreFilterResult(blocked=True, reason="emergency", refusal_key="refusal-emergency",
                               injection_suspected=injection)
                               
    return PreFilterResult(injection_suspected=injection)
