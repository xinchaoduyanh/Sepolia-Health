from app.nlu.timeofday import filter_slots, pick_earliest, resolve_time_window

SLOTS = ["08:00", "09:30", "11:00", "13:00", "14:30", "17:30", "19:00"]


def test_chieu():
    w = resolve_time_window(time_preference="afternoon")
    assert filter_slots(SLOTS, w) == ["13:00", "14:30"]


def test_sang():
    w = resolve_time_window(time_preference="morning")
    assert filter_slots(SLOTS, w) == ["08:00", "09:30", "11:00"]


def test_sau_5h():
    w = resolve_time_window(time_from="17:00")
    assert filter_slots(SLOTS, w) == ["17:30", "19:00"]


def test_tam_9_10h():
    w = resolve_time_window(time_from="09:00", time_to="10:00")
    assert filter_slots(SLOTS, w) == ["09:30"]


def test_bien_buoi_khop_luong_dat_lich():
    # Khớp app đặt lịch: slot bắt đầu TRƯỚC 12:00 là sáng (11:30 vẫn sáng),
    # chiều chạy tới 17:30 nên slot 17:00 không bị rớt.
    boundary = ["11:30", "12:00", "17:00", "17:30"]
    assert filter_slots(boundary, resolve_time_window(time_preference="morning")) == ["11:30"]
    assert filter_slots(boundary, resolve_time_window(time_preference="afternoon")) == ["12:00", "17:00"]


def test_som_nhat():
    assert pick_earliest(SLOTS) == "08:00"


def test_khong_rang_buoc_chi_sort():
    assert filter_slots(["13:00", "08:00"], None) == ["08:00", "13:00"]
