"""Redact PII (SĐT, CCCD/CMND, email) khỏi text trước khi log / lưu AiTurn."""
from __future__ import annotations

import re
from typing import Any

_EMAIL = re.compile(r"[A-Za-z0-9._%+\-]+@[A-Za-z0-9\-]+(?:\.[A-Za-z0-9\-]+)+")
# +84 / 84 / 0 + đầu số 3,5,7,8,9 + 8 chữ số, cho phép . - khoảng trắng giữa nhóm.
_PHONE = re.compile(r"(?<!\d)(?:\+?84|0)[\s.\-]?[35789](?:[\s.\-]?\d){8}(?!\d)")
# CCCD 12 số, CMND 9 số (đứng riêng, không dính số dài hơn).
_ID_NUMBER = re.compile(r"(?<![\d])(?:\d{12}|\d{9})(?![\d])")

_SECRET_KEYS = ("token", "secret", "password", "authorization", "api_key", "apikey")


def redact_text(text: str | None) -> str | None:
    if not text:
        return text
    out = _EMAIL.sub("[EMAIL]", text)
    out = _PHONE.sub("[PHONE]", out)
    out = _ID_NUMBER.sub("[ID_NUMBER]", out)
    return out


def redact_obj(value: Any) -> Any:
    """Đệ quy redact string trong dict/list; key kiểu secret -> [redacted]."""
    if isinstance(value, str):
        return redact_text(value)
    if isinstance(value, list):
        return [redact_obj(v) for v in value]
    if isinstance(value, tuple):
        return tuple(redact_obj(v) for v in value)
    if isinstance(value, dict):
        return {
            k: "[redacted]" if isinstance(k, str) and any(s in k.lower() for s in _SECRET_KEYS)
            else redact_obj(v)
            for k, v in value.items()
        }
    return value
