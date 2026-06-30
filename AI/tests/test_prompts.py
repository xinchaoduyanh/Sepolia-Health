from pathlib import Path

import pytest

from app.prompts.loader import PromptRegistry, PromptValidationError

PROMPTS = Path(__file__).resolve().parents[1] / "prompts"


def _registry() -> PromptRegistry:
    reg = PromptRegistry(PROMPTS)
    reg.load_all()
    return reg


def test_load_system_prompt():
    p = _registry().get("scheduling-copilot")
    assert p.kind == "system" and p.version == 1 and p.status == "active"


def test_refusals_loaded():
    reg = _registry()
    for rid in ["refusal-diagnosis", "refusal-emergency", "refusal-out-of-scope"]:
        assert reg.get(rid).kind == "refusal"


def test_render_fills_known_leaves_unknown():
    out = _registry().render("scheduling-copilot", {"TODAY_VN": "Thứ Ba, 16/06/2026"})
    assert "16/06/2026" in out
    assert "{{CALENDAR_STRIP}}" in out  # không truyền -> giữ nguyên


def test_skip_underscore_and_readme():
    reg = _registry()
    with pytest.raises(KeyError):
        reg.get("_version-log")


def test_invalid_frontmatter_missing_id(tmp_path):
    (tmp_path / "bad.md").write_text("---\nkind: system\nversion: 1\n---\nbody", encoding="utf-8")
    with pytest.raises(PromptValidationError):
        PromptRegistry(tmp_path).load_all()


def test_duplicate_active_version(tmp_path):
    fm = "---\nid: dup\nkind: policy\nversion: {v}\nstatus: active\n---\nx"
    (tmp_path / "a.md").write_text(fm.format(v=1), encoding="utf-8")
    (tmp_path / "b.md").write_text(fm.format(v=2), encoding="utf-8")
    with pytest.raises(PromptValidationError):
        PromptRegistry(tmp_path).load_all()
