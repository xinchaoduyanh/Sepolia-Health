"""Test SchedulingAgent với FakeProvider + FakeBridge — không cần Ollama/Be."""
from datetime import datetime, timedelta, timezone
from pathlib import Path

import pytest

from app.agents.scheduling_agent import SchedulingAgent
from app.prompts.loader import PromptRegistry
from app.rag.emergency import EmergencyDetector
from app.rag.models import RetrievedChunk
from app.rag.policy import KnowledgePolicy
from app.session.models import AgentState, PendingConfirmation, SessionState
from app.tools.registry import ToolRegistry
from tests.fakes import FakeBridge, FakeProvider, chat_text, chat_tools

PROMPTS = Path(__file__).resolve().parents[1] / "prompts"
VN = timezone(timedelta(hours=7))


def _prompts() -> PromptRegistry:
    reg = PromptRegistry(PROMPTS)
    reg.load_all()
    return reg


def _agent(provider, bridge) -> SchedulingAgent:
    tools = ToolRegistry(bridge, now_fn=lambda: datetime(2026, 6, 16, 10, 0, tzinfo=VN))
    return SchedulingAgent(provider, "fake-model", tools, _prompts())


class FakeRetriever:
    def __init__(self) -> None:
        self.calls: list[str] = []

    async def retrieve(self, query, top_k=5, filter_types=None, allowed_only=True):
        self.calls.append(query)
        return [
            RetrievedChunk(
                file_id="viem-hong-cap",
                canonical_name="Viêm họng cấp",
                type="disease",
                text="Gợi ý khám Tai mũi họng khi đau họng kéo dài.",
                metadata={"allowed_for_ai_mention": True},
                similarity_score=0.92,
            )
        ]


def _session(**kw) -> SessionState:
    return SessionState(session_id="s1", user_id=7, **kw)


async def test_happy_path_creates_draft_then_books():
    # Turn 1: LLM gọi create_booking_draft -> rồi sinh recap (không tool)
    provider = FakeProvider([
        chat_tools(("create_booking_draft", {"patient_profile_id": 100, "doctor_id": 12, "service_id": 5, "start_time": "2026-06-23T09:00:00+07:00"})),
        chat_text("Em đã tạo bản nháp khám với BS. Vương Hữu Canh lúc 09:00, 23/06. Anh/chị xác nhận giúp em nhé?"),
    ])
    bridge = FakeBridge()
    agent = _agent(provider, bridge)
    session = _session()

    resp = await agent.handle_turn(session, "đặt BS Canh 9h thứ 3 tuần sau", "t1")
    assert session.agent_state == AgentState.AWAITING_CONFIRMATION
    assert resp.requires_confirmation is True
    assert resp.proposed_action.kind == "create_booking"
    assert session.pending_confirmation.draft_id == "draft_1"

    # Turn 2: user "vâng" -> confirm thật
    resp2 = await agent.handle_turn(session, "vâng", "t2")
    assert session.agent_state == AgentState.BOOKED
    assert ("confirm_booking", "draft_1") in bridge.calls
    assert "thành công" in resp2.message


async def test_ambiguous_confirmation_does_not_book():
    bridge = FakeBridge()
    agent = _agent(FakeProvider([]), bridge)  # provider không được gọi ở nhánh confirm
    session = _session(
        agent_state=AgentState.AWAITING_CONFIRMATION,
        pending_confirmation=PendingConfirmation(draft_id="draft_1", idempotency_key="draft_1"),
    )

    resp = await agent.handle_turn(session, "cũng được", "t1")
    assert session.agent_state == AgentState.AWAITING_CONFIRMATION  # vẫn chờ
    assert not any(c[0] == "confirm_booking" for c in bridge.calls)   # KHÔNG đặt
    assert "xác nhận" in resp.message.lower()


async def test_reject_confirmation_cancels():
    bridge = FakeBridge()
    agent = _agent(FakeProvider([]), bridge)
    session = _session(
        agent_state=AgentState.AWAITING_CONFIRMATION,
        pending_confirmation=PendingConfirmation(draft_id="draft_1", idempotency_key="draft_1"),
    )
    await agent.handle_turn(session, "thôi không cần đâu", "t1")
    assert session.agent_state == AgentState.COLLECTING
    assert session.pending_confirmation is None
    assert not any(c[0] == "confirm_booking" for c in bridge.calls)


async def test_emergency_blocks_before_llm():
    provider = FakeProvider([])  # phải KHÔNG được gọi
    agent = _agent(provider, FakeBridge())
    session = _session()

    resp = await agent.handle_turn(session, "tôi bị khó thở và đau ngực dữ dội", "t1")
    assert session.agent_state == AgentState.FAILED
    assert "115" in resp.message
    assert provider.calls == []  # không vào LLM


async def test_rag_emergency_detector_blocks_high_fever():
    provider = FakeProvider([])
    agent = SchedulingAgent(
        provider,
        "fake-model",
        ToolRegistry(FakeBridge()),
        _prompts(),
        emergency_detector=EmergencyDetector(Path(__file__).resolve().parents[1] / "knowledge"),
    )
    session = _session()

    resp = await agent.handle_turn(session, "tôi sốt 40 độ", "t1")

    assert session.agent_state == AgentState.FAILED
    assert "115" in resp.message
    assert provider.calls == []


async def test_symptom_query_adds_knowledge_to_prompt():
    provider = FakeProvider([chat_text("Anh/chị nên đặt lịch khám Tai mũi họng ạ.")])
    retriever = FakeRetriever()
    agent = SchedulingAgent(
        provider,
        "fake-model",
        ToolRegistry(FakeBridge()),
        _prompts(),
        retriever=retriever,
    )
    session = _session()

    await agent.handle_turn(session, "em bị đau họng và ho khan", "t1")

    assert retriever.calls == ["em bị đau họng và ho khan"]
    system_prompt = provider.calls[0][0]["content"]
    assert "Viêm họng cấp" in system_prompt
    assert "Tai mũi họng" in system_prompt


async def test_blocked_disease_mention_in_output_is_refused():
    # LLM tự nhắc bệnh CẤM (ung thư) trong câu trả lời -> phải bị chặn, thay bằng refusal.
    provider = FakeProvider([chat_text("Theo mô tả, có thể anh/chị bị ung thư dạ dày.")])
    agent = SchedulingAgent(
        provider,
        "fake-model",
        ToolRegistry(FakeBridge()),
        _prompts(),
        knowledge_policy=KnowledgePolicy(Path(__file__).resolve().parents[1] / "knowledge"),
    )
    session = _session()

    resp = await agent.handle_turn(session, "dạo này trong người không khỏe", "t1")

    assert "ung thư" not in resp.message.lower()
    assert "chẩn đoán" in resp.message.lower()  # refusal-diagnosis


async def test_slot_taken_on_confirm_rolls_back():
    bridge = FakeBridge(confirm_booking={"error_code": "slot_taken"})
    agent = _agent(FakeProvider([]), bridge)
    session = _session(
        agent_state=AgentState.AWAITING_CONFIRMATION,
        pending_confirmation=PendingConfirmation(draft_id="draft_1", idempotency_key="draft_1"),
    )
    resp = await agent.handle_turn(session, "vâng", "t1")
    assert session.agent_state == AgentState.SLOT
    assert "giờ khác" in resp.message
