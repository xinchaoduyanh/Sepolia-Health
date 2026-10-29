"""Phase 6: chỉ số tổng hợp của E2E harness (không gọi LLM)."""
from eval.e2e.run_e2e import ScenarioResult, TurnLog, _quantile, _tally, check_turn, summarize


def _turn(fails, exp):
    t = TurnLog("x", latency=2.0, fails=list(fails))
    _tally(t, exp)
    return t


def test_tally_classifies_failure_kinds():
    t = _turn(["không gọi tool search_knowledge (đã gọi: [])"], {"tools": ["search_knowledge"]})
    assert t.tool_ok is False and t.confirm_ok is None
    t = _turn([], {"no_tools": ["confirm_booking"], "confirm": False})
    assert t.tool_ok is True and t.confirm_ok is True
    t = _turn(["requires_confirmation=True (kỳ vọng False)", "LỘ nội bộ /doctor_id/ trong reply"], {"confirm": False})
    assert t.confirm_ok is False and t.leaked is True and t.tool_ok is None


def test_summarize_flaky_and_first_try_rate():
    ok_first = ScenarioResult("a", "A", True, [_turn([], {"tools": ["t"]})], attempts=1)
    flaky = ScenarioResult("b", "B", True, [_turn([], {})], attempts=2)
    failed = ScenarioResult("c", "C", False, [_turn(["không gọi tool t (đã gọi: [])"], {"tools": ["t"]})], attempts=2)
    s = summarize([ok_first, flaky, failed])
    assert s["pass"] == 2 and s["flaky"] == ["b"] and s["failed"] == ["c"]
    assert s["tool_selection"] == [True, False]
    assert s["first_try_pass_rate"] == {"a": 1.0, "b": 0.0, "c": 0.0}


def test_summarize_repeat_groups_by_base_id():
    runs = [ScenarioResult(f"x#{i}", "X", ok, [], attempts=1) for i, ok in enumerate([True, True, False, True], 1)]
    assert summarize(runs)["first_try_pass_rate"] == {"x": 0.75}


def test_quantile_and_empty():
    assert _quantile([], 0.5) == 0.0
    assert _quantile([1.0, 2.0, 3.0, 4.0, 5.0], 0.5) == 3.0
    assert _quantile([1.0, 2.0, 3.0, 4.0, 5.0], 0.95) == 5.0


def test_check_turn_still_flags_internal_leak():
    fails = check_turn({}, {"message": "doctor_id là 5", "session_state": {"agent_state": "idle"}}, [])
    assert any(f.startswith("LỘ") for f in fails)
