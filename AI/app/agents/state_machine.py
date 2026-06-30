"""Transition hợp lệ giữa các AgentState. Transition sai -> raise (log + về FAILED)."""
from __future__ import annotations

from app.session.models import AgentState as S

ALLOWED: dict[S, set[S]] = {
    S.IDLE: {S.IDLE, S.COLLECTING, S.FAILED},
    S.COLLECTING: {S.COLLECTING, S.CANDIDATE, S.SLOT, S.AWAITING_CONFIRMATION, S.FAILED},
    S.CANDIDATE: {S.CANDIDATE, S.SLOT, S.COLLECTING, S.AWAITING_CONFIRMATION, S.FAILED},
    S.SLOT: {S.SLOT, S.COLLECTING, S.AWAITING_CONFIRMATION, S.FAILED},
    S.DRAFT_READY: {S.AWAITING_CONFIRMATION, S.COLLECTING, S.FAILED},
    S.AWAITING_CONFIRMATION: {S.AWAITING_CONFIRMATION, S.BOOKED, S.SLOT, S.COLLECTING, S.FAILED},
    S.BOOKED: {S.BOOKED, S.COLLECTING},
    S.FAILED: {S.FAILED, S.COLLECTING},
}


class InvalidTransitionError(RuntimeError):
    pass


def can_transition(src: S, dst: S) -> bool:
    return dst in ALLOWED.get(src, set())


def ensure_transition(src: S, dst: S) -> None:
    if not can_transition(src, dst):
        raise InvalidTransitionError(f"{src.value} -> {dst.value} không hợp lệ")
