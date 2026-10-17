from __future__ import annotations

import datetime
import ssl
import uuid
from urllib.parse import urlsplit, parse_qsl, urlencode, urlunsplit

from sqlalchemy import Column, String, Integer, DateTime
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import declarative_base
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.exc import IntegrityError
from sqlalchemy.future import select

from app.session.locks import PostgresTurnLocker
from app.session.models import AgentState, BookingRequirement, SessionState
from app.session.store import SessionClosedError, SessionConflictError, SessionStore

Base = declarative_base()

# libpq-style query params (vd dạng copy từ Prisma/psql) mà asyncpg KHÔNG hiểu.
# asyncpg nhận TLS qua connect_args={"ssl": ...} chứ không qua URL như libpq.
_LIBPQ_ONLY_PARAMS = {"sslmode", "channel_binding", "sslrootcert", "sslcert", "sslkey"}
_LOCAL_HOSTS = {"localhost", "127.0.0.1", "::1", ""}


def _prepare_asyncpg_url(database_url: str) -> tuple[str, dict]:
    """Tách query libpq khỏi URL và bật TLS cho host remote (vd Neon).

    Neon bắt buộc TLS nhưng asyncpg không đọc sslmode/channel_binding kiểu libpq
    trong URL, nên ta strip chúng và truyền ssl context qua connect_args thay vì.
    Host local không bật TLS để tránh fail khi chạy Postgres dev không có SSL.
    """
    parts = urlsplit(database_url)
    query = [(k, v) for k, v in parse_qsl(parts.query) if k not in _LIBPQ_ONLY_PARAMS]
    clean_url = urlunsplit(
        (parts.scheme, parts.netloc, parts.path, urlencode(query), parts.fragment)
    )

    connect_args: dict = {}
    if (parts.hostname or "") not in _LOCAL_HOSTS:
        connect_args["ssl"] = ssl.create_default_context()
    return clean_url, connect_args

class AiSessionDb(Base):
    __tablename__ = 'AiSession'
    
    id = Column(String, primary_key=True)
    userId = Column(Integer, nullable=False)
    agentState = Column(String, nullable=False)
    channelId = Column(String, nullable=True)
    state = Column(JSONB, nullable=False)
    version = Column(Integer, nullable=False, default=0)
    createdAt = Column(DateTime, nullable=False, default=datetime.datetime.utcnow)
    updatedAt = Column(DateTime, nullable=False, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
    closedAt = Column(DateTime, nullable=True)


class AiTurnDb(Base):
    __tablename__ = 'AiTurn'

    id = Column(String, primary_key=True)
    sessionId = Column(String, nullable=False)
    traceId = Column(String, nullable=False)
    userMessage = Column(String, nullable=True)
    aiMessage = Column(String, nullable=True)
    toolCalls = Column(JSONB, nullable=True)
    toolResults = Column(JSONB, nullable=True)
    model = Column(String, nullable=True)
    latencyMs = Column(Integer, nullable=True)
    policyViolations = Column(JSONB, nullable=True)
    createdAt = Column(DateTime, nullable=False, default=datetime.datetime.utcnow)


class PostgresSessionStore(SessionStore):
    def __init__(self, database_url: str) -> None:
        # asyncpg cần URL không chứa query libpq + TLS qua connect_args (xem helper).
        clean_url, connect_args = _prepare_asyncpg_url(database_url)
        self.engine = create_async_engine(
            clean_url, echo=False, connect_args=connect_args
        )
        self.session_factory = async_sessionmaker(
            bind=self.engine,
            class_=AsyncSession,
            expire_on_commit=False,
        )
        self._turn_locker = PostgresTurnLocker(self.engine)

    async def dispose(self) -> None:
        """Đóng connection pool — gọi lúc app shutdown."""
        await self.engine.dispose()

    async def ping(self) -> None:
        """Readiness: kiểm tra DB reachable."""
        from sqlalchemy import text

        async with self.engine.connect() as conn:
            await conn.execute(text("SELECT 1"))

    def turn_lock(self, session_id: str):
        """Serialize turns via PostgreSQL advisory lock (multi-worker safe)."""
        return self._turn_locker.turn_lock(session_id)

    async def create(self, state: SessionState) -> SessionState:
        now = datetime.datetime.utcnow()
        # Ensure model is dumped to JSON-serializable dict
        db_state = state.model_dump(mode='json')
        
        # When closing state, populate closedAt
        closed_at = now if state.agent_state in (AgentState.BOOKED, AgentState.FAILED) else None
        
        db_session = AiSessionDb(
            id=state.session_id,
            userId=state.user_id,
            agentState=state.agent_state.value,
            channelId=state.channel_id,
            state=db_state,
            version=state.version,
            createdAt=now,
            updatedAt=now,
            closedAt=closed_at,
        )
        
        try:
            async with self.session_factory() as session:
                async with session.begin():
                    session.add(db_session)
            return state
        except IntegrityError:
            # Partial unique index guarantees one open session/channel. A
            # concurrent creator should reconnect to the row that won.
            if state.channel_id:
                existing = await self.get_open_by_channel(state.channel_id)
                if existing is not None:
                    return existing
            raise

    def _row_to_state(self, db_session: AiSessionDb) -> SessionState:
        data = dict(db_session.state or {})
        data["session_id"] = db_session.id
        data["user_id"] = db_session.userId
        data["agent_state"] = db_session.agentState
        data["channel_id"] = db_session.channelId
        data["version"] = db_session.version
        return SessionState.model_validate(data)

    @staticmethod
    def _wipe_state_dict(user_id: int, session_id: str, channel_id: str | None, version: int) -> dict:
        """Strip PII / booking context after DELETE or retention close."""
        wiped = SessionState(
            session_id=session_id,
            user_id=user_id,
            agent_state=AgentState.FAILED,
            channel_id=None,  # chặn reconnect theo channel
            booking_requirement=BookingRequirement(),
            booking_draft=None,
            pending_confirmation=None,
            last_offered=[],
            turn_summaries=[],
            patient_summary=None,
            patient_profile_id=None,
            trace_ids=[],
            version=version,
        )
        return wiped.model_dump(mode="json")

    def _invalidate_row(self, db_session: AiSessionDb, *, now: datetime.datetime) -> None:
        """Vô hiệu hóa session: closedAt + FAILED + wipe state (không chỉ set cờ)."""
        new_version = int(db_session.version or 0) + 1
        db_session.closedAt = now
        db_session.updatedAt = now
        db_session.agentState = AgentState.FAILED.value
        db_session.channelId = None
        db_session.version = new_version
        db_session.state = self._wipe_state_dict(
            user_id=db_session.userId,
            session_id=db_session.id,
            channel_id=None,
            version=new_version,
        )

    async def get(self, session_id: str) -> SessionState | None:
        """Active session only — closedAt set → None (message/confirm/cancel)."""
        async with self.session_factory() as session:
            stmt = select(AiSessionDb).where(AiSessionDb.id == session_id)
            result = await session.execute(stmt)
            db_session = result.scalars().first()
            if not db_session:
                return None
            if db_session.closedAt is not None:
                return None
            return self._row_to_state(db_session)

    async def get_including_closed(self, session_id: str) -> SessionState | None:
        """Kể cả session đã DELETE/retention (export / audit)."""
        async with self.session_factory() as session:
            stmt = select(AiSessionDb).where(AiSessionDb.id == session_id)
            result = await session.execute(stmt)
            db_session = result.scalars().first()
            if not db_session:
                return None
            return self._row_to_state(db_session)

    async def get_open_by_channel(self, channel_id: str) -> SessionState | None:
        async with self.session_factory() as session:
            stmt = (
                select(AiSessionDb)
                .where(AiSessionDb.channelId == channel_id)
                .where(AiSessionDb.closedAt.is_(None))
                .order_by(AiSessionDb.createdAt.desc())
                .limit(1)
            )
            result = await session.execute(stmt)
            db_session = result.scalars().first()
            if not db_session:
                return None
            return self._row_to_state(db_session)

    async def update(self, state: SessionState) -> SessionState:
        async with self.session_factory() as session:
            async with session.begin():
                # with_for_update khoá dòng để tránh TOCTOU: 2 turn đồng thời
                # (vd message + confirm) cùng đọc version=N rồi cùng ghi N+1.
                stmt = (
                    select(AiSessionDb)
                    .where(AiSessionDb.id == state.session_id)
                    .with_for_update()
                )
                result = await session.execute(stmt)
                db_session = result.scalars().first()
                if not db_session:
                    raise KeyError(state.session_id)

                # Không cho update “mở lại” session đã DELETE/retention.
                if db_session.closedAt is not None:
                    raise SessionClosedError(state.session_id)

                # Optimistic locking check
                if db_session.version != state.version:
                    raise SessionConflictError(
                        f"version mismatch: db={db_session.version} state={state.version}"
                    )
                
                # Increment version
                new_version = state.version + 1
                state.version = new_version
                # Refresh last_updated trong snapshot JSON — create_session dựa vào
                # field này để quyết định reconnect hay mở session mới.
                state.last_updated = datetime.datetime.now(datetime.timezone.utc)

                db_state = state.model_dump(mode='json')
                
                now = datetime.datetime.utcnow()
                # Chỉ SET closedAt khi vào terminal; không ghi đè closedAt=None
                # (tránh vô tình reopen nếu logic khác set closed).
                if state.agent_state in (AgentState.BOOKED, AgentState.FAILED):
                    db_session.closedAt = now
                
                db_session.agentState = state.agent_state.value
                db_session.channelId = state.channel_id
                db_session.state = db_state
                db_session.version = new_version
                db_session.updatedAt = now

        return state

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
        turn = AiTurnDb(
            id="turn_" + uuid.uuid4().hex[:16],
            sessionId=session_id,
            traceId=trace_id,
            userMessage=user_message,
            aiMessage=ai_message,
            toolCalls=tool_calls,
            toolResults=tool_results,
            model=model,
            latencyMs=latency_ms,
            policyViolations=policy_violations,
            createdAt=datetime.datetime.utcnow(),
        )
        async with self.session_factory() as session:
            async with session.begin():
                session.add(turn)

    async def list_recent_turns(
        self, session_id: str, limit: int
    ) -> list[tuple[str | None, str | None]]:
        if limit <= 0:
            return []
        async with self.session_factory() as session:
            # Lấy N turn MỚI nhất (desc + limit) rồi đảo lại sang thứ tự thời gian
            # tăng dần để nhồi history theo đúng trình tự hội thoại.
            stmt = (
                select(AiTurnDb)
                .where(AiTurnDb.sessionId == session_id)
                .order_by(AiTurnDb.createdAt.desc())
                .limit(limit)
            )
            result = await session.execute(stmt)
            rows = list(result.scalars().all())
        rows.reverse()
        return [(r.userMessage, r.aiMessage) for r in rows]

    async def delete_session(self, session_id: str, *, purge_turns: bool = True) -> bool:
        async with self.session_factory() as session:
            async with session.begin():
                stmt = (
                    select(AiSessionDb)
                    .where(AiSessionDb.id == session_id)
                    .with_for_update()
                )
                result = await session.execute(stmt)
                db_session = result.scalars().first()
                if not db_session:
                    return False
                now = datetime.datetime.utcnow()
                # Idempotent: đã closed vẫn wipe lại + purge turns nếu yêu cầu.
                self._invalidate_row(db_session, now=now)
                if purge_turns:
                    from sqlalchemy import delete

                    await session.execute(delete(AiTurnDb).where(AiTurnDb.sessionId == session_id))
        return True

    async def export_session(self, session_id: str) -> dict | None:
        # Export sau soft-delete: metadata đã wipe (không PII).
        state = await self.get_including_closed(session_id)
        async with self.session_factory() as session:
            stmt = select(AiSessionDb).where(AiSessionDb.id == session_id)
            row = (await session.execute(stmt)).scalars().first()
            turns_stmt = (
                select(AiTurnDb)
                .where(AiTurnDb.sessionId == session_id)
                .order_by(AiTurnDb.createdAt.asc())
            )
            result = await session.execute(turns_stmt)
            rows = list(result.scalars().all())
        if state is None and not rows and row is None:
            return None
        return {
            "session": state.model_dump(mode="json") if state else None,
            "closed": bool(row and row.closedAt is not None),
            "closed_at": row.closedAt.isoformat() if row and row.closedAt else None,
            "turns": [
                {
                    "trace_id": r.traceId,
                    "user_message": r.userMessage,
                    "ai_message": r.aiMessage,
                    "model": r.model,
                    "latency_ms": r.latencyMs,
                    "policy_violations": r.policyViolations,
                    "created_at": r.createdAt.isoformat() if r.createdAt else None,
                }
                for r in rows
            ],
        }

    async def purge_expired(self, *, session_days: int, turn_days: int) -> dict[str, int]:
        from sqlalchemy import delete

        now = datetime.datetime.utcnow()
        session_cut = now - datetime.timedelta(days=max(1, session_days))
        turn_cut = now - datetime.timedelta(days=max(1, turn_days))
        closed = 0
        deleted = 0
        async with self.session_factory() as session:
            async with session.begin():
                # Load open sessions quá hạn rồi invalidate từng row (wipe state).
                stmt = (
                    select(AiSessionDb)
                    .where(AiSessionDb.closedAt.is_(None))
                    .where(AiSessionDb.updatedAt < session_cut)
                    .with_for_update()
                )
                result = await session.execute(stmt)
                for db_session in result.scalars().all():
                    self._invalidate_row(db_session, now=now)
                    closed += 1
                res2 = await session.execute(
                    delete(AiTurnDb).where(AiTurnDb.createdAt < turn_cut)
                )
                deleted = res2.rowcount or 0
        return {"sessions_closed": int(closed), "turns_deleted": int(deleted)}
