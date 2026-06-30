"""Test resolver ngày. Cố định now = 2026-06-16 (thứ Ba) để assert ngày tuyệt đối."""
import datetime as dt

from app.nlu.vn_date import resolve_vn_date

NOW = dt.datetime(2026, 6, 16, 10, 0)  # thứ Ba


def test_thu3_tuan_sau():
    r = resolve_vn_date(now=NOW, weekday="tue", week_offset=1)
    assert r.iso_date == "2026-06-23"
    assert r.day_of_week == 1
    assert not r.ambiguous
    assert r.label == "Thứ Ba, 23/06/2026"


def test_thu2_tuan_sau():
    r = resolve_vn_date(now=NOW, weekday="mon", week_offset=1)
    assert r.iso_date == "2026-06-22"


def test_ngay_mai():
    assert resolve_vn_date(now=NOW, relative_days=1).iso_date == "2026-06-17"


def test_ngay_kia():
    assert resolve_vn_date(now=NOW, relative_days=2).iso_date == "2026-06-18"


def test_cuoi_tuan_ambiguous():
    r = resolve_vn_date(now=NOW, period="weekend")
    assert r.ambiguous
    assert [c.iso_date for c in r.candidates] == ["2026-06-20", "2026-06-21"]


def test_thu3_no_qualifier_la_hom_nay_ambiguous():
    r = resolve_vn_date(now=NOW, weekday="tue", week_offset=0)
    assert r.ambiguous
    assert [c.iso_date for c in r.candidates] == ["2026-06-16", "2026-06-23"]


def test_thu_da_qua_trong_tuan_cuon_sang_tuan_sau():
    # nay thứ Ba, hỏi "thứ 2" (đã qua) -> thứ Hai tuần sau 22/06
    r = resolve_vn_date(now=NOW, weekday="mon", week_offset=0)
    assert r.iso_date == "2026-06-22"
    assert not r.ambiguous


def test_thu2_thang_sau():
    r = resolve_vn_date(now=NOW, weekday="mon", month_offset=1)
    d = dt.date.fromisoformat(r.iso_date)
    assert d.month == 7 and d.weekday() == 0 and d.day <= 7  # thứ Hai đầu tiên của tháng 7


def test_ngay_23():
    assert resolve_vn_date(now=NOW, day_of_month=23).iso_date == "2026-06-23"


def test_ngay_5_da_qua_cuon_sang_thang_sau():
    assert resolve_vn_date(now=NOW, day_of_month=5).iso_date == "2026-07-05"


def test_no_signal():
    assert resolve_vn_date(now=NOW).error_code == "no_signal"


def test_ngay_khong_hop_le():
    assert resolve_vn_date(now=NOW, day_of_month=32).error_code == "out_of_range"


def test_co_cuon_nam():
    # tháng 12 + month_offset 1 -> tháng 1 năm sau
    now_dec = dt.datetime(2026, 12, 10, 9, 0)
    assert resolve_vn_date(now=now_dec, day_of_month=5, month_offset=1).iso_date == "2027-01-05"


def test_co_la_30_4():
    r = resolve_vn_date(now=dt.datetime(2026, 4, 29, 10, 0), relative_days=1)
    assert r.iso_date == "2026-04-30" and r.is_holiday
