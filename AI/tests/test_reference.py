from app.nlu.reference import OfferedItem, resolve_reference

OFFERED = [
    OfferedItem(1, "doctor", 12, "BS A", price=300_000, start_time="2026-06-23T09:00:00+07:00"),
    OfferedItem(2, "doctor", 15, "BS B", price=200_000, start_time="2026-06-23T14:00:00+07:00"),
    OfferedItem(3, "doctor", 18, "BS C", price=500_000, start_time="2026-06-23T08:00:00+07:00"),
]


def test_ordinal_thu_2():
    assert resolve_reference(offered=OFFERED, ordinal=2).item.id == 15


def test_ordinal_cuoi_cung():
    assert resolve_reference(offered=OFFERED, ordinal=-1).item.id == 18


def test_ordinal_out_of_range():
    assert resolve_reference(offered=OFFERED, ordinal=5).error_code == "ref_out_of_range"


def test_re_nhat():
    assert resolve_reference(offered=OFFERED, criteria="cheapest").item.id == 15


def test_som_nhat():
    assert resolve_reference(offered=OFFERED, criteria="earliest").item.id == 18


def test_chua_co_danh_sach():
    assert resolve_reference(offered=[], ordinal=1).error_code == "no_offer"


def test_criteria_khong_ho_tro():
    assert resolve_reference(offered=OFFERED, criteria="nearest").error_code == "unsupported_criteria"
