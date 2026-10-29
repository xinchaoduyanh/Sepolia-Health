"""SessionStore interface + bản in-memory (dev/test).

PostgresSessionStore (asyncpg/SQLAlchemy) — xem postgres_store.py.
"""
from __future__ import annotations

from abc import ABC, abstractmethod
from datetime import timedelta
from contextlib import asynccontextmanager
from typing import Any, AsyncIterator

from app.session.locks import TurnLockTimeout, get_memory_turn_locker
from app.session.models import SessionState, _now


class SessionConflictError(RuntimeError):
    """Optimistic lock: version không khớp (2 turn cùng ghi)."""


class SessionBusyError(RuntimeError):
    """Không lấy được turn lock trong thời gian cho phép."""


class SessionClosedError(RuntimeError):
    """Session đã DELETE/retention-close — không nhận turn mới."""


class SessionStore(ABC):
    @abstractmethod
    async def create(self, state: SessionState) -> SessionState: ...

    @abstractmethod
    async def get(self, session_id: str) -> SessionState | None:
        """Session đang mở (active). Closed/deleted → None.

        Dùng cho message / confirm / cancel / stream / GET session.
        """

    async def get_including_closed(self, session_id: str) -> SessionState | None:
        """Session kể cả đã DELETE/retention-close (export / audit).

        Default: fallback get() — store có soft-delete override.
        """
        return await self.get(session_id)

    @abstractmethod
    async def get_open_by_channel(self, channel_id: str) -> SessionState | None: ...

    @abstractmethod
    async def update(self, state: SessionState) -> SessionState:
        """Ghi nếu version khớp; tăng version. Lệch -> SessionConflictError."""

    async def record_turn(
        self,
        *,
        session_id: str,
        trace_id: str,
        user_message: str | None,
        ai_message: str | None,
        tool_results: list | dict | None = None,
        tool_calls: list | dict | None = None,
        model: str | None = None,
        latency_ms: int | None = None,
        policy_violations: list | dict | None = None,
    ) -> None:
        """Ghi 1 turn để observability (bảng AiTurn). No-op mặc định.

        Lỗi ghi turn KHÔNG được làm hỏng lượt chat -> caller tự nuốt lỗi.
        """
        return None

    async def list_recent_turns(
        self, session_id: str, limit: int
    ) -> list[tuple[str | None, str | None]]:
        """N lượt gần nhất theo thứ tự thời gian tăng dần (cũ -> mới), để nhồi
        lại làm conversation memory. Trả [(user_message, ai_message), ...].

        Mặc định trả rỗng (store không lưu lịch sử) -> agent hoạt động như cũ.
        """
        return []

    @asynccontextmanager
    async def turn_lock(
        self, session_id: str, timeout: float | None = None
    ) -> AsyncIterator[None]:
        """Serialize turns for one session before LLM/tool work.

        Quá `timeout` giây chưa lấy được lock -> SessionBusyError.
        """
        try:
            async with get_memory_turn_locker().turn_lock(session_id, timeout):
                yield
        except TurnLockTimeout as exc:
            raise SessionBusyError(session_id) from exc

    async def delete_session(self, session_id: str, *, purge_turns: bool = True) -> bool:
        """Close/delete session for privacy. Return True if found."""
        return False

    async def export_session(self, session_id: str) -> dict[str, Any] | None:
        """User data export: session snapshot + turns (no secrets)."""
        return None

    async def purge_expired(self, *, session_days: int, turn_days: int) -> dict[str, int]:
        """Retention job: close old sessions / delete old turns."""
        return {"sessions_closed": 0, "turns_deleted": 0, "sessions_deleted": 0}


class InMemorySessionStore(SessionStore):
    def __init__(self) -> None:
        self._data: dict[str, SessionState] = {}
        self._closed: set[str] = set()
        self._turns: dict[str, list[dict[str, Any]]] = {}
        self._closed_at: dict[str, datetime] = {}

    async def create(self, state: SessionState) -> SessionState:
        self._data[state.session_id] = state.model_copy(deep=True)
        self._closed.discard(state.session_id)
        self._closed_at.pop(state.session_id, None)
        return state.model_copy(deep=True)

    async def get(self, session_id: str) -> SessionState | None:
        if session_id in self._closed:
            return None
        cur = self._data.get(session_id)
        return cur.model_copy(deep=True) if cur else None

    async def get_including_closed(self, session_id: str) -> SessionState | None:
        cur = self._data.get(session_id)
        return cur.model_copy(deep=True) if cur else None

    async def get_open_by_channel(self, channel_id: str) -> SessionState | None:
        from app.session.models import AgentState
        matching = [
            s for s in self._data.values()
            if s.channel_id == channel_id
            and s.session_id not in self._closed
            and s.agent_state not in (AgentState.BOOKED, AgentState.FAILED)
        ]
        if not matching:
            return None
        matching.sort(key=lambda s: s.last_updated)
        return matching[-1].model_copy(deep=True)

    async def update(self, state: SessionState) -> SessionState:
        if state.session_id in self._closed:
            raise SessionClosedError(state.session_id)
        cur = self._data.get(state.session_id)
        if cur is None:
            raise KeyError(state.session_id)
        if cur.version != state.version:
            raise SessionConflictError(
                f"version lệch: store={cur.version} incoming={state.version}"
            )
        new = state.model_copy(deep=True)
        new.version += 1
        new.last_updated = _now()  # cùng semantics với PostgresSessionStore
        self._data[state.session_id] = new
        return new.model_copy(deep=True)

    async def record_turn(
        self,
        *,
        session_id: str,
        trace_id: str,
        user_message: str | None,
        ai_message: str | None,
        tool_results: list | dict | None = None,
        tool_calls: list | dict | None = None,
        model: str | None = None,
        latency_ms: int | None = None,
        policy_violations: list | dict | None = None,
    ) -> None:
        if session_id not in self._turns:
            self._turns[session_id] = []
        self._turns[session_id].append(
            {
                "at": _now(),
                "trace_id": trace_id,
                "user_message": user_message,
                "ai_message": ai_message,
                "tool_results": tool_results,
                "tool_calls": tool_calls,
                "model": model,
                "latency_ms": latency_ms,
                "policy_violations": policy_violations,
            }
        )

    async def list_recent_turns(self, session_id: str, limit: int) -> list[tuple[str | None, str | None]]:
        turns = self._turns.get(session_id, [])
        sliced = turns[-limit:] if limit > 0 else []
        return [(t.get("user_message"), t.get("ai_message")) for t in sliced]

    async def delete_session(self, session_id: str, *, purge_turns: bool = True) -> bool:
        existed = session_id in self._data or session_id in self._closed
        if session_id in self._data:
            from app.session.models import AgentState, BookingRequirement

            # Soft-invalidate: giữ id audit nhưng get() active trả None.
            cur = self._data[session_id]
            wiped = cur.model_copy(deep=True)
            wiped.agent_state = AgentState.FAILED
            wiped.channel_id = None  # chặn reconnect theo channel
            wiped.booking_requirement = BookingRequirement()
            wiped.booking_draft = None
            wiped.pending_confirmation = None
            wiped.last_offered = []
            wiped.patient_summary = None
            wiped.turn_summaries = []
            wiped.trace_ids = []
            wiped.patient_profile_id = None
            wiped.version += 1
            wiped.last_updated = _now()
            self._data[session_id] = wiped
            self._closed.add(session_id)
            self._closed_at[session_id] = _now()
        if purge_turns:
            self._turns.pop(session_id, None)
        return existed

    async def export_session(self, session_id: str) -> dict[str, Any] | None:
        # Export: get_including_closed (metadata wipe), không dùng get() active.
        state = await self.get_including_closed(session_id)
        if state is None and session_id not in self._turns:
            return None
        return {
            "session": state.model_dump(mode="json") if state else None,
            "closed": session_id in self._closed,
            "turns": [
                {
                    "trace_id": t.get("trace_id"),
                    "user_message": t.get("user_message"),
                    "ai_message": t.get("ai_message"),
                    "model": t.get("model"),
                    "latency_ms": t.get("latency_ms"),
                    "policy_violations": t.get("policy_violations"),
                }
                for t in self._turns.get(session_id, [])
            ],
        }

    async def purge_expired(self, *, session_days: int, turn_days: int) -> dict[str, int]:
        """Cùng semantics với PostgresSessionStore (theo thời gian, không phải 'xoá hết')."""
        now = _now()
        session_cut = now - timedelta(days=max(1, session_days))
        turn_cut = now - timedelta(days=max(1, turn_days))
        closed = 0
        for sid, st in list(self._data.items()):
            if sid not in self._closed and st.last_updated < session_cut:
                await self.delete_session(sid, purge_turns=False)
                closed += 1
        deleted = 0
        for sid, turns in list(self._turns.items()):
            keep = [t for t in turns if t.get("at", now) >= turn_cut]
            deleted += len(turns) - len(keep)
            if keep:
                self._turns[sid] = keep
            else:
                self._turns.pop(sid)
        removed = 0
        for sid in list(self._closed):
            if self._closed_at.get(sid, now) < session_cut:
                self._turns.pop(sid, None)
                self._data.pop(sid, None)
                self._closed.discard(sid)
                self._closed_at.pop(sid, None)
                removed += 1
        return {"sessions_closed": closed, "turns_deleted": deleted, "sessions_deleted": removed}
