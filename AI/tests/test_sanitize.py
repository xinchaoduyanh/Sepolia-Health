from app.agents.scheduling_agent import _strip_cjk


def test_strip_trailing_chinese_sentence():
    s = "Bạn muốn thử cơ sở khác? 或者您希望在其他地点寻找医生？"
    out = _strip_cjk(s)
    assert "或" not in out and "您" not in out
    assert out == "Bạn muốn thử cơ sở khác?"


def test_pure_vietnamese_unchanged():
    s = "Dạ, bên em có 5 cơ sở ạ. Anh/chị muốn cơ sở nào?"
    assert _strip_cjk(s) == s


def test_inline_cjk_chars_removed_keeps_vietnamese():
    s = "Cơ sở 你好 Hà Đông"
    out = _strip_cjk(s)
    assert "你" not in out and "好" not in out
    assert "Hà Đông" in out


def test_japanese_korean_also_stripped():
    assert "こんにちは" not in _strip_cjk("Xin chào こんにちは ạ.")
    assert "안녕" not in _strip_cjk("Xin chào 안녕하세요 ạ.")


def test_all_cjk_falls_back_to_safe_message():
    out = _strip_cjk("你好世界")
    assert _strip_cjk(out) == out  # idempotent
    assert out  # không rỗng
