"""Retention job nền: định kỳ close session / xoá turn quá hạn."""
from __future__ import annotations

import asyncio
import logging

from app.config import Settings
from app.observability.tracing import log_event
from app.session.store import SessionStore

_LOG = logging.getLogger(__name__)


async def run_purge_once(store: SessionStore, settings: Settings) -> dict[str, int]:
    result = await store.purge_expired(
        session_days=settings.session_retention_days,
        turn_days=settings.turn_retention_days,
    )
    log_event("retention_purge", **result)
    return result


async def retention_loop(store_factory, settings: Settings) -> None:
    """Chờ hết 1 chu kỳ rồi mới purge (không chạm DB lúc khởi động); lỗi không giết loop."""
    interval = settings.retention_purge_interval_minutes * 60
    while True:
        await asyncio.sleep(interval)
        try:
            await run_purge_once(store_factory(), settings)
        except asyncio.CancelledError:
            raise
        except Exception:  # noqa: BLE001
            _LOG.exception("retention purge failed")
