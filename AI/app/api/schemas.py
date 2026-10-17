"""Request/response shape cho API. MessageResponse là shape chuẩn toàn hệ thống."""
from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field, field_validator

from app.session.models import SessionState


class CreateSessionRequest(BaseModel):
    user_id: int = Field(..., gt=0)
    channel_id: str | None = Field(None, max_length=128)


class CreateSessionResponse(BaseModel):
    session_id: str


class MessageRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=2000)

    @field_validator("message")
    @classmethod
    def _strip(cls, v: str) -> str:
        t = (v or "").strip()
        if not t:
            raise ValueError("message must not be empty")
        return t


class ProposedAction(BaseModel):
    kind: Literal["create_booking", "cancel_booking", "reschedule"]
    payload: dict


class ToolResultSummary(BaseModel):
    """Kết quả tool (sau execute) — lưu AiTurn.toolResults."""
    name: str
    ok: bool
    error_code: str | None = None


class ToolCallAudit(BaseModel):
    """Lời gọi tool (trước/khi execute) — lưu AiTurn.toolCalls, KHÔNG trùng summary result."""
    id: str | None = None
    name: str
    arguments: dict = Field(default_factory=dict)  # đã sanitize


class MessageResponse(BaseModel):
    message: str                 # text cho user — do AI sinh, KHÔNG phải từ tool
    session_state: SessionState
    proposed_action: ProposedAction | None = None
    requires_confirmation: bool = False
    tool_results_summary: list[ToolResultSummary] = []
    # Audit: args đã gọi (khác tool_results_summary = ok/error_code).
    tool_calls_audit: list[ToolCallAudit] = []
    trace_id: str
    # Observability / safety flags (internal consumers; FE may ignore).
    injection_suspected: bool = False
    policy_violations: list[str] = []
