"""FastAPI entry. Chạy dev: uvicorn app.main:app --reload --port 8088."""
from __future__ import annotations

import asyncio
import logging
from contextlib import asynccontextmanager

from fastapi import Depends, FastAPI

from app.api import chat, health
from app.config import get_settings
from app.session.retention import retention_loop
from app.deps import get_store, require_internal_token


@asynccontextmanager
async def lifespan(app: FastAPI):
    settings = get_settings()
    purge_task = None
    if settings.retention_purge_interval_minutes > 0:
        purge_task = asyncio.create_task(retention_loop(get_store, settings))
    try:
        yield
    finally:
        if purge_task is not None:
            purge_task.cancel()
            try:
                await purge_task
            except asyncio.CancelledError:
                pass
    # Đóng connection pool của session store lúc shutdown.
    store = get_store()
    dispose = getattr(store, "dispose", None)
    if dispose is not None:
        await dispose()


def create_app() -> FastAPI:
    settings = get_settings()
    logging.basicConfig(level=settings.log_level)
    log = logging.getLogger(__name__)

    # Production: fail-fast. Development: warn only.
    try:
        settings.validate_for_runtime()
    except RuntimeError:
        raise
    if settings.internal_shared_secret.strip().lower() in {"changeme", "change-me", "secret"}:
        log.warning(
            "AI_INTERNAL_SHARED_SECRET đang dùng giá trị yếu — "
            "đổi ngay trong .env trước khi deploy production."
        )

    app = FastAPI(title="Sepolia AI Service", version="0.2.0", lifespan=lifespan)

    # Health: public (liveness + readiness).
    app.include_router(health.router)
    # Internal API: bắt buộc X-Internal-Token.
    app.include_router(
        chat.router,
        prefix="/internal/ai",
        dependencies=[Depends(require_internal_token)],
    )
    return app


app = create_app()
