"""Per-session turn serialization (Phase 4).

One turn at a time per session_id — acquired BEFORE LLM/tool execution.
In-memory for single process; Postgres advisory lock for multi-worker.
"""
from __future__ import annotations

import asyncio
import hashlib
import time
from contextlib import asynccontextmanager
from typing import AsyncIterator


def _session_lock_key(session_id: str) -> int:
    """Stable signed 64-bit key for pg_advisory_lock."""
    digest = hashlib.sha256(session_id.encode("utf-8")).digest()
    # PostgreSQL advisory lock takes bigint; use first 8 bytes signed.
    return int.from_bytes(digest[:8], "big", signed=True)


class TurnLockTimeout(RuntimeError):
    """Không lấy được turn lock trong thời gian cho phép (turn khác còn chạy)."""


class InMemoryTurnLocker:
    def __init__(self) -> None:
        self._locks: dict[str, asyncio.Lock] = {}
        self._meta = asyncio.Lock()

    async def _get(self, session_id: str) -> asyncio.Lock:
        async with self._meta:
            if session_id not in self._locks:
                self._locks[session_id] = asyncio.Lock()
            return self._locks[session_id]

    @asynccontextmanager
    async def turn_lock(
        self, session_id: str, timeout: float | None = None
    ) -> AsyncIterator[None]:
        lock = await self._get(session_id)
        try:
            await asyncio.wait_for(lock.acquire(), timeout)
        except asyncio.TimeoutError as exc:
            raise TurnLockTimeout(session_id) from exc
        try:
            yield
        finally:
            lock.release()


class PostgresTurnLocker:
    """Session-level advisory lock trên 1 connection giữ suốt turn.

    Dùng pg_try_advisory_lock + poll để có timeout (pg_advisory_lock chờ vô hạn
    sẽ giữ connection pool khi 1 turn treo).
    """

    _POLL_SEC = 0.05

    def __init__(self, engine) -> None:
        self._engine = engine

    @asynccontextmanager
    async def turn_lock(
        self, session_id: str, timeout: float | None = None
    ) -> AsyncIterator[None]:
        from sqlalchemy import text

        key = _session_lock_key(session_id)
        conn = await self._engine.connect()
        locked = False
        try:
            deadline = None if timeout is None else time.monotonic() + timeout
            while True:
                row = await conn.execute(text("SELECT pg_try_advisory_lock(:k)"), {"k": key})
                if row.scalar():
                    locked = True
                    break
                if deadline is not None and time.monotonic() >= deadline:
                    raise TurnLockTimeout(session_id)
                await asyncio.sleep(self._POLL_SEC)
            yield
        finally:
            released = not locked
            if locked:
                try:
                    await asyncio.shield(
                        conn.execute(text("SELECT pg_advisory_unlock(:k)"), {"k": key})
                    )
                    released = True
                except BaseException:  # noqa: BLE001 — kể cả cancel
                    released = False
            if not released:
                # Connection còn giữ lock: huỷ hẳn thay vì trả về pool (lock sống mãi).
                try:
                    await asyncio.shield(conn.invalidate())
                except BaseException:  # noqa: BLE001
                    pass
            try:
                await asyncio.shield(conn.close())
            except BaseException:  # noqa: BLE001
                pass


_memory_locker = InMemoryTurnLocker()


def get_memory_turn_locker() -> InMemoryTurnLocker:
    return _memory_locker
