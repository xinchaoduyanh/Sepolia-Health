"""FastAPI entry. Chạy dev: uvicorn app.main:app --reload --port 8088."""
from __future__ import annotations

import logging
from contextlib import asynccontextmanager

from fastapi import Depends, FastAPI

from app.api import chat, health
from app.config import get_settings
from app.deps import get_store, require_internal_token


@asynccontextmanager
async def lifespan(app: FastAPI):
    yield
    # Đóng connection pool của session store lúc shutdown.
    store = get_store()
    dispose = getattr(store, "dispose", None)
    if dispose is not None:
        await dispose()


def create_app() -> FastAPI:
    settings = get_settings()
    logging.basicConfig(level=settings.log_level)

    app = FastAPI(title="Sepolia AI Service", version="0.1.0", lifespan=lifespan)

    # Health: public.
    app.include_router(health.router)
    # Internal API: bắt buộc X-Internal-Token.
    app.include_router(
        chat.router,
        prefix="/internal/ai",
        dependencies=[Depends(require_internal_token)],
    )
    return app


app = create_app()
