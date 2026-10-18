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

from unittest.mock import MagicMock

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

    async def retrieve(self, query, top_k=5, filter_types=None, allowed_only=True, min_score: float = 0.45):
        self.calls.append(query)
        if query == "rỗng":
            return []
        chunks = [
            RetrievedChunk(
                file_id="viem-hong-cap",
                canonical_name="Viêm họng cấp",
                type="disease",
                text="Gợi ý khám Tai mũi họng khi đau họng kéo dài." + " padding" * 200,
                metadata={"allowed_for_ai_mention": True},
                similarity_score=0.92,
            ),
            RetrievedChunk(
                file_id="rac",
                canonical_name="Rác",
                type="disease",
                text="Chunk rác",
                metadata={"allowed_for_ai_mention": True},
                similarity_score=0.2,
            )
        ]
        return [c for c in chunks if c.similarity_score >= min_score]


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
    # Thẻ/payload chỉ lấy từ recap_data (DB), khớp draft sẽ confirm — không tin args LLM lệch.
    assert resp.proposed_action.payload["service_id"] == 5
    assert resp.proposed_action.payload["service_name"] == "Service#5"
    assert "Service#5" in resp.message

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


async def test_expired_confirmation_does_not_book():
    # Yêu cầu xác nhận quá TTL (10') -> dù user đồng ý cũng KHÔNG thực thi,
    # session về COLLECTING (nút cũ trong lịch sử chat phải vô hiệu).
    from datetime import datetime, timedelta, timezone

    bridge = FakeBridge()
    agent = _agent(FakeProvider([]), bridge)
    session = _session(
        agent_state=AgentState.AWAITING_CONFIRMATION,
        pending_confirmation=PendingConfirmation(
            draft_id="draft_1",
            idempotency_key="draft_1",
            created_at=datetime.now(timezone.utc) - timedelta(minutes=11),
        ),
    )

    resp = await agent.handle_turn(session, "vâng", "t1")
    assert session.agent_state == AgentState.COLLECTING
    assert session.pending_confirmation is None
    assert not any(c[0] == "confirm_booking" for c in bridge.calls)
    assert "quá hạn" in resp.message


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


async def test_unkept_promise_gets_nudged_and_retried():
    # Model trả "để em kiểm tra..." KHÔNG kèm tool call -> agent không chấp nhận,
    # nudge và gọi lại; user chỉ thấy câu trả lời thật (lần 2).
    provider = FakeProvider([
        chat_text("Dạ vâng, để em kiểm tra lịch trống của các bác sĩ ạ."),
        chat_text("Dạ sáng Thứ Sáu 17/07 có BS. An trống lúc 08:00 và 09:30, anh chọn giờ nào ạ?"),
    ])
    agent = _agent(provider, FakeBridge())
    session = _session()

    resp = await agent.handle_turn(session, "tìm bác sĩ mắt sáng thứ 6 ở Hà Đông", "t1")
    assert "08:00" in resp.message          # câu trả lời thật, không phải lời hứa
    assert "để em kiểm tra" not in resp.message.lower()
    assert len(provider.calls) == 2          # đã bị ép chạy lại đúng 1 lần


async def test_normal_reply_not_nudged():
    # Câu trả lời bình thường (không hứa suông) -> không tốn thêm call nào.
    provider = FakeProvider([chat_text("Dạ anh muốn khám chuyên khoa nào ạ?")])
    agent = _agent(provider, FakeBridge())
    session = _session()

    resp = await agent.handle_turn(session, "tôi muốn đặt lịch", "t1")
    assert resp.message == "Dạ anh muốn khám chuyên khoa nào ạ?"
    assert len(provider.calls) == 1


async def test_emergency_blocks_before_llm():
    provider = FakeProvider([])  # phải KHÔNG được gọi
    agent = _agent(provider, FakeBridge())
    session = _session()

    resp = await agent.handle_turn(session, "tôi bị khó thở và đau ngực dữ dội", "t1")
    assert session.agent_state == AgentState.COLLECTING
    assert "115" in resp.message
    assert "chuyên khoa phù hợp" in resp.message
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

    assert session.agent_state == AgentState.COLLECTING
    assert "115" in resp.message
    assert "chuyên khoa phù hợp" in resp.message
    assert provider.calls == []


async def test_search_knowledge_tool():
    retriever = FakeRetriever()
    tools = ToolRegistry(FakeBridge(), retriever=retriever)
    
    res = await tools.execute("search_knowledge", {"query": "đau họng", "types": ["disease"]}, session_id="s1")
    assert len(res["chunks"]) == 1
    assert res["chunks"][0]["canonical_name"] == "Viêm họng cấp"
    assert len(res["chunks"][0]["text"]) <= 1200
    
    res2 = await tools.execute("search_knowledge", {"query": "rỗng", "types": ["disease"]}, session_id="s1")
    assert len(res2["chunks"]) == 0
    assert "hỏi thêm" in res2["note"]


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
    # Draft chết -> pending phải bị xoá, không thì session kẹt (SLOT + pending treo).
    assert session.pending_confirmation is None


def test_create_booking_draft_exposed_in_slot_state():
    # Sau confirm fail session ở SLOT — model phải thấy create_booking_draft để
    # tạo lại bản nháp, không thì kẹt vĩnh viễn ở slot_selection.
    from app.tools.registry import ToolRegistry

    registry = ToolRegistry(FakeBridge())
    names = [t["function"]["name"] for t in registry.openai_schemas(AgentState.SLOT)]
    assert "create_booking_draft" in names


async def test_history_injection_into_prompt_messages():
    provider = FakeProvider([chat_text("Dạ em nghe.")])
    agent = _agent(provider, FakeBridge())
    session = _session()
    
    history = [
        ("hello", "hello there"),
        ("what services do you have?", "we have general checkup")
    ]
    
    await agent.handle_turn(session, "that is cool", "t1", history=history)
    
    sent_messages = provider.calls[0]
    
    assert len(sent_messages) == 6
    assert sent_messages[0]["role"] == "system"
    assert sent_messages[1]["role"] == "user" and sent_messages[1]["content"] == "hello"
    assert sent_messages[2]["role"] == "assistant" and sent_messages[2]["content"] == "hello there"
    assert sent_messages[3]["role"] == "user" and sent_messages[3]["content"] == "what services do you have?"
    assert sent_messages[4]["role"] == "assistant" and sent_messages[4]["content"] == "we have general checkup"
    assert sent_messages[5]["role"] == "user" and sent_messages[5]["content"] == "that is cool"


async def test_last_offered_population_from_search_doctors():
    provider = FakeProvider([
        chat_tools(("search_doctors", {"q": "Minh"})),
        chat_text("Here are the doctors.")
    ])
    
    fake_doctors = {
        "doctors": [
            {"id": 42, "first_name": "Minh", "last_name": "Nguyễn Văn", "specialty": "Nội khoa"},
            {"id": 43, "first_name": "Minh", "last_name": "Trần Văn", "specialty": "Ngoại khoa"}
        ]
    }
    
    bridge = FakeBridge(search_doctors=fake_doctors)
    agent = _agent(provider, bridge)
    session = _session()
    
    await agent.handle_turn(session, "find doctor Minh", "t1")
    
    assert len(session.last_offered) == 2
    assert session.last_offered[0].kind == "doctor"
    assert session.last_offered[0].id == 42
    assert session.last_offered[0].label == "BS. Nguyễn Văn Minh"
    assert session.last_offered[1].kind == "doctor"
    assert session.last_offered[1].id == 43
    assert session.last_offered[1].label == "BS. Trần Văn Minh"


async def test_patient_context_injection():
    # Setup provider to return a response
    provider = FakeProvider([chat_text("Dạ, chào anh A.")])
    
    # Setup bridge with a specific patient summary
    bridge = MagicMock()
    # mock get_patient_summary to return mock data
    async def get_summary(user_id):
        return {
            "patient_profile_id": 123,
            "full_name": "Nguyễn Văn Anh",
            "age": 28,
            "gender": "MALE",
            "default_clinic": "Sepolia Cầu Giấy",
            "last_visit": {
                "date": "2026-06-10",
                "doctor_name": "BS. Vương Hữu Canh",
                "specialty": "Da liễu",
                "clinic_name": "Sepolia Hoàn Kiếm"
            }
        }
    bridge.get_patient_summary = get_summary
    
    agent = _agent(provider, bridge)
    session = _session()
    
    # Run turn
    await agent.handle_turn(session, "chào em", "t1")
    
    # Verify patient_summary is cached
    assert session.patient_summary is not None
    assert session.patient_summary["full_name"] == "Nguyễn Văn Anh"
    
    # Verify prompt contains Nguyễn Văn Anh and age 28
    sent_messages = provider.calls[0]
    system_msg = next(m["content"] for m in sent_messages if m["role"] == "system")
    assert "Nguyễn Văn Anh" in system_msg
    assert "28" in system_msg
    assert "Sepolia Cầu Giấy" in system_msg
    assert "BS. Vương Hữu Canh" in system_msg


async def test_get_patient_history_tool_execution():
    # Setup provider to call get_patient_history tool, and then respond with text
    provider = FakeProvider([
        chat_tools(("get_patient_history", {"user_id": 7})),
        chat_text("Lần trước bác sĩ dặn uống thuốc đầy đủ.")
    ])
    
    fake_history = {
        "history": [
            {
                "appointment_id": 99,
                "date": "2026-06-10",
                "doctor_name": "BS. Vương Hữu Canh",
                "specialty": "Da liễu",
                "clinic_name": "Sepolia Hoàn Kiếm",
                "result": {
                    "diagnosis": "Viêm da cơ địa",
                    "notes": "Hạn chế đồ cay nóng",
                    "recommendations": "Tái khám sau 2 tuần",
                    "prescription": "Thuốc bôi ngoài da"
                }
            }
        ]
    }
    
    bridge = FakeBridge(get_patient_history=fake_history)
    agent = _agent(provider, bridge)
    session = _session()
    
    resp = await agent.handle_turn(session, "lần trước tôi khám kết quả thế nào?", "t1")
    
    # Verify the tool was called
    assert len(resp.tool_results_summary) == 1
    assert resp.tool_results_summary[0].name == "get_patient_history"
    assert resp.tool_results_summary[0].ok is True


async def test_cancel_appointment_flow():
    # Turn 1: LLM calls request_cancel_booking -> agent transitions to AWAITING_CONFIRMATION
    provider = FakeProvider([
        chat_tools(("get_my_upcoming_appointments", {"user_id": 1})),
        chat_tools(("request_cancel_booking", {"appointment_id": 99})),
        chat_text("Anh/chị xác nhận hủy lịch hẹn khám này nhé?"),
    ])
    bridge = FakeBridge(get_upcoming_appointments={"appointments": [
        {"id": 99, "doctor_name": "BS. Test", "service_name": "Khám", "start_time": "2030-01-01T09:00:00+07:00", "status": "BOOKED"}
    ]})
    agent = _agent(provider, bridge)
    session = _session()

    resp = await agent.handle_turn(session, "tôi muốn hủy lịch ngày mai", "t1")
    assert session.agent_state == AgentState.AWAITING_CONFIRMATION
    assert resp.requires_confirmation is True
    assert resp.proposed_action.kind == "cancel_booking"
    assert session.pending_confirmation.draft_id == "cancel_99"

    # Turn 2: user "vâng" -> confirm cancel
    resp2 = await agent.handle_turn(session, "vâng", "t2")
    assert session.agent_state == AgentState.COLLECTING
    # Verify the cancel_appointment tool was executed in bridge
    assert ("cancel_appointment", 99) in bridge.calls
    assert session.pending_confirmation is None
    assert "hủy" in resp2.message.lower()


async def test_booking_requirements_caching():
    # Setup provider to call tools
    provider = FakeProvider([
        chat_tools(
            ("resolve_date", {"weekday": "tue", "week_offset": 1}),
            ("get_doctor_availability", {"doctor_id": 12, "date": "2026-06-23", "service_id": 5})
        ),
        chat_text("Bác sĩ có lịch trống vào 9:00.")
    ])
    bridge = FakeBridge()
    agent = _agent(provider, bridge)
    session = _session()

    await agent.handle_turn(session, "Đặt lịch khám da liễu bác sĩ Canh thứ 3 tuần sau", "t1")

    # Verify requirements are populated
    assert session.booking_requirement.doctor_id == 12
    assert session.booking_requirement.service_id == 5
    assert session.booking_requirement.date == "2026-06-23"

    # Turn 2: verify requirements are rendered in system prompt
    provider.calls.clear()
    provider._responses = [chat_text("Dạ anh/chị chọn giờ nào ạ?")]
    await agent.handle_turn(session, "chọn 9h", "t2")
    
    sent_messages = provider.calls[0]
    system_msg = next(m["content"] for m in sent_messages if m["role"] == "system")
    assert "ID nội bộ: 12" in system_msg
    assert "Dịch vụ ID: 5" in system_msg
    assert "Ngày khám: 2026-06-23" in system_msg





async def test_cancel_rejects_appointment_id_not_from_list():
    """LLM bịa appointment_id (không có trong danh sách vừa tra) → không vào AWAITING_CONFIRMATION."""
    provider = FakeProvider([
        chat_tools(("get_my_upcoming_appointments", {"user_id": 1})),
        chat_tools(("request_cancel_booking", {"appointment_id": 12345})),
        chat_text("Em chưa xác định được lịch cần hủy, anh/chị cho em biết lại nhé."),
    ])
    bridge = FakeBridge(get_upcoming_appointments={"appointments": [
        {"id": 99, "doctor_name": "BS. Test", "service_name": "Khám", "start_time": "2030-01-01T09:00:00+07:00", "status": "BOOKED"}
    ]})
    agent = _agent(provider, bridge)
    session = _session()
    resp = await agent.handle_turn(session, "tôi muốn hủy lịch", "t1")
    assert session.agent_state != AgentState.AWAITING_CONFIRMATION
    assert resp.requires_confirmation is False
    assert session.pending_confirmation is None


async def test_llm_cannot_claim_booking_success():
    """LLM nói 'đặt lịch thành công' khi chưa có xác nhận → bị chặn và ép viết lại."""
    provider = FakeProvider([
        chat_text("Dạ, lịch khám của anh đã được xác nhận thành công."),
        chat_text("Em chưa đặt được, anh xác nhận lại giúp em nhé."),
    ])
    agent = _agent(provider, FakeBridge())
    session = _session()
    resp = await agent.handle_turn(session, "cũng được", "t1")
    assert "thành công" not in resp.message
    assert "ungrounded_success_claim" in resp.policy_violations


async def test_llm_cannot_invent_availability_without_tool():
    provider = FakeProvider([
        chat_text("Bác sĩ còn lịch trống lúc 10:00 và 14:00 ạ."),
        chat_tools(("get_doctor_availability", {"doctor_id": 12, "date": "2030-01-01", "service_id": 5})),
        chat_text("Bác sĩ còn lịch trống lúc 09:00 và 14:00 ạ."),
    ])
    agent = _agent(provider, FakeBridge())
    session = _session()
    resp = await agent.handle_turn(session, "bác sĩ 12 còn giờ nào", "t1")
    assert [a.name for a in resp.tool_calls_audit] == ["get_doctor_availability"]
    assert "ungrounded_availability_claim" in resp.policy_violations


async def test_change_request_while_awaiting_goes_to_llm_not_stale_confirm():
    """'đổi sang 10h' khi đang chờ xác nhận không được bị nuốt (rồi 'vâng' chốt giờ cũ)."""
    provider = FakeProvider([chat_text("Dạ khung 10:00 anh muốn đổi sang, anh cho em biết bác sĩ nào ạ?")])
    agent = _agent(provider, FakeBridge())
    session = _session()
    session.agent_state = AgentState.AWAITING_CONFIRMATION
    from app.session.models import PendingConfirmation
    session.pending_confirmation = PendingConfirmation(draft_id="draft_1", idempotency_key="k")
    await agent.handle_turn(session, "đổi sang 10h nhé", "t1")
    assert session.pending_confirmation is None
    assert provider.calls  # LLM được gọi


async def test_llm_cannot_claim_draft_created_without_tool():
    provider = FakeProvider([
        chat_text("Vâng, em đã tạo bản nháp đặt lịch cho anh, anh xác nhận giúp em nhé."),
        chat_tools(("resolve_patient_profile", {"user_id": 1})),
        chat_text("Anh cho em xin thêm giờ khám mong muốn ạ?"),
    ])
    agent = _agent(provider, FakeBridge())
    session = _session()
    resp = await agent.handle_turn(session, "tạo giúp mình", "t1")
    assert "ungrounded_draft_claim" in resp.policy_violations
    assert "đã tạo bản nháp" not in resp.message


async def test_parallel_draft_with_lookup_is_deferred_then_retried():
    """create_booking_draft chung lô với search_* (id đoán mò) bị hoãn, vòng sau mới chạy."""
    provider = FakeProvider([
        chat_tools(("search_services", {"q": "da liễu"}), ("create_booking_draft", {
            "patient_profile_id": 100, "doctor_id": 12, "service_id": 999, "start_time": "2030-01-01T09:00:00+07:00"})),
        chat_tools(("create_booking_draft", {
            "patient_profile_id": 100, "doctor_id": 12, "service_id": 5, "start_time": "2030-01-01T09:00:00+07:00"})),
        chat_text("Anh xác nhận giúp em nhé."),
    ])
    bridge = FakeBridge()
    agent = _agent(provider, bridge)
    session = _session()
    await agent.handle_turn(session, "đặt lịch", "t1")
    drafts = [c for c in bridge.calls if c[0] == "create_booking_draft"]
    assert len(drafts) == 1 and drafts[0][2] == 5  # chỉ lần gọi sau (service_id=5) chạm bridge


async def test_booking_draft_uses_session_profile_id_not_llm_value():
    """LLM điền patient_profile_id bịa (999) -> agent ghi đè bằng id thật từ Be (100)."""
    provider = FakeProvider([
        chat_tools(("create_booking_draft", {
            "patient_profile_id": 999, "doctor_id": 12, "service_id": 5, "start_time": "2030-01-01T09:00:00+07:00"})),
        chat_text("Anh xác nhận giúp em nhé."),
    ])
    bridge = FakeBridge()
    agent = _agent(provider, bridge)
    session = _session()
    await agent.handle_turn(session, "đặt lịch", "t1")
    assert session.patient_profile_id == 100
    assert bridge.calls and bridge.calls[0][0] == "create_booking_draft"


def test_format_booking_dt_converts_utc_to_vietnam_time():
    from app.agents.scheduling_agent import _format_booking_dt
    assert _format_booking_dt("2026-10-20T01:30:00.000Z").startswith("08:30")
    assert _format_booking_dt("2026-10-20T09:00:00+07:00").startswith("09:00")
    assert _format_booking_dt("2026-10-20T09:00:00").startswith("09:00")


async def test_agreement_without_draft_call_is_nudged_to_create_draft():
    """User 'đúng rồi, tạo giúp mình' mà model chỉ nói 'đã tìm thấy dịch vụ' → ép gọi create_booking_draft."""
    provider = FakeProvider([
        chat_text("Dạ em đã tìm thấy dịch vụ Khám da liễu rồi ạ."),
        chat_tools(("create_booking_draft", {
            "patient_profile_id": 100, "doctor_id": 12, "service_id": 5, "start_time": "2030-01-01T09:00:00+07:00"})),
        chat_text("Anh xác nhận giúp em nhé."),
    ])
    bridge = FakeBridge()
    agent = _agent(provider, bridge)
    session = _session()
    session.booking_requirement.doctor_id = 12
    resp = await agent.handle_turn(session, "đúng rồi, tạo giúp mình", "t1")
    assert "agreed_but_no_draft_nudge" in resp.policy_violations
    assert resp.requires_confirmation is True and session.pending_confirmation is not None


async def test_bare_agreement_without_booking_context_not_nudged():
    provider = FakeProvider([chat_text("Dạ vâng ạ, anh cần em hỗ trợ gì thêm không?")])
    agent = _agent(provider, FakeBridge())
    session = _session()
    resp = await agent.handle_turn(session, "vâng", "t1")
    assert "agreed_but_no_draft_nudge" not in resp.policy_violations


async def test_failed_draft_call_then_false_claim_is_blocked_and_renudged():
    """Gọi create_booking_draft nhưng lỗi, rồi model vẫn nói 'đã tạo bản nháp' → bị chặn, ép thử lại."""
    class FailThenOk(FakeBridge):
        n = 0

        async def create_booking_draft(self, *a, **k):
            FailThenOk.n += 1
            if FailThenOk.n == 1:
                return {"error_code": "service_not_found"}
            return await super().create_booking_draft(*a, **k)

    args = {"patient_profile_id": 100, "doctor_id": 12, "service_id": 5, "start_time": "2030-01-01T09:00:00+07:00"}
    provider = FakeProvider([
        chat_tools(("create_booking_draft", args)),
        chat_text("Dạ em đã tạo bản nháp cho anh rồi ạ."),
        chat_tools(("create_booking_draft", args)),
        chat_text("Anh xác nhận giúp em nhé."),
    ])
    agent = _agent(provider, FailThenOk())
    session = _session()
    session.booking_requirement.doctor_id = 12
    resp = await agent.handle_turn(session, "đúng rồi, tạo giúp mình", "t1")
    assert resp.requires_confirmation is True and session.pending_confirmation is not None
    assert "ungrounded_draft_claim" in resp.policy_violations
