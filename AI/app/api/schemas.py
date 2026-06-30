"""Request/response shape cho API. MessageResponse là shape chuẩn toàn hệ thống."""
from __future__ import annotations

from typing import Literal

from pydantic import BaseModel

from app.session.models import SessionState


class CreateSessionRequest(BaseModel):
    user_id: int
    channel_id: str | None = None


class CreateSessionResponse(BaseModel):
    session_id: str


class MessageRequest(BaseModel):
    message: str


class ProposedAction(BaseModel):
    kind: Literal["create_booking", "cancel_booking", "reschedule"]
    payload: dict


class ToolResultSummary(BaseModel):
    name: str
    ok: bool
    error_code: str | None = None


class MessageResponse(BaseModel):
    message: str                 # text cho user — do AI sinh, KHÔNG phải từ tool
    session_state: SessionState
    proposed_action: ProposedAction | None = None
    requires_confirmation: bool = False
    tool_results_summary: list[ToolResultSummary] = []
    trace_id: str
