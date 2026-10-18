import pytest

from app.nlu.clock_time import parse_clock_time


@pytest.mark.parametrize("text,expected", [
    ("Đặt lịch khám da liễu lúc 8h sáng thứ Ba tuần sau (20/10)", "08:00"),
    ("đổi sang 8h30 nhé", "08:30"),
    ("khoảng 2h chiều", "14:00"),
    ("14:30 được không", "14:30"),
    ("9 giờ sáng", "09:00"),
    ("7h tối", "19:00"),
    ("đổi 9h sang 10h", "10:00"),
    ("ngày 20/10", None),
    ("Xin chào", None),
])
def test_parse_clock_time(text, expected):
    assert parse_clock_time(text) == expected
