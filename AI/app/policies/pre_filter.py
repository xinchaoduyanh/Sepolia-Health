"""Pre-filter: chặn TRƯỚC khi vào LLM cho các ca nguy hiểm + cờ injection.

- self-harm / emergency red-flag -> block, trả refusal key (không vào LLM).
- prompt-injection -> KHÔNG block cứng (tránh false-positive), chỉ cờ để log
  + siết post-validate. Phòng thủ thật nằm ở kiến trúc (tách kênh) + ownership ở Be/.

Self-harm khớp theo cụm đã bỏ dấu (contains_phrase, ranh giới từ) NGOẠI TRỪ
"tu tu"/"tu sat": bỏ dấu thì "từ từ" == "tu tu" nên chỉ tin khi người dùng gõ
KHÔNG dấu hoàn toàn (telex-style); còn có dấu thì phải đúng "tự tử"/"tự sát".
"""
from __future__ import annotations

import re
from dataclasses import dataclass, field

from app.nlu.textnorm import strip_diacritics
from app.rag.text import contains_phrase

_SELF_HARM_EXACT = ["tự tử", "tự sát", "tự vẫn", "treo cổ"]
_SELF_HARM_COLLISIONS = ["tu tu", "tu sat"]
_SELF_HARM_SAFE = [
    "tu lam hai", "ket lieu doi", "ket thuc cuoc doi", "ket thuc cuoc song",
    "ket thuc doi minh", "khong muon song", "khong con muon song", "chan song",
    "muon chet", "muon bien mat khoi the gioi", "cat tay", "cat co tay",
    "nhay lau", "uong thuoc ngu de chet", "song khong con y nghia",
    "suicide", "kill myself", "end my life",
]

_EMERGENCY = [
    "kho tho", "dau nguc", "co giat", "ngat xiu", "bat tinh",
    "mau khong ngung", "sot cao co giat", "kho tho du doi",
    "dot quy", "meo mieng", "liet nua nguoi", "noi ngong",
    "ho ra mau", "non ra mau", "dai ra mau", "di ngoai ra mau", "chay mau nhieu",
    "ngo doc", "uong qua lieu", "tim dap nhanh du doi", "tuc nguc du doi",
    "khong tho duoc", "nghet tho", "sung moi luoi", "phan ung phan ve",
]
_INJECTION = [
    "bo qua huong dan", "bo qua chi thi", "bo qua moi", "bo qua cac quy tac",
    "bo qua tat ca", "quen het", "quen di",
    "ignore previous", "ignore above", "ignore all previous", "ignore your instructions",
    "disregard", "forget your instructions", "override",
    "system prompt", "developer mode", "jailbreak", "you are now",
    "ban gio la", "act as", "dong vai", "pretend",
    "in ra prompt", "lo ra prompt", "cho toi xem prompt", "hien thi prompt",
    "huong dan he thong", "reveal your prompt", "show your instructions",
]
# Cố ý đưa dữ liệu của người khác / tool nội bộ vào câu hỏi.
_INJECTION_REGEX = [
    re.compile(r"(?:x-internal-token|x-acting-user-id|internal_shared_secret)", re.I),
    re.compile(r"<\s*/?\s*(?:system|assistant|tool)\s*>", re.I),
    re.compile(r"(?m)^\s*(?:system|assistant)\s*:", re.I),
]


@dataclass
class PreFilterResult:
    blocked: bool = False
    reason: str | None = None          # "self_harm" | "emergency"
    refusal_key: str | None = None     # id prompt refusal để trả thẳng
    injection_suspected: bool = False
    matched: list[str] = field(default_factory=list)  # nhãn rule (KHÔNG chứa text người dùng)


def _injection_hits(text: str) -> list[str]:
    hits = [f"inj:{p}" for p in _INJECTION if contains_phrase(text, p)]
    hits += [f"inj_re:{i}" for i, rx in enumerate(_INJECTION_REGEX) if rx.search(text)]
    return hits


def check(text: str) -> PreFilterResult:
    lower_text = text.lower()
    t_unsigned = strip_diacritics(text)
    is_telex = t_unsigned == lower_text.replace("đ", "d")

    inj_hits = _injection_hits(text)
    injection = bool(inj_hits)

    sh_hits = [f"sh:{p}" for p in _SELF_HARM_EXACT if p in lower_text]
    if is_telex:
        sh_hits += [f"sh:{p}" for p in _SELF_HARM_COLLISIONS if contains_phrase(text, p)]
    sh_hits += [f"sh:{p}" for p in _SELF_HARM_SAFE if contains_phrase(text, p)]

    if sh_hits:
        return PreFilterResult(blocked=True, reason="self_harm", refusal_key="refusal-emergency",
                               injection_suspected=injection, matched=sh_hits + inj_hits)

    em_hits = [f"em:{p}" for p in _EMERGENCY if contains_phrase(text, p)]
    if em_hits:
        return PreFilterResult(blocked=True, reason="emergency", refusal_key="refusal-emergency",
                               injection_suspected=injection, matched=em_hits + inj_hits)

    return PreFilterResult(injection_suspected=injection, matched=inj_hits)
