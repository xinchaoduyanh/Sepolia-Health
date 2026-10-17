"""P3: toolCalls audit must store call args, not tool result summary."""
from __future__ import annotations

import pytest

from app.agents.scheduling_agent import SchedulingAgent, _sanitize_tool_args
from app.prompts.loader import PromptRegistry
from app.session.models import SessionState
from app.session.store import InMemorySessionStore
from app.tools.registry import ToolRegistry
from tests.fakes import FakeBridge, FakeProvider, chat_text, chat_tools


def test_sanitize_tool_args_redacts_secrets():
    out = _sanitize_tool_args(
        {"doctor_id": 1, "api_key": "secret123", "note": "x" * 500}
    )
    assert out["doctor_id"] == 1
    assert out["api_key"] == "[redacted]"
    assert out["note"].endswith("…")
    assert len(out["note"]) < 300


@pytest.mark.asyncio
async def test_tool_calls_audit_not_same_as_result_summary():
    bridge = FakeBridge()
    provider = FakeProvider(
        [
            chat_tools(
                (
                    "create_booking_draft",
                    {
                        "patient_profile_id": 100,
                        "doctor_id": 12,
                        "service_id": 5,
                        "start_time": "2026-06-23T09:00:00+07:00",
                    },
                )
            ),
            chat_text("recap"),
        ]
    )
    reg = PromptRegistry("prompts")
    try:
        reg.load_all()
    except FileNotFoundError:
        pass
    agent = SchedulingAgent(provider, "fake", ToolRegistry(bridge), reg)
    session = SessionState(session_id="s_audit", user_id=7)
    resp = await agent.handle_turn(session, "đặt lịch", "t1")

    assert resp.tool_calls_audit, "must record tool CALLS"
    call = resp.tool_calls_audit[0]
    assert call.name == "create_booking_draft"
    assert "doctor_id" in call.arguments
    assert call.arguments.get("service_id") == 5
    # Result summary is ok/error — different shape
    assert resp.tool_results_summary
    summary = resp.tool_results_summary[0]
    assert summary.name == "create_booking_draft"
    assert hasattr(summary, "ok")
    # Must not confuse: audit has arguments, summary has ok
    dumped_call = call.model_dump()
    dumped_sum = summary.model_dump()
    assert "arguments" in dumped_call
    assert "ok" in dumped_sum
    assert "ok" not in dumped_call
    assert "arguments" not in dumped_sum


@pytest.mark.asyncio
async def test_record_turn_stores_distinct_tool_calls_and_results():
    store = InMemorySessionStore()
    session = SessionState(session_id="s2", user_id=1)
    await store.create(session)
    await store.record_turn(
        session_id="s2",
        trace_id="tr",
        user_message="hi",
        ai_message="ok",
        tool_calls=[{"name": "search_doctors", "arguments": {"q": "Minh"}}],
        tool_results=[{"name": "search_doctors", "ok": True, "error_code": None}],
    )
    turns = store._turns["s2"]
    assert turns[0]["tool_calls"][0]["arguments"]["q"] == "Minh"
    assert turns[0]["tool_results"][0]["ok"] is True
    assert "ok" not in turns[0]["tool_calls"][0]
