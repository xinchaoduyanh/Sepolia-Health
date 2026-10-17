"""Per-session turn serialization (Phase 4).

One turn at a time per session_id — acquired BEFORE LLM/tool execution.
In-memory for single process; Postgres advisory lock for multi-worker.
"""
from __future__ import annotations

import asyncio
import hashlib
from contextlib import asynccontextmanager
from typing import AsyncIterator


def _session_lock_key(session_id: str) -> int:
    """Stable signed 64-bit key for pg_advisory_lock."""
    digest = hashlib.sha256(session_id.encode("utf-8")).digest()
    # PostgreSQL advisory lock takes bigint; use first 8 bytes signed.
    return int.from_bytes(digest[:8], "big", signed=True)


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
    async def turn_lock(self, session_id: str) -> AsyncIterator[None]:
        lock = await self._get(session_id)
        await lock.acquire()
        try:
            yield
        finally:
            lock.release()


class PostgresTurnLocker:
    """Uses a dedicated connection held for the turn duration."""

    def __init__(self, engine) -> None:
        self._engine = engine

    @asynccontextmanager
    async def turn_lock(self, session_id: str) -> AsyncIterator[None]:
        from sqlalchemy import text

        key = _session_lock_key(session_id)
        conn = await self._engine.connect()
        try:
            # Wait for lock (serialize turns). Timeout via statement_timeout optional.
            await conn.execute(text("SELECT pg_advisory_lock(:k)"), {"k": key})
            yield
        finally:
            try:
                await conn.execute(text("SELECT pg_advisory_unlock(:k)"), {"k": key})
            except Exception:  # noqa: BLE001
                pass
            await conn.close()


_memory_locker = InMemoryTurnLocker()


def get_memory_turn_locker() -> InMemoryTurnLocker:
    return _memory_locker
