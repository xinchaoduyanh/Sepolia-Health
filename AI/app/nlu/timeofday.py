"""Resolver giờ trong ngày.

LLM map "sáng/chiều/tối", "sau 5h", "tầm 9-10h" -> tham số (time_preference
hoặc time_from/time_to). Code giữ BIÊN GIỜ cứng + lọc slot. LLM không tự
định nghĩa "chiều là mấy giờ" và không tự chọn slot "sớm nhất".
"""
from __future__ import annotations

from dataclasses import dataclass
from datetime import time
from enum import Enum


class TimePreference(str, Enum):
    MORNING = "morning"
    NOON = "noon"
    AFTERNOON = "afternoon"
    EVENING = "evening"
    OFFICE = "office"        # giờ hành chính
    SPECIFIC = "specific"    # user nói giờ cụ thể -> dùng time_from/time_to


# Biên giờ mặc định (cứng trong code, configurable). GMT+7.
# MORNING kết thúc 12:00 để khớp luồng đặt lịch của app (slot bắt đầu trước
# 12:00 là buổi sáng -> slot 11:30-12:00 vẫn thuộc sáng). Nửa mở [start, end).
_DEFAULT_WINDOWS: dict[TimePreference, tuple[time, time]] = {
    TimePreference.MORNING: (time(6, 0), time(12, 0)),
    TimePreference.NOON: (time(11, 0), time(13, 30)),
    TimePreference.AFTERNOON: (time(12, 0), time(17, 30)),
    TimePreference.EVENING: (time(17, 0), time(21, 0)),
    TimePreference.OFFICE: (time(8, 0), time(17, 30)),
}


@dataclass
class TimeWindow:
    start: time
    end: time  # nửa mở: [start, end)


def _parse(hhmm: str) -> time:
    h, m = hhmm.strip().split(":")
    return time(int(h), int(m))


def resolve_time_window(
    *,
    time_preference: str | None = None,
    time_from: str | None = None,
    time_to: str | None = None,
) -> TimeWindow | None:
    """Trả khoảng giờ để lọc slot. None = không ràng buộc giờ."""
    if time_from or time_to:
        start = _parse(time_from) if time_from else time(0, 0)
        end = _parse(time_to) if time_to else time(23, 59)
        return TimeWindow(start, end)
    if time_preference:
        tp = TimePreference(time_preference)
        if tp == TimePreference.SPECIFIC:
            return None
        start, end = _DEFAULT_WINDOWS[tp]
        return TimeWindow(start, end)
    return None


def filter_slots(slots: list[str], window: TimeWindow | None) -> list[str]:
    """Lọc + sort slot ("HH:MM") theo window. window=None -> chỉ sort."""
    ordered = sorted(slots, key=_parse)
    if window is None:
        return ordered
    return [s for s in ordered if window.start <= _parse(s) < window.end]


def pick_earliest(slots: list[str]) -> str | None:
    """"sớm nhất / càng sớm càng tốt" -> code chọn, KHÔNG để LLM đoán."""
    return min(slots, key=_parse) if slots else None
