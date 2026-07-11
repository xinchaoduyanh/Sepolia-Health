"""Phân loại ý định xác nhận/phủ định — chốt an toàn để KHÔNG tạo lịch nhầm.

Đây là lớp deterministic (defense): dù LLM phân loại thế nào, guard ở agent
chỉ gọi confirm_booking khi intent == CONFIRM. "cũng được / tùy" KHÔNG phải
đồng ý -> AMBIGUOUS -> hỏi lại dứt khoát.
"""
from __future__ import annotations

import re
from enum import Enum

from app.nlu.textnorm import strip_diacritics


class ConfirmIntent(str, Enum):
    CONFIRM = "confirm"
    REJECT = "reject"
    AMBIGUOUS = "ambiguous"
    OTHER = "other"


# Thứ tự kiểm tra: AMBIGUOUS -> REJECT -> CONFIRM (vì "cũng được" chứa "được",
# "không đồng ý" chứa "đồng ý"; phủ định/mơ hồ phải thắng khẳng định).
_AMBIGUOUS = ["cung duoc", "sao cung", "the nao cung", "gi cung", "deu duoc", "tuy"]
_CONFIRM_STRONG = ["thoi duoc", "khong van de", "khong sao", "dat di", "chot di", "xac nhan"]
_REJECT = ["thoi", "huy", "khong", "khoan", "de sau", "dung lai", "bo qua", "cancel", "stop", "khong can"]
_CONFIRM = [
    "ok", "oke", "okay", "uk", "uki", "u", "um", "vang", "dung", "chot",
    "dong y", "duoc", "yes", "co", "nhat tri", "xac nhan", "chuan",
]


def classify_confirmation(text: str) -> ConfirmIntent:
    t = strip_diacritics(text)
    words = set(re.findall(r"[a-z0-9]+", t))

    def has(patterns: list[str]) -> bool:
        # cụm nhiều từ -> substring; từ đơn -> match nguyên từ (tránh false-positive)
        return any((p in t) if " " in p else (p in words) for p in patterns)

    if has(_AMBIGUOUS):
        return ConfirmIntent.AMBIGUOUS
    if has(_CONFIRM_STRONG):
        return ConfirmIntent.CONFIRM
    if has(_REJECT):
        return ConfirmIntent.REJECT
    if has(_CONFIRM):
        return ConfirmIntent.CONFIRM
    return ConfirmIntent.OTHER
