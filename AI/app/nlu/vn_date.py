"""Resolver ngày tiếng Việt — fix bug kinh điển "luận sai ngày" của path DO cũ.

LLM suy luận ra THAM SỐ tương đối (weekday, week_offset, month_offset,
day_of_month, relative_days, period); hàm này dùng đồng hồ server tính ra
NGÀY tuyệt đối. LLM KHÔNG bao giờ tự cộng/trừ ra YYYY-MM-DD.

Ví dụ: hôm nay 16/06/2026 (thứ Ba), "thứ 3 tuần sau"
    -> resolve_vn_date(now=..., weekday="tue", week_offset=1) -> 2026-06-23
"""
from __future__ import annotations

from dataclasses import dataclass, field
from datetime import date, datetime, timedelta
from enum import Enum

# LLM đã chuẩn hoá: t2/thứ 2/thứ hai -> "mon", ... chủ nhật/CN -> "sun"
WEEKDAY_TOKENS = {"mon": 0, "tue": 1, "wed": 2, "thu": 3, "fri": 4, "sat": 5, "sun": 6}

_VN_DAYNAMES = {
    0: "Thứ Hai",
    1: "Thứ Ba",
    2: "Thứ Tư",
    3: "Thứ Năm",
    4: "Thứ Sáu",
    5: "Thứ Bảy",
    6: "Chủ Nhật",
}


class Period(str, Enum):
    """Khoảng trong tuần — thường mơ hồ (nhiều ngày) -> trả candidates để hỏi lại."""

    WEEKEND = "weekend"        # cuối tuần: T7, CN
    EARLY_WEEK = "early_week"  # đầu tuần: T2, T3
    MID_WEEK = "mid_week"      # giữa tuần: T4, T5


_PERIOD_WEEKDAYS = {
    Period.WEEKEND: (5, 6),
    Period.EARLY_WEEK: (0, 1),
    Period.MID_WEEK: (2, 3),
}

# Ngày lễ VN cố định theo dương lịch (tháng, ngày). Phòng khám đóng cửa.
_FIXED_SOLAR_HOLIDAYS = {(1, 1), (4, 30), (5, 1), (9, 2)}
# TODO: lễ âm lịch (Tết, Giỗ Tổ 10/3 âm) cần lib âm lịch; tạm nạp tay theo năm vào set dưới.
_EXTRA_HOLIDAYS: set[str] = set()  # ISO date string, ví dụ Tết 2026: "2026-02-17", ...


@dataclass
class Candidate:
    iso_date: str
    label: str


@dataclass
class DateResolution:
    iso_date: str | None = None
    day_of_week: int | None = None       # 0=Thứ Hai ... 6=Chủ Nhật
    label: str | None = None             # "Thứ Ba, 23/06/2026"
    ambiguous: bool = False
    candidates: list[Candidate] = field(default_factory=list)
    is_holiday: bool = False
    error_code: str | None = None        # "no_signal" | "out_of_range"


def _label(d: date) -> str:
    return f"{_VN_DAYNAMES[d.weekday()]}, {d.strftime('%d/%m/%Y')}"


def is_vn_holiday(d: date) -> bool:
    return (d.month, d.day) in _FIXED_SOLAR_HOLIDAYS or d.isoformat() in _EXTRA_HOLIDAYS


def _resolved(d: date) -> DateResolution:
    return DateResolution(
        iso_date=d.isoformat(),
        day_of_week=d.weekday(),
        label=_label(d),
        is_holiday=is_vn_holiday(d),
    )


def _monday_of_week(d: date) -> date:
    return d - timedelta(days=d.weekday())


def _target_month(today: date, month_offset: int) -> tuple[int, int]:
    """Trả (year, month) sau khi cộng month_offset, tự cuộn năm."""
    total = today.year * 12 + (today.month - 1) + month_offset
    year, month0 = divmod(total, 12)
    return year, month0 + 1


def resolve_vn_date(
    *,
    now: datetime | date,
    weekday: str | None = None,
    week_offset: int = 0,
    month_offset: int = 0,
    day_of_month: int | None = None,
    relative_days: int | None = None,
    period: str | None = None,
) -> DateResolution:
    """Resolve cụm thời gian tương đối -> ngày tuyệt đối.

    Thứ tự ưu tiên tín hiệu: relative_days > day_of_month > period > weekday.
    """
    today = now.date() if isinstance(now, datetime) else now

    # 0. Không có tín hiệu ngày nào -> agent hỏi "ngày nào ạ?"
    if weekday is None and day_of_month is None and relative_days is None and period is None:
        return DateResolution(error_code="no_signal")

    # 1. relative_days thắng tuyệt đối (ngày mai=1, ngày kia/mốt=2)
    if relative_days is not None:
        return _resolved(today + timedelta(days=relative_days))

    # 2. day_of_month (+ month_offset), tự cuộn nếu ngày đã qua
    if day_of_month is not None:
        year, month = _target_month(today, month_offset)
        try:
            target = date(year, month, day_of_month)
        except ValueError:
            return DateResolution(error_code="out_of_range")
        if month_offset == 0 and target < today:
            year, month = _target_month(today, 1)
            try:
                target = date(year, month, day_of_month)
            except ValueError:
                return DateResolution(error_code="out_of_range")
        return _resolved(target)

    # 3. period (cuối tuần / đầu tuần / giữa tuần) -> thường ambiguous
    target_monday = _monday_of_week(today) + timedelta(days=7 * week_offset)
    if period is not None:
        try:
            p = Period(period)
        except ValueError:
            return DateResolution(error_code="out_of_range")
        days = [target_monday + timedelta(days=i) for i in _PERIOD_WEEKDAYS[p]]
        if week_offset == 0:
            future = [d for d in days if d >= today]
            if not future:  # cả khoảng đã qua trong tuần này -> tuần sau
                nm = target_monday + timedelta(days=7)
                future = [nm + timedelta(days=i) for i in _PERIOD_WEEKDAYS[p]]
            days = future
        if len(days) == 1:
            return _resolved(days[0])
        return DateResolution(
            ambiguous=True,
            candidates=[Candidate(d.isoformat(), _label(d)) for d in days],
        )

    # 4. weekday (+ week_offset hoặc + month_offset)
    if weekday not in WEEKDAY_TOKENS:
        return DateResolution(error_code="out_of_range")
    wd = WEEKDAY_TOKENS[weekday]

    # "thứ 2 tháng sau" -> thứ Hai ĐẦU TIÊN của tháng đích
    if month_offset != 0:
        year, month = _target_month(today, month_offset)
        first = date(year, month, 1)
        target = first + timedelta(days=(wd - first.weekday()) % 7)
        return _resolved(target)

    target = target_monday + timedelta(days=wd)
    if week_offset == 0:
        if target == today:
            # Hôm nay đúng thứ đó -> tuần này hay tuần sau? Hỏi lại.
            nxt = target + timedelta(days=7)
            return DateResolution(
                ambiguous=True,
                candidates=[
                    Candidate(target.isoformat(), _label(target)),
                    Candidate(nxt.isoformat(), _label(nxt)),
                ],
            )
        if target < today:
            target += timedelta(days=7)  # thứ đã qua trong tuần -> hiểu là tuần sau
    return _resolved(target)
