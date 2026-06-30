"""SchedulingAgent — decision loop + state machine + chốt an toàn confirm.

Luồng 1 turn:
  pre_filter → (nếu đang chờ confirm: confirm_intent) → tool-calling loop với
  provider → post_validate → cập nhật state. Tool DATA-only; ngày qua resolve_date;
  confirm CHỈ khi user đồng ý rõ (guard bằng confirm_intent).
"""
from __future__ import annotations

import json
import logging
import re
from datetime import datetime, timedelta, timezone
from typing import Protocol

from app.agents.state_machine import ensure_transition
from app.api.schemas import MessageResponse, ProposedAction, ToolResultSummary
from app.nlu.confirm_intent import ConfirmIntent, classify_confirmation
from app.policies import post_validator, pre_filter
from app.prompts.loader import PromptRegistry
from app.providers.base import AIProvider
from app.rag.emergency import EmergencyDetector
from app.rag.models import RetrievedChunk
from app.rag.policy import KnowledgePolicy
from app.session.models import AgentState, OfferedItem, PendingConfirmation, SessionState
from app.tools.registry import ToolRegistry

_VN_TZ = timezone(timedelta(hours=7))
_VN_DAYS = ["Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu", "Thứ Bảy", "Chủ Nhật"]
_MAX_ITERS = 5
_LOG = logging.getLogger(__name__)
# Cổng kích hoạt RAG: nếu câu user chạm 1 hint -> truy hồi knowledge gợi ý chuyên
# khoa. PHẢI bám theo knowledge/ (mỗi khi thêm bệnh/triệu chứng mới, bổ sung hint).
# Tránh token quá ngắn dễ khớp nhầm văn xuôi (vd bare "ợ"/"tê").
_SYMPTOM_HINTS = (
    "triệu chứng", "trieu chung",
    # hô hấp / toàn thân
    "sốt", "sot", "ho", "đau", "dau", "khó thở", "kho tho",
    "buồn nôn", "buon non", "chóng mặt", "chong mat", "mệt", "met",
    # da liễu
    "mụn", "mun", "ngứa", "ngua", "mẩn", "man do", "mề đay", "viêm da",
    # tâm lý / giấc ngủ
    "mất ngủ", "mat ngu", "lo âu", "lo au", "lo lắng", "lo lang",
    "căng thẳng", "stress", "trầm cảm",
    # tiêu hoá
    "tiêu chảy", "tieu chay", "khó tiêu", "kho tieu", "ợ chua", "ợ hơi",
    "ợ nóng", "đầy bụng", "trào ngược", "trao nguoc", "nghẹn",
    # răng hàm mặt
    "răng", "rang", "sâu răng",
    # nhãn khoa
    "mắt", "khô mắt", "đỏ mắt", "mỏi mắt",
    # cơ xương khớp
    "vai gáy", "vai gay", "đau lưng", "dau lung", "thoát vị", "thoat vi",
    # sản phụ khoa
    "khí hư", "khi hu", "âm đạo", "am dao",
    # dinh dưỡng
    "béo phì", "beo phi", "thừa cân", "thua can", "giảm cân", "tăng cân",
)

# Qwen (model gốc Trung) thỉnh thoảng code-switch sang tiếng Trung/Nhật/Hàn.
# Dải CJK + hiragana/katakana/hangul + dấu câu full-width.
_CJK = re.compile(
    r"[　-〿぀-ヿ㐀-䶿一-鿿가-힯＀-￯]"
)


def _strip_cjk(text: str) -> str:
    """Loại bỏ tiếng Trung/CJK rò rỉ khỏi output. Ưu tiên bỏ NGUYÊN câu chứa CJK
    (Qwen hay chèn câu dịch ở cuối); nếu CJK lẫn giữa câu thì xoá ký tự lẻ."""
    if not _CJK.search(text):
        return text
    parts = re.split(r"(?<=[.!?…\n])\s+", text)
    cleaned = " ".join(p for p in parts if not _CJK.search(p)).strip()
    if not cleaned:  # CJK nằm lẫn trong câu, không phải câu dịch riêng
        cleaned = re.sub(r"\s{2,}", " ", _CJK.sub("", text)).strip()
    return cleaned or "Dạ, anh/chị cho em hỏi rõ thêm để hỗ trợ ạ?"


class Retriever(Protocol):
    async def retrieve(self, query: str, top_k: int = 5, filter_types: list[str] | None = None,
                       allowed_only: bool = True) -> list[RetrievedChunk]: ...


def _today_vn() -> datetime:
    return datetime.now(_VN_TZ)


def _calendar_strip(now: datetime, days: int = 10) -> str:
    monday = now.date() - timedelta(days=now.date().weekday())
    parts = []
    for i in range(-1, days):
        d = now.date() + timedelta(days=i)
        week = "tuần này" if monday <= d < monday + timedelta(days=7) else "tuần sau"
        tag = " - Hôm nay" if i == 0 else ""
        parts.append(f"{_VN_DAYS[d.weekday()]} {d.strftime('%d/%m')} [{week}]{tag}")
    return ", ".join(parts)


def _is_symptom_query(text: str) -> bool:
    lower = text.lower()
    return any(hint in lower for hint in _SYMPTOM_HINTS)


def _doctor_label(item: dict) -> str:
    """Tên bác sĩ theo thứ tự tiếng Việt: Họ + Tên (last_name + first_name)."""
    full = f"{item.get('last_name') or ''} {item.get('first_name') or ''}".strip()
    return f"BS. {full}" if full else "Bác sĩ"


def _extract_offered(tool_name: str, result: dict | None) -> list[OfferedItem]:
    """Map kết quả tool (DATA) -> danh sách OfferedItem (kèm ID thật) để lưu vào
    session.last_offered. Chỉ map các shape đã biết; tool khác trả rỗng."""
    if not isinstance(result, dict) or result.get("error_code"):
        return []
    items: list[OfferedItem] = []

    if tool_name in ("search_doctors", "find_available_doctors"):
        for d in result.get("doctors") or []:
            doctor_id = d.get("id", d.get("doctor_id"))
            if doctor_id is None:
                continue
            items.append(OfferedItem(
                index=len(items) + 1, kind="doctor", id=doctor_id, label=_doctor_label(d),
            ))
    elif tool_name == "search_services":
        for s in result.get("services") or []:
            if s.get("id") is None:
                continue
            items.append(OfferedItem(
                index=len(items) + 1, kind="service", id=s["id"],
                label=s.get("name") or "Dịch vụ", price=s.get("price"),
            ))
    elif tool_name == "search_clinics":
        for c in result.get("clinics") or []:
            if c.get("id") is None:
                continue
            items.append(OfferedItem(
                index=len(items) + 1, kind="clinic", id=c["id"], label=c.get("name") or "Cơ sở",
            ))
    elif tool_name == "get_doctor_availability":
        date = result.get("date")
        for slot in result.get("available_slots") or []:
            items.append(OfferedItem(
                index=len(items) + 1, kind="slot", id=slot, label=slot,
                start_time=f"{date}T{slot}:00+07:00" if date else None,
            ))
    return items


def _format_last_offered(offered: list[OfferedItem]) -> str:
    """Render danh sách vừa trình vào system prompt. Có kèm ID nội bộ để model
    gọi tool đúng đối tượng — NHƯNG model phải giấu ID khỏi câu trả lời user."""
    if not offered:
        return "Chưa có danh sách nào được trình ở lượt trước."
    lines = [
        "Danh sách vừa trình cho người dùng ở lượt trước (dùng id khi gọi tool, "
        "TUYỆT ĐỐI KHÔNG đọc id cho user):"
    ]
    for o in offered:
        extra = f", giá={o.price}" if o.price is not None else ""
        lines.append(f"{o.index}. [{o.kind}] {o.label} — id={o.id}{extra}")
    return "\n".join(lines)


def _format_knowledge(chunks: list[RetrievedChunk]) -> str:
    if not chunks:
        return "Không có knowledge chunk liên quan trong turn này."
    lines = [
        "Chỉ dùng các chunk dưới đây để gợi ý chuyên khoa/đặt lịch. Không chẩn đoán, không kê đơn."
    ]
    for i, chunk in enumerate(chunks, start=1):
        lines.append(
            f"[{i}] {chunk.canonical_name} ({chunk.type}, score={chunk.similarity_score:.2f})\n"
            f"{chunk.text[:1200]}"
        )
    return "\n\n".join(lines)


class SchedulingAgent:
    def __init__(
        self,
        provider: AIProvider,
        model: str,
        tools: ToolRegistry,
        prompts: PromptRegistry,
        retriever: Retriever | None = None,
        emergency_detector: EmergencyDetector | None = None,
        knowledge_policy: KnowledgePolicy | None = None,
    ) -> None:
        self._provider = provider
        self._model = model
        self._tools = tools
        self._prompts = prompts
        self._retriever = retriever
        self._emergency_detector = emergency_detector
        self._knowledge_policy = knowledge_policy

    def _transition(self, session: SessionState, dst: AgentState) -> None:
        ensure_transition(session.agent_state, dst)
        session.agent_state = dst

    async def handle_turn(
        self,
        session: SessionState,
        user_message: str,
        trace_id: str,
        history: list[tuple[str | None, str | None]] | None = None,
    ) -> MessageResponse:
        session.trace_ids.append(trace_id)

        # 1. Pre-filter: self-harm / emergency chặn trước LLM
        pf = pre_filter.check(user_message)
        if pf.blocked:
            self._transition(session, AgentState.FAILED)
            return self._resp(session, self._prompts.render(pf.refusal_key or "refusal-emergency", {}), trace_id)

        if self._emergency_detector is not None:
            emergency = self._emergency_detector.detect(user_message)
            if emergency.emergency:
                self._transition(session, AgentState.FAILED)
                return self._resp(session, self._prompts.render("refusal-emergency", {}), trace_id)

        # 2. Đang chờ xác nhận: chốt an toàn bằng confirm_intent
        if session.agent_state == AgentState.AWAITING_CONFIRMATION:
            return await self._handle_confirmation(session, user_message, trace_id)

        # 3. Tiến state
        if session.agent_state == AgentState.IDLE:
            self._transition(session, AgentState.COLLECTING)

        # 4. Dựng messages
        now = _today_vn()
        knowledge_chunks: list[RetrievedChunk] = []
        if self._retriever is not None and _is_symptom_query(user_message):
            try:
                knowledge_chunks = await self._retriever.retrieve(
                    user_message,
                    top_k=5,
                    filter_types=["disease", "symptom"],
                    allowed_only=True,
                )
            except RuntimeError as exc:
                _LOG.warning("RAG unavailable for turn %s: %s", trace_id, exc)
        # Nhúng THẲNG nội dung policy vào system message — scheduling-copilot chỉ
        # "tham chiếu tên" persona-style/scope; nếu không append, model không hề
        # thấy quy tắc xưng hô/độ dài/format thời gian.
        system = "\n\n".join([
            self._prompts.render("scheduling-copilot", {
                "TODAY_VN": f"{_VN_DAYS[now.weekday()]}, {now.strftime('%d/%m/%Y')}",
                "CALENDAR_STRIP": _calendar_strip(now),
                "KNOWLEDGE": _format_knowledge(knowledge_chunks),
                "LAST_OFFERED": _format_last_offered(session.last_offered),
            }),
            self._prompts.render("persona-style", {}),
            self._prompts.render("scope", {}),
        ])
        # Conversation memory: [system] + N lượt gần nhất (cũ->mới) + câu hiện tại.
        messages: list[dict] = [{"role": "system", "content": system}]
        for past_user, past_ai in history or []:
            if past_user:
                messages.append({"role": "user", "content": past_user})
            if past_ai:
                messages.append({"role": "assistant", "content": past_ai})
        messages.append({"role": "user", "content": user_message})

        # 5. Tool-calling loop
        summaries: list[ToolResultSummary] = []
        draft_result: dict | None = None
        draft_args: dict | None = None
        response = None
        for _ in range(_MAX_ITERS):
            response = await self._provider.chat(
                self._model, messages, tools=self._tools.openai_schemas(session.agent_state)
            )
            if not response.tool_calls:
                break
            for tc in response.tool_calls:
                result = await self._tools.execute(tc.name, tc.arguments, session_id=session.session_id)
                summaries.append(ToolResultSummary(
                    name=tc.name, ok=not result.get("error_code"), error_code=result.get("error_code")
                ))
                if tc.name == "create_booking_draft" and not result.get("error_code"):
                    draft_result, draft_args = result, tc.arguments
                # Lưu danh sách vừa trình (bác sĩ/dịch vụ/cơ sở/slot) để turn sau
                # resolve "bác sĩ thứ 2" / "cái 19h" về ID THẬT, không để LLM bịa.
                offered = _extract_offered(tc.name, result)
                if offered:
                    session.last_offered = offered
                messages.append({"role": "assistant", "content": "", "tool_calls": [
                    {"id": tc.id, "type": "function",
                     "function": {"name": tc.name, "arguments": tc.arguments}}
                ]})
                messages.append({"role": "tool", "tool_call_id": tc.id, "content": json.dumps(result, ensure_ascii=False)})

        final_text = (response.content if response else "") or ""
        final_text = _strip_cjk(final_text)  # chặn rò rỉ tiếng Trung của Qwen

        # 6. Post-validate: chẩn đoán/leak (Phase 05) + allowlist OUTPUT (Phase 04).
        pv = post_validator.check(final_text)
        violated = pv.violated
        if self._knowledge_policy is not None and final_text:
            mention = self._knowledge_policy.check_response_mentions(final_text)
            if mention.violated:
                violated = True
                _LOG.warning("Blocked-disease mention in response %s: %s", trace_id, mention.found)
        if violated:
            final_text = self._prompts.render("refusal-diagnosis", {"suggested_specialty": "phù hợp"})

        # 7. Transition theo kết quả
        requires_confirmation = False
        proposed: ProposedAction | None = None
        if draft_result:
            draft_id = draft_result.get("draft_id", "")
            session.pending_confirmation = PendingConfirmation(draft_id=draft_id, idempotency_key=draft_id)
            self._transition(session, AgentState.AWAITING_CONFIRMATION)
            requires_confirmation = True
            proposed = ProposedAction(kind="create_booking", payload={"draft_id": draft_id, **(draft_args or {})})

        return self._resp(session, final_text, trace_id, summaries, requires_confirmation, proposed)

    async def _handle_confirmation(self, session: SessionState, user_message: str, trace_id: str) -> MessageResponse:
        intent = classify_confirmation(user_message)
        pc = session.pending_confirmation

        if intent == ConfirmIntent.CONFIRM and pc is not None:
            result = await self._tools.execute("confirm_booking", {"draft_id": pc.draft_id}, session_id=session.session_id)
            if result.get("error_code"):
                self._transition(session, AgentState.SLOT)
                code = result["error_code"]
                msg = ("Rất tiếc, khung giờ vừa bị đặt mất rồi ạ. Anh/chị chọn giúp em giờ khác nhé?"
                       if code == "slot_taken" else
                       "Bản nháp đã hết hạn ạ. Anh/chị xác nhận lại lịch muốn đặt giúp em nhé?")
                return self._resp(session, msg, trace_id)
            session.pending_confirmation = None
            self._transition(session, AgentState.BOOKED)
            return self._resp(session, "Em đã đặt lịch thành công cho anh/chị ạ. Hẹn gặp anh/chị tại phòng khám!", trace_id)

        if intent == ConfirmIntent.REJECT:
            session.pending_confirmation = None
            self._transition(session, AgentState.COLLECTING)
            return self._resp(session, "Dạ vâng, em đã huỷ bản nháp. Anh/chị cần em hỗ trợ gì thêm không ạ?", trace_id)

        # AMBIGUOUS / OTHER -> hỏi lại dứt khoát, KHÔNG tạo lịch
        return self._resp(session, "Anh/chị xác nhận đặt lịch này giúp em nhé? (vâng / không ạ)", trace_id)

    @staticmethod
    def _resp(
        session: SessionState,
        message: str,
        trace_id: str,
        summaries: list[ToolResultSummary] | None = None,
        requires_confirmation: bool = False,
        proposed: ProposedAction | None = None,
    ) -> MessageResponse:
        return MessageResponse(
            message=message,
            session_state=session,
            proposed_action=proposed,
            requires_confirmation=requires_confirmation,
            tool_results_summary=summaries or [],
            trace_id=trace_id,
        )
