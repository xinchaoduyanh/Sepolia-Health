import pytest

from app.session.models import AgentState, SessionState
from app.session.store import InMemorySessionStore, SessionConflictError


async def test_create_get_update_roundtrip():
    store = InMemorySessionStore()
    await store.create(SessionState(session_id="s1", user_id=1))

    got = await store.get("s1")
    assert got is not None and got.version == 0

    got.agent_state = AgentState.COLLECTING
    updated = await store.update(got)
    assert updated.version == 1
    assert (await store.get("s1")).agent_state == AgentState.COLLECTING


async def test_optimistic_lock_conflict():
    store = InMemorySessionStore()
    await store.create(SessionState(session_id="s1", user_id=1))

    a = await store.get("s1")
    b = await store.get("s1")  # cùng version 0

    await store.update(a)  # ok -> version 1
    with pytest.raises(SessionConflictError):
        await store.update(b)  # b vẫn version 0 -> conflict


async def test_get_missing_returns_none():
    assert await InMemorySessionStore().get("nope") is None


async def test_postgres_store_create():
    from unittest.mock import AsyncMock, MagicMock
    from app.session.postgres_store import PostgresSessionStore, AiSessionDb
    
    store = PostgresSessionStore("postgresql+asyncpg://mock:mock@localhost/mock")
    
    mock_session = AsyncMock()
    mock_session.begin = MagicMock()
    mock_session.add = MagicMock()  # add() là sync -> tránh coroutine-never-awaited

    store.session_factory = MagicMock(return_value=mock_session)
    mock_session.__aenter__.return_value = mock_session
    
    state = SessionState(session_id="s_pg", user_id=42, channel_id="c_pg")
    res = await store.create(state)
    
    assert res.session_id == "s_pg"
    assert mock_session.add.called
    added_obj = mock_session.add.call_args[0][0]
    assert isinstance(added_obj, AiSessionDb)
    assert added_obj.id == "s_pg"
    assert added_obj.userId == 42
    assert added_obj.channelId == "c_pg"

