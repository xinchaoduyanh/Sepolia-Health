"""SessionStore interface + bản in-memory (dev/test).

PostgresSessionStore (asyncpg/SQLAlchemy) làm sau khi có DB — xem
postgres_store.py (stub). In-memory đủ để chạy/test skeleton offline.
"""
from __future__ import annotations

from abc import ABC, abstractmethod

from app.session.models import SessionState


class SessionConflictError(RuntimeError):
    """Optimistic lock: version không khớp (2 turn cùng ghi)."""


class SessionStore(ABC):
    @abstractmethod
    async def create(self, state: SessionState) -> SessionState: ...

    @abstractmethod
    async def get(self, session_id: str) -> SessionState | None: ...

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


class InMemorySessionStore(SessionStore):
    def __init__(self) -> None:
        self._data: dict[str, SessionState] = {}
        self._turns: dict[str, list[tuple[str | None, str | None]]] = {}

    async def create(self, state: SessionState) -> SessionState:
        self._data[state.session_id] = state.model_copy(deep=True)
        return state.model_copy(deep=True)

    async def get(self, session_id: str) -> SessionState | None:
        cur = self._data.get(session_id)
        return cur.model_copy(deep=True) if cur else None

    async def get_open_by_channel(self, channel_id: str) -> SessionState | None:
        from app.session.models import AgentState
        matching = [
            s for s in self._data.values()
            if s.channel_id == channel_id and s.agent_state not in (AgentState.BOOKED, AgentState.FAILED)
        ]
        if not matching:
            return None
        matching.sort(key=lambda s: s.last_updated)
        return matching[-1].model_copy(deep=True)

    async def update(self, state: SessionState) -> SessionState:
        cur = self._data.get(state.session_id)
        if cur is None:
            raise KeyError(state.session_id)
        if cur.version != state.version:
            raise SessionConflictError(
                f"version lệch: store={cur.version} incoming={state.version}"
            )
        new = state.model_copy(deep=True)
        new.version += 1
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
        model: str | None = None,
        latency_ms: int | None = None,
        policy_violations: list | dict | None = None,
    ) -> None:
        if session_id not in self._turns:
            self._turns[session_id] = []
        self._turns[session_id].append((user_message, ai_message))

    async def list_recent_turns(self, session_id: str, limit: int) -> list[tuple[str | None, str | None]]:
        turns = self._turns.get(session_id, [])
        return turns[-limit:] if limit > 0 else []
