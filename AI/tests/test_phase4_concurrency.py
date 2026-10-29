"""Phase 4: concurrent turns trên cùng session — serialize, timeout, lock Postgres."""
from __future__ import annotations

import asyncio

import httpx
import pytest

from app.api.rate_limit import reset_rate_limiter_for_tests
from app.config import Settings, get_settings
from app.deps import get_bridge, get_provider, get_store
from app.main import app
from app.providers.base import ChatResponse
from app.session.locks import PostgresTurnLocker, TurnLockTimeout
from app.session.store import InMemorySessionStore, SessionBusyError
from tests.fakes import FakeBridge

_TOKEN = "test-internal-token-phase4"
AUTH = {"X-Internal-Token": _TOKEN}


class SlowProvider:
    """Ghi lại khoảng [bắt đầu, kết thúc] của mỗi lần gọi LLM."""

    def __init__(self, delay: float = 0.05) -> None:
        self.delay = delay
        self.events: list[str] = []
        self._n = 0

    async def chat(self, model, messages, tools=None, temperature=0.1, max_tokens=1024):
        self._n += 1
        i = self._n
        self.events.append(f"start{i}")
        await asyncio.sleep(self.delay)
        self.events.append(f"end{i}")
        return ChatResponse(content=f"reply{i}", tool_calls=[], raw_model="fake", latency_ms=1)

    async def chat_stream(self, *a, **k):  # pragma: no cover - không dùng
        raise NotImplementedError

    async def embed(self, model, texts):
        return [[0.0] * 8 for _ in texts]


@pytest.fixture()
def wired():
    reset_rate_limiter_for_tests()
    store = InMemorySessionStore()
    provider = SlowProvider()
    prev = dict(app.dependency_overrides)
    app.dependency_overrides[get_provider] = lambda: provider
    app.dependency_overrides[get_bridge] = lambda: FakeBridge()
    app.dependency_overrides[get_store] = lambda: store
    app.dependency_overrides[get_settings] = lambda: Settings(
        internal_shared_secret=_TOKEN,
        rate_limit_per_minute=0,
        rate_limit_per_day=0,
        session_turn_lock_timeout_sec=5.0,
    )
    yield store, provider
    app.dependency_overrides.clear()
    app.dependency_overrides.update(prev)
    reset_rate_limiter_for_tests()


async def _client():
    return httpx.AsyncClient(transport=httpx.ASGITransport(app=app), base_url="http://t")


async def test_two_messages_same_session_run_one_after_another(wired):
    store, provider = wired
    async with await _client() as c:
        sid = (await c.post("/internal/ai/chat/sessions", json={"user_id": 7}, headers=AUTH)).json()["session_id"]
        url = f"/internal/ai/chat/sessions/{sid}/messages"
        r1, r2 = await asyncio.gather(
            c.post(url, json={"message": "một"}, headers=AUTH),
            c.post(url, json={"message": "hai"}, headers=AUTH),
        )
    assert r1.status_code == 200 and r2.status_code == 200
    # LLM không bao giờ chạy chồng: start,end,start,end.
    assert provider.events == ["start1", "end1", "start2", "end2"]
    # Cả hai turn được ghi, version tăng đúng 2 lần (không lost update).
    assert len(store._turns[sid]) == 2
    assert (await store.get(sid)).version == 2


async def test_different_sessions_do_not_block_each_other(wired):
    store, provider = wired
    async with await _client() as c:
        a = (await c.post("/internal/ai/chat/sessions", json={"user_id": 1}, headers=AUTH)).json()["session_id"]
        b = (await c.post("/internal/ai/chat/sessions", json={"user_id": 2}, headers=AUTH)).json()["session_id"]
        await asyncio.gather(
            c.post(f"/internal/ai/chat/sessions/{a}/messages", json={"message": "x"}, headers=AUTH),
            c.post(f"/internal/ai/chat/sessions/{b}/messages", json={"message": "y"}, headers=AUTH),
        )
    assert provider.events[:2] == ["start1", "start2"]


async def test_turn_lock_timeout_returns_409_session_busy(wired):
    store, _ = wired
    app.dependency_overrides[get_settings] = lambda: Settings(
        internal_shared_secret=_TOKEN,
        rate_limit_per_minute=0,
        rate_limit_per_day=0,
        session_turn_lock_timeout_sec=0.05,
    )
    async with await _client() as c:
        sid = (await c.post("/internal/ai/chat/sessions", json={"user_id": 3}, headers=AUTH)).json()["session_id"]
        async with store.turn_lock(sid):  # một turn khác đang giữ lock
            r = await c.post(
                f"/internal/ai/chat/sessions/{sid}/messages", json={"message": "hi"}, headers=AUTH
            )
    assert r.status_code == 409
    assert r.json()["detail"]["error_code"] == "session_busy"
    assert r.headers["retry-after"] == "5"


async def test_memory_store_lock_timeout_raises_busy():
    store = InMemorySessionStore()
    async with store.turn_lock("s"):
        with pytest.raises(SessionBusyError):
            async with store.turn_lock("s", timeout=0.02):
                pass
    # Sau khi nhả lại lấy được.
    async with store.turn_lock("s", timeout=0.02):
        pass


# --- PostgresTurnLocker với engine giả (không cần DB) -----------------------


class _FakePg:
    def __init__(self) -> None:
        self.held: set[int] = set()
        self.invalidated = 0


class _Result:
    def __init__(self, v):
        self._v = v

    def scalar(self):
        return self._v


class _FakeConn:
    def __init__(self, pg: _FakePg, fail_unlock: bool = False) -> None:
        self.pg = pg
        self.mine: set[int] = set()
        self.fail_unlock = fail_unlock
        self.closed = False

    async def execute(self, stmt, params):
        sql = str(stmt)
        k = params["k"]
        if "pg_try_advisory_lock" in sql:
            if k in self.pg.held:
                return _Result(False)
            self.pg.held.add(k)
            self.mine.add(k)
            return _Result(True)
        if self.fail_unlock:
            raise RuntimeError("connection lost")
        self.pg.held.discard(k)
        self.mine.discard(k)
        return _Result(True)

    async def invalidate(self):
        self.pg.invalidated += 1
        self.pg.held -= self.mine  # đóng connection thật => server nhả lock

    async def close(self):
        self.closed = True


class _FakeEngine:
    def __init__(self, pg, fail_unlock=False):
        self.pg, self.fail_unlock = pg, fail_unlock

    async def connect(self):
        return _FakeConn(self.pg, self.fail_unlock)


async def test_postgres_locker_serializes_and_times_out():
    pg = _FakePg()
    locker = PostgresTurnLocker(_FakeEngine(pg))
    async with locker.turn_lock("s1"):
        with pytest.raises(TurnLockTimeout):
            async with locker.turn_lock("s1", timeout=0.1):
                pass
    assert not pg.held
    async with locker.turn_lock("s1", timeout=0.1):
        pass


async def test_postgres_locker_invalidates_connection_when_unlock_fails():
    pg = _FakePg()
    locker = PostgresTurnLocker(_FakeEngine(pg, fail_unlock=True))
    async with locker.turn_lock("s1"):
        assert pg.held
    # unlock lỗi -> connection bị huỷ, lock không bị rò trong pool.
    assert pg.invalidated == 1
    assert not pg.held
