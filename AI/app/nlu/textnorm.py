"""Chuẩn hoá text tiếng Việt dùng chung (resolver + policy filter)."""
from __future__ import annotations

import unicodedata


def strip_diacritics(text: str) -> str:
    """Lowercase + bỏ dấu tiếng Việt.

    "đ" (U+0111) là chữ cái riêng, NFD không tách thành "d" như các dấu thanh
    -> map tay. ư/ơ/ă/â... thì NFD xử lý được (phần dấu là combining mark Mn).
    """
    t = text.lower().strip().replace("đ", "d")
    t = unicodedata.normalize("NFD", t)
    return "".join(c for c in t if unicodedata.category(c) != "Mn")
