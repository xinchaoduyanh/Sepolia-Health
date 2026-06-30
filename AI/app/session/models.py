"""Session state models (Phase 03). State machine + business logic ở Phase 06.

Thời gian lưu dạng chuỗi ISO để snapshot JSON đơn giản (Be/ AiSession.state Json).
"""
from __future__ import annotations

from datetime import datetime, timezone
from enum import Enum

from pydantic import BaseModel, Field


def _now() -> datetime:
    return datetime.now(timezone.utc)


class AgentState(str, Enum):
    IDLE = "idle"
    COLLECTING = "collecting_requirements"
    CANDIDATE = "candidate_selection"
    SLOT = "slot_selection"
    DRAFT_READY = "draft_ready"
    AWAITING_CONFIRMATION = "awaiting_confirmation"
    BOOKED = "booked"
    FAILED = "handoff_or_failed"


class OfferedItem(BaseModel):
    """1 phần tử trong danh sách vừa trình cho user (để resolve 'cái thứ 2')."""

    index: int
    kind: str  # "doctor" | "service" | "slot" | "clinic"
    id: int | str
    label: str
    price: int | None = None
    start_time: str | None = None  # ISO datetime


class BookingRequirement(BaseModel):
    specialty: str | None = None
    doctor_id: int | None = None
    doctor_name_query: str | None = None
    service_id: int | None = None
    service_name_query: str | None = None
    date: str | None = None  # ISO date
    time_preference: str | None = None
    specific_time: str | None = None


class BookingDraft(BaseModel):
    draft_id: str
    patient_profile_id: int
    doctor_id: int
    service_id: int
    start_time: str  # ISO datetime
    end_time: str
    clinic_id: int | None = None
    estimated_price: int | None = None
    expires_at: str


class PendingConfirmation(BaseModel):
    draft_id: str
    idempotency_key: str


class TurnSummary(BaseModel):
    role: str  # "user" | "assistant"
    summary: str
    at: datetime = Field(default_factory=_now)


class SessionState(BaseModel):
    session_id: str
    user_id: int
    patient_profile_id: int | None = None
    agent_state: AgentState = AgentState.IDLE
    channel_id: str | None = None
    booking_requirement: BookingRequirement = Field(default_factory=BookingRequirement)
    booking_draft: BookingDraft | None = None
    pending_confirmation: PendingConfirmation | None = None
    last_offered: list[OfferedItem] = Field(default_factory=list)
    turn_summaries: list[TurnSummary] = Field(default_factory=list)
    last_updated: datetime = Field(default_factory=_now)
    trace_ids: list[str] = Field(default_factory=list)
    version: int = 0  # optimistic locking
