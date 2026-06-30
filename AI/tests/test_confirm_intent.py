import pytest

from app.nlu.confirm_intent import ConfirmIntent, classify_confirmation


@pytest.mark.parametrize("text", ["ừ", "ok", "oke", "vâng ạ", "chốt nhé", "đồng ý", "đúng rồi", "ừ chốt nhé"])
def test_confirm(text):
    assert classify_confirmation(text) == ConfirmIntent.CONFIRM


@pytest.mark.parametrize("text", ["thôi", "hủy đi", "không", "khoan đã", "thôi để sau", "không cần đâu"])
def test_reject(text):
    assert classify_confirmation(text) == ConfirmIntent.REJECT


@pytest.mark.parametrize("text", ["cũng được", "sao cũng được", "tùy em", "gì cũng được", "thế nào cũng được"])
def test_ambiguous(text):
    assert classify_confirmation(text) == ConfirmIntent.AMBIGUOUS


@pytest.mark.parametrize("text", ["mấy giờ khám", "bác sĩ nào", ""])
def test_other(text):
    assert classify_confirmation(text) == ConfirmIntent.OTHER
