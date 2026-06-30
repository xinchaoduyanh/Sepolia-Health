from __future__ import annotations

import re
import unicodedata


def normalize_vi(text: str) -> str:
    lowered = text.lower()
    decomposed = unicodedata.normalize("NFD", lowered)
    no_marks = "".join(ch for ch in decomposed if unicodedata.category(ch) != "Mn")
    no_marks = no_marks.replace("đ", "d")
    # Mọi dấu phân tách (-, /, _, dấu câu, khoảng trắng) -> 1 space, để
    # "HIV-AIDS" / "HIV/AIDS" / "ung-thu" khớp cùng dạng "hiv aids" / "ung thu".
    return re.sub(r"[^a-z0-9]+", " ", no_marks).strip()


def contains_phrase(text: str, phrase: str) -> bool:
    haystack = normalize_vi(text)
    needle = normalize_vi(phrase)
    if not needle:
        return False
    return re.search(rf"(^|\W){re.escape(needle)}($|\W)", haystack) is not None
