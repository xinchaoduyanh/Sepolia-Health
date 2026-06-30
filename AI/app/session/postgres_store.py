from __future__ import annotations

import datetime
import ssl
import uuid
from urllib.parse import urlsplit, parse_qsl, urlencode, urlunsplit

from sqlalchemy import Column, String, Integer, DateTime
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import declarative_base
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.future import select

from app.session.models import SessionState, AgentState
from app.session.store import SessionStore, SessionConflictError

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

    async def dispose(self) -> None:
        """Đóng connection pool — gọi lúc app shutdown."""
        await self.engine.dispose()

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
        
        async with self.session_factory() as session:
            async with session.begin():
                session.add(db_session)
        return state

    async def get(self, session_id: str) -> SessionState | None:
        async with self.session_factory() as session:
            stmt = select(AiSessionDb).where(AiSessionDb.id == session_id)
            result = await session.execute(stmt)
            db_session = result.scalars().first()
            if not db_session:
                return None
            
            # Load state dictionary
            data = db_session.state
            # Sync columns values back to state
            data['session_id'] = db_session.id
            data['user_id'] = db_session.userId
            data['agent_state'] = db_session.agentState
            data['channel_id'] = db_session.channelId
            data['version'] = db_session.version
            
            return SessionState.model_validate(data)

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

                # Optimistic locking check
                if db_session.version != state.version:
                    raise SessionConflictError(
                        f"version mismatch: db={db_session.version} state={state.version}"
                    )
                
                # Increment version
                new_version = state.version + 1
                state.version = new_version
                
                db_state = state.model_dump(mode='json')
                
                now = datetime.datetime.utcnow()
                closed_at = now if state.agent_state in (AgentState.BOOKED, AgentState.FAILED) else None
                
                db_session.agentState = state.agent_state.value
                db_session.channelId = state.channel_id
                db_session.state = db_state
                db_session.version = new_version
                db_session.updatedAt = now
                if closed_at:
                    db_session.closedAt = closed_at

        return state

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
        turn = AiTurnDb(
            id="turn_" + uuid.uuid4().hex[:16],
            sessionId=session_id,
            traceId=trace_id,
            userMessage=user_message,
            aiMessage=ai_message,
            toolResults=tool_results,
            model=model,
            latencyMs=latency_ms,
            policyViolations=policy_violations,
            createdAt=datetime.datetime.utcnow(),
        )
        async with self.session_factory() as session:
            async with session.begin():
                session.add(turn)

