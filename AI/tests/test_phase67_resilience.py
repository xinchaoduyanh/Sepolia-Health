"""Phase 4/6/7: turn lock, rate limit, circuit breaker, privacy, eval offline."""
from __future__ import annotations

import asyncio
from datetime import datetime, timedelta, timezone

import pytest
from fastapi.testclient import TestClient

from app.api.rate_limit import UserRateLimiter, reset_rate_limiter_for_tests
from app.config import Settings, get_settings
from app.deps import get_bridge, get_provider, get_store
from app.main import app
from app.resilience.circuit_breaker import CircuitBreaker, CircuitOpenError
from app.session.store import InMemorySessionStore
from tests.fakes import FakeBridge, FakeProvider, chat_text

_TEST_TOKEN = "test-internal-token-phase67"


@pytest.fixture()
def client(monkeypatch):
    reset_rate_limiter_for_tests()
    store = InMemorySessionStore()
    # Restore previous overrides after test (test_api sets module-level overrides).
    prev_overrides = dict(app.dependency_overrides)
    app.dependency_overrides[get_provider] = lambda: FakeProvider([chat_text("Em chào anh/chị ạ.")])
    app.dependency_overrides[get_bridge] = lambda: FakeBridge()
    app.dependency_overrides[get_store] = lambda: store
    app.dependency_overrides[get_settings] = lambda: Settings(
        internal_shared_secret=_TEST_TOKEN,
        rate_limit_per_minute=5,
        rate_limit_per_day=100,
        max_message_chars=2000,
    )
    yield TestClient(app), store
    app.dependency_overrides.clear()
    app.dependency_overrides.update(prev_overrides)
    reset_rate_limiter_for_tests()


AUTH = {"X-Internal-Token": _TEST_TOKEN}


def test_rate_limiter_blocks():
    lim = UserRateLimiter(per_minute=2, per_day=10)
    assert lim.check(1).allowed
    assert lim.check(1).allowed
    d = lim.check(1)
    assert not d.allowed
    assert d.reason == "rate_limit_minute"


def test_circuit_breaker_opens():
    cb = CircuitBreaker("t", failure_threshold=2, recovery_timeout_sec=60)
    cb.before_call()
    cb.record_failure()
    cb.before_call()
    cb.record_failure()
    with pytest.raises(CircuitOpenError):
        cb.before_call()


def test_bridge_circuit_uses_settings():
    """AI_BRIDGE_CIRCUIT_* must drive breaker thresholds (not hardcode 5/60)."""
    from app.config import Settings
    from app.tools.be_bridge import get_bridge_circuit, reset_bridge_circuit_for_tests

    reset_bridge_circuit_for_tests()
    s = Settings(
        internal_shared_secret="test-token-for-circuit-cfg-ok",
        bridge_circuit_failures=2,
        bridge_circuit_recovery_sec=15.0,
    )
    cb = get_bridge_circuit(s)
    assert cb.failure_threshold == 2
    assert cb.recovery_timeout_sec == 15.0
    # Reconfigure
    reset_bridge_circuit_for_tests()
    s2 = Settings(
        internal_shared_secret="test-token-for-circuit-cfg-ok",
        bridge_circuit_failures=7,
        bridge_circuit_recovery_sec=90.0,
    )
    cb2 = get_bridge_circuit(s2)
    assert cb2.failure_threshold == 7
    assert cb2.recovery_timeout_sec == 90.0
    reset_bridge_circuit_for_tests()


@pytest.mark.asyncio
async def test_bridge_counts_one_failure_per_logical_request():
    """Retry nội bộ không được cộng nhiều failure — 1 logical call = 1 failure."""
    import httpx

    from app.resilience.circuit_breaker import CircuitBreaker, CircuitOpenError
    from app.tools.be_bridge import HttpBridgeClient

    cb = CircuitBreaker("t", failure_threshold=2, recovery_timeout_sec=60)

    def always_500(request: httpx.Request) -> httpx.Response:
        return httpx.Response(503, json={"error_code": "bridge_internal_error"})

    transport = httpx.MockTransport(always_500)
    client = httpx.AsyncClient(transport=transport)
    bridge = HttpBridgeClient("http://be", "secret", client=client, circuit=cb)

    # 1 logical request: 2 HTTP attempts, chỉ +1 failure
    r1 = await bridge.search_clinics("x")
    assert r1.get("error_code")
    assert cb.stats().failures == 1
    assert cb.stats().state == "closed"

    # 2nd logical → open
    await bridge.search_clinics("y")
    assert cb.stats().failures >= 2
    assert cb.stats().state == "open"
    with pytest.raises(CircuitOpenError):
        cb.before_call()

    await client.aclose()


def test_turn_lock_serializes():
    store = InMemorySessionStore()
    order: list[int] = []

    async def worker(i: int):
        async with store.turn_lock("sess1"):
            order.append(i)
            await asyncio.sleep(0.02)
            order.append(i + 10)

    async def main():
        await asyncio.gather(worker(1), worker(2))

    asyncio.run(main())
    # Nested pairs must not interleave as 1,2,11,12
    assert order in ([1, 11, 2, 12], [2, 12, 1, 11])


def test_privacy_export_delete(client):
    c, store = client
    r = c.post("/internal/ai/chat/sessions", json={"user_id": 9}, headers=AUTH)
    sid = r.json()["session_id"]
    c.post(f"/internal/ai/chat/sessions/{sid}/messages", json={"message": "chào"}, headers=AUTH)
    exp = c.get(f"/internal/ai/chat/sessions/{sid}/export", headers=AUTH)
    assert exp.status_code == 200
    body = exp.json()
    assert body["session"]["user_id"] == 9
    assert len(body["turns"]) >= 1
    deleted = c.delete(f"/internal/ai/chat/sessions/{sid}", headers=AUTH)
    assert deleted.status_code == 200
    # Soft-invalidate: row may remain but marked closed; active get must miss it.
    assert sid in store._closed
    # Message on deleted session -> 404 (get returns None)
    again = c.post(
        f"/internal/ai/chat/sessions/{sid}/messages",
        json={"message": "còn không?"},
        headers=AUTH,
    )
    assert again.status_code == 404
    # GET session active path also 404
    assert c.get(f"/internal/ai/chat/sessions/{sid}", headers=AUTH).status_code == 404


@pytest.mark.asyncio
async def test_delete_wipes_booking_context_and_blocks_get():
    from app.session.models import (
        AgentState,
        BookingRequirement,
        PendingConfirmation,
        SessionState,
    )
    from app.session.store import InMemorySessionStore, SessionClosedError

    store = InMemorySessionStore()
    state = SessionState(
        session_id="s_del",
        user_id=1,
        agent_state=AgentState.AWAITING_CONFIRMATION,
        channel_id="ai-consult-1",
        booking_requirement=BookingRequirement(doctor_id=9, service_id=3),
        pending_confirmation=PendingConfirmation(draft_id="d1", idempotency_key="k1"),
        patient_summary={"full_name": "Secret"},
    )
    await store.create(state)
    ok = await store.delete_session("s_del", purge_turns=True)
    assert ok
    assert await store.get("s_del") is None
    closed = await store.get_including_closed("s_del")
    assert closed is not None
    assert closed.agent_state == AgentState.FAILED
    assert closed.pending_confirmation is None
    assert closed.patient_summary is None
    assert closed.booking_requirement.doctor_id is None
    assert closed.channel_id is None
    with pytest.raises(SessionClosedError):
        await store.update(closed)


@pytest.mark.asyncio
async def test_get_vs_get_including_closed_api_contract():
    """get() active-only; get_including_closed() for export/audit."""
    from app.session.models import SessionState
    from app.session.store import InMemorySessionStore

    store = InMemorySessionStore()
    await store.create(SessionState(session_id="s_ab", user_id=2, channel_id="ch"))
    assert (await store.get("s_ab")) is not None
    assert (await store.get_including_closed("s_ab")) is not None
    await store.delete_session("s_ab")
    assert (await store.get("s_ab")) is None
    assert (await store.get_including_closed("s_ab")) is not None


def test_message_too_long_schema(client):
    c, _ = client
    r = c.post("/internal/ai/chat/sessions", json={"user_id": 3}, headers=AUTH)
    sid = r.json()["session_id"]
    r2 = c.post(
        f"/internal/ai/chat/sessions/{sid}/messages",
        json={"message": "x" * 2001},
        headers=AUTH,
    )
    assert r2.status_code == 422


def test_stale_open_session_is_replaced(client):
    c, store = client
    first = c.post(
        "/internal/ai/chat/sessions",
        json={"user_id": 7, "channel_id": "ai-consult-7"},
        headers=AUTH,
    )
    first_id = first.json()["session_id"]
    store._data[first_id].last_updated = datetime.now(timezone.utc) - timedelta(days=1)
    second = c.post(
        "/internal/ai/chat/sessions",
        json={"user_id": 7, "channel_id": "ai-consult-7"},
        headers=AUTH,
    )
    assert second.status_code == 200
    assert second.json()["session_id"] != first_id
    assert first_id in store._closed


def test_offline_eval_gate():
    from eval.run_offline import eval_confirm, eval_post_validate, eval_safety

    for suite in (eval_safety(), eval_confirm(), eval_post_validate()):
        assert suite.rate == 1.0, f"{suite.name} failed: {[r for r in suite.results if not r.ok]}"


def test_production_requires_rag_index():
    settings = Settings(
        env="production",
        internal_shared_secret="x" * 32,
        rag_require_index=False,
    )
    with pytest.raises(RuntimeError, match="AI_RAG_REQUIRE_INDEX"):
        settings.validate_for_runtime()


@pytest.mark.asyncio
async def test_retriever_propagates_embedding_outage(tmp_path):
    from app.rag.retriever import KnowledgeRetriever, RetrievalUnavailableError

    class BrokenEmbedding:
        provider = "test"
        model = "test"

        async def embed_query(self, text):
            raise RuntimeError("down")

    class NonEmptyCollection:
        def count(self):
            return 1

    retriever = KnowledgeRetriever(
        chroma_dir=str(tmp_path),
        knowledge_dir=str(tmp_path),
        embedder=BrokenEmbedding(),
    )
    retriever._collection = NonEmptyCollection()
    with pytest.raises(RetrievalUnavailableError):
        await retriever.retrieve("hello")
