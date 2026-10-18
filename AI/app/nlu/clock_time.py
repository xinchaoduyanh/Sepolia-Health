"""Trích giờ đồng hồ user nêu ("8h sáng", "8h30", "14:30", "2h chiều") -> "HH:MM".

Tất định (không LLM): giờ user vừa nói được lưu vào session để model không 'quên' rồi hỏi lại.
"""
from __future__ import annotations

import re

_CLOCK = re.compile(
    r"(?<![\d/])(\d{1,2})\s*(?:h|giờ|:)\s*(\d{2})?\s*(?:phút)?\s*(sáng|trưa|chiều|tối)?",
    re.IGNORECASE,
)


def parse_clock_time(text: str) -> str | None:
    """Trả giờ cuối cùng user nêu trong câu (giờ cuối thắng: 'đổi 9h sang 10h' -> 10:00)."""
    found: str | None = None
    for m in _CLOCK.finditer(text or ""):
        hour, minute, period = int(m.group(1)), int(m.group(2) or 0), (m.group(3) or "").lower()
        if hour > 23 or minute > 59:
            continue
        if period in ("chiều", "tối") and hour < 12:
            hour += 12
        elif period == "trưa" and 1 <= hour <= 5:
            hour += 12
        elif not period and 1 <= hour <= 6:  # "2h" không kèm buổi -> giờ chiều (phòng khám không mở 1-6h sáng)
            hour += 12
        found = f"{hour:02d}:{minute:02d}"
    return found
