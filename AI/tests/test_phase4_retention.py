"""Phase 4: retention (purge theo thời gian) + digest hội thoại dài."""
from __future__ import annotations

import asyncio
from datetime import timedelta

from app.api.chat import _load_history
from app.config import Settings
from app.session.history import DIGEST_MARKER, build_history_digest
from app.session.models import SessionState, _now
from app.session.retention import retention_loop, run_purge_once
from app.session.store import InMemorySessionStore


async def _seed(store: InMemorySessionStore, sid: str, age_days: int) -> None:
    st = SessionState(session_id=sid, user_id=1, channel_id=f"ch-{sid}")
    st.last_updated = _now() - timedelta(days=age_days)
    await store.create(st)
    await store.record_turn(session_id=sid, trace_id="t", user_message="u", ai_message="a")
    store._turns[sid][-1]["at"] = _now() - timedelta(days=age_days)


async def test_purge_closes_old_sessions_and_keeps_fresh():
    store = InMemorySessionStore()
    await _seed(store, "old", 40)
    await _seed(store, "fresh", 1)
    res = await store.purge_expired(session_days=30, turn_days=30)
    assert res["sessions_closed"] == 1
    assert res["turns_deleted"] == 1
    assert await store.get("old") is None
    assert await store.get("fresh") is not None
    assert len(store._turns["fresh"]) == 1


async def test_purge_hard_deletes_sessions_closed_long_ago():
    store = InMemorySessionStore()
    await _seed(store, "gone", 1)
    await store.delete_session("gone", purge_turns=False)
    store._closed_at["gone"] = _now() - timedelta(days=31)
    res = await store.purge_expired(session_days=30, turn_days=30)
    assert res["sessions_deleted"] == 1
    assert await store.get_including_closed("gone") is None
    assert "gone" not in store._turns


async def test_purge_deletes_old_turns_of_live_session():
    store = InMemorySessionStore()
    await _seed(store, "s", 1)
    await store.record_turn(session_id="s", trace_id="t2", user_message="u2", ai_message="a2")
    store._turns["s"][0]["at"] = _now() - timedelta(days=45)
    res = await store.purge_expired(session_days=30, turn_days=30)
    assert res["turns_deleted"] == 1
    assert [t["trace_id"] for t in store._turns["s"]] == ["t2"]
    assert await store.get("s") is not None


async def test_retention_loop_purges_periodically_and_survives_errors():
    class Flaky(InMemorySessionStore):
        calls = 0

        async def purge_expired(self, **kw):
            Flaky.calls += 1
            if Flaky.calls == 1:
                raise RuntimeError("db down")
            return await super().purge_expired(**kw)

    store = Flaky()
    s = Settings(retention_purge_interval_minutes=1)
    # Rút chu kỳ cho test: patch sleep.
    import app.session.retention as r

    real_sleep = asyncio.sleep

    async def fast(_):
        await real_sleep(0.01)

    r.asyncio.sleep = fast  # type: ignore[assignment]
    try:
        task = asyncio.create_task(retention_loop(lambda: store, s))
        await real_sleep(0.1)
        task.cancel()
        try:
            await task
        except asyncio.CancelledError:
            pass
    finally:
        r.asyncio.sleep = real_sleep  # type: ignore[assignment]
    assert Flaky.calls >= 2  # lỗi lần 1 không giết loop


async def test_run_purge_once_uses_settings():
    store = InMemorySessionStore()
    await _seed(store, "old", 5)
    res = await run_purge_once(store, Settings(session_retention_days=3, turn_retention_days=3))
    assert res["sessions_closed"] == 1


# --- digest -----------------------------------------------------------------


def test_digest_bounded_and_keeps_most_recent_lines():
    older = [(f"yêu cầu số {i} " + "x" * 300, None) for i in range(50)]
    d = build_history_digest(older, max_chars=600, per_item_chars=100)
    assert d is not None and d.startswith(DIGEST_MARKER)
    assert len(d) <= 700
    assert "yêu cầu số 49" in d and "yêu cầu số 0 " not in d
    assert "bị lược" in d


def test_digest_empty():
    assert build_history_digest([(None, "a"), ("", None)]) is None


async def test_load_history_window_plus_digest():
    store = InMemorySessionStore()
    await store.create(SessionState(session_id="s", user_id=1))
    for i in range(10):
        await store.record_turn(session_id="s", trace_id=str(i), user_message=f"m{i}", ai_message=f"r{i}")
    s = Settings(ai_history_max_turns=3, ai_history_digest_turns=20)
    hist = await _load_history(store, "s", s)
    assert hist[0][0].startswith(DIGEST_MARKER) and "m6" in hist[0][0] and "m7" not in hist[0][0]
    assert hist[1:] == [("m7", "r7"), ("m8", "r8"), ("m9", "r9")]

    short = await _load_history(store, "s", Settings(ai_history_max_turns=20))
    assert len(short) == 10 and not short[0][0].startswith(DIGEST_MARKER)

    off = await _load_history(store, "s", Settings(ai_history_max_turns=3, ai_history_digest_turns=0))
    assert off == [("m7", "r7"), ("m8", "r8"), ("m9", "r9")]
