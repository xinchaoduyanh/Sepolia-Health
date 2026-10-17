"""P1: recap thẻ xác nhận phải khớp draft sẽ được confirm (service/doctor/time)."""
from __future__ import annotations

import pytest

from app.agents.scheduling_agent import SchedulingAgent
from app.prompts.loader import PromptRegistry
from app.session.models import AgentState, SessionState
from app.tools.registry import ToolRegistry
from tests.fakes import FakeBridge, FakeProvider, chat_text, chat_tools


def _agent(provider, bridge) -> SchedulingAgent:
    reg = PromptRegistry("prompts")
    try:
        reg.load_all()
    except FileNotFoundError:
        pass
    return SchedulingAgent(provider, "fake", ToolRegistry(bridge), reg)


@pytest.mark.asyncio
async def test_proposed_payload_ignores_mismatched_llm_args_when_recap_present():
    """Nếu bridge trả recap_data (source of truth) thì payload thẻ KHÔNG lấy service từ LLM args."""
    bridge = FakeBridge(
        create_booking_draft={
            "draft_id": "draft_real",
            "expires_at": "soon",
            "conflicts": [],
            "recap_data": {
                "doctor_id": 12,
                "doctor_name": "Canh",
                "service_id": 5,
                "service_name": "Khám mắt & đo thị lực",
                "start_time": "2026-06-23T09:00:00+07:00",
                "price": 300000,
                "clinic_name": "Hà Đông",
                "patient_profile_id": 100,
                "patient_name": "Nguyen Van A",
            },
        }
    )
    # LLM cố tình đưa service_id=99 (sai) trong tool args — payload phải vẫn là 5 từ recap.
    provider = FakeProvider(
        [
            chat_tools(
                (
                    "create_booking_draft",
                    {
                        "patient_profile_id": 100,
                        "doctor_id": 12,
                        "service_id": 99,
                        "start_time": "2026-06-23T09:00:00+07:00",
                    },
                )
            ),
            chat_text("recap model tự viết sẽ bị thay"),
        ]
    )
    agent = _agent(provider, bridge)
    session = SessionState(session_id="s1", user_id=7)
    resp = await agent.handle_turn(session, "đặt lịch", "t1")

    assert resp.requires_confirmation
    assert resp.proposed_action.payload["draft_id"] == "draft_real"
    assert resp.proposed_action.payload["service_id"] == 5
    assert resp.proposed_action.payload["service_name"] == "Khám mắt & đo thị lực"
    assert "Khám mắt & đo thị lực" in resp.message
    assert resp.proposed_action.payload.get("service_id") != 99


def test_idempotency_key_includes_service_id():
    """Đổi service_id phải sinh key khác — tránh reuse draft dịch vụ khác."""
    key_a = ToolRegistry._idem("sess", 100, 12, 5, "2026-06-23T09:00:00+07:00")
    key_b = ToolRegistry._idem("sess", 100, 12, 7, "2026-06-23T09:00:00+07:00")
    key_same = ToolRegistry._idem("sess", 100, 12, 5, "2026-06-23T09:00:00+07:00")
    assert key_a == key_same
    assert key_a != key_b
