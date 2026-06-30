"""Resolver tham chiếu kết quả trước ("cái đầu", "BS thứ 2", "rẻ nhất").

"thứ 2" ở đây là SỐ THỨ TỰ trong danh sách vừa trình, KHÔNG phải thứ-trong-tuần.
LLM trích ordinal/criteria; code map vào session.last_offered để lấy id THẬT,
không để LLM bịa id.
"""
from __future__ import annotations

from dataclasses import dataclass


@dataclass
class OfferedItem:
    index: int                      # 1-based, thứ tự hiển thị
    kind: str                       # "doctor" | "service" | "slot" | "clinic"
    id: int | str
    label: str
    price: int | None = None
    start_time: str | None = None   # ISO datetime, cho criteria "earliest"


@dataclass
class RefResolution:
    item: OfferedItem | None = None
    error_code: str | None = None   # "no_offer" | "ref_out_of_range" | "unsupported_criteria" | "no_signal"


def resolve_reference(
    *,
    offered: list[OfferedItem],
    ordinal: int | None = None,
    criteria: str | None = None,
) -> RefResolution:
    if not offered:
        return RefResolution(error_code="no_offer")

    if criteria:
        c = criteria.lower()
        if c == "cheapest":
            items = [o for o in offered if o.price is not None]
            if not items:
                return RefResolution(error_code="unsupported_criteria")
            return RefResolution(item=min(items, key=lambda o: o.price))
        if c == "earliest":
            items = [o for o in offered if o.start_time is not None]
            if not items:
                return RefResolution(error_code="unsupported_criteria")
            return RefResolution(item=min(items, key=lambda o: o.start_time))
        # "nearest" cần toạ độ -> chưa hỗ trợ V1
        return RefResolution(error_code="unsupported_criteria")

    if ordinal is not None:
        n = len(offered)
        if ordinal == -1:           # "cái cuối cùng"
            return RefResolution(item=offered[-1])
        if 1 <= ordinal <= n:
            return RefResolution(item=offered[ordinal - 1])
        return RefResolution(error_code="ref_out_of_range")

    return RefResolution(error_code="no_signal")
