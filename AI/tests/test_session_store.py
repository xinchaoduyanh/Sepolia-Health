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


async def test_list_recent_turns_in_memory():
    store = InMemorySessionStore()
    
    # 0 turns initially
    turns = await store.list_recent_turns("s1", limit=5)
    assert turns == []
    
    # Record some turns
    await store.record_turn(session_id="s1", trace_id="t1", user_message="hello", ai_message="hi")
    await store.record_turn(session_id="s1", trace_id="t2", user_message="book a doctor", ai_message="which doctor?")
    await store.record_turn(session_id="s1", trace_id="t3", user_message="Dr. Minh", ai_message="searching Dr. Minh")
    
    # Fetch all (limit=5)
    turns = await store.list_recent_turns("s1", limit=5)
    assert len(turns) == 3
    assert turns == [
        ("hello", "hi"),
        ("book a doctor", "which doctor?"),
        ("Dr. Minh", "searching Dr. Minh")
    ]
    
    # Fetch limited (limit=2)
    turns = await store.list_recent_turns("s1", limit=2)
    assert len(turns) == 2
    assert turns == [
        ("book a doctor", "which doctor?"),
        ("Dr. Minh", "searching Dr. Minh")
    ]


async def test_get_open_by_channel_in_memory():
    store = InMemorySessionStore()
    
    # 1. No open session for channel
    assert await store.get_open_by_channel("ch_1") is None
    
    # 2. Create one active session
    s1 = SessionState(session_id="s1", user_id=1, channel_id="ch_1")
    await store.create(s1)
    
    got = await store.get_open_by_channel("ch_1")
    assert got is not None
    assert got.session_id == "s1"
    
    # 3. Create another one
    s2 = SessionState(session_id="s2", user_id=1, channel_id="ch_1")
    await store.create(s2)
    
    got = await store.get_open_by_channel("ch_1")
    assert got is not None
    assert got.session_id == "s2"
    
    # 4. Terminate s2 -> should fallback to s1
    s2.agent_state = AgentState.BOOKED
    await store.update(s2)
    
    got = await store.get_open_by_channel("ch_1")
    assert got is not None
    assert got.session_id == "s1"


async def test_postgres_store_get_open_by_channel():
    from unittest.mock import AsyncMock, MagicMock
    from app.session.postgres_store import PostgresSessionStore, AiSessionDb
    
    store = PostgresSessionStore("postgresql+asyncpg://mock:mock@localhost/mock")
    
    mock_session = AsyncMock()
    store.session_factory = MagicMock(return_value=mock_session)
    mock_session.__aenter__.return_value = mock_session
    
    # Setup mock return value for execute
    mock_db_session = MagicMock()
    mock_db_session.id = "s_open"
    mock_db_session.userId = 42
    mock_db_session.agentState = "idle"
    mock_db_session.channelId = "ch_open"
    mock_db_session.state = {"user_id": 42}
    mock_db_session.version = 2
    
    mock_result = MagicMock()
    mock_result.scalars.return_value.first.return_value = mock_db_session
    mock_session.execute.return_value = mock_result
    
    res = await store.get_open_by_channel("ch_open")
    assert res is not None
    assert res.session_id == "s_open"
    assert res.channel_id == "ch_open"
    assert res.version == 2



