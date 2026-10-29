"""Health endpoints — public. Liveness vs readiness tách biệt."""
from __future__ import annotations

import logging
import asyncio

from fastapi import APIRouter, Response, status

from app.config import get_settings
from app.deps import get_store
from app.rag.indexer import check_index

logger = logging.getLogger(__name__)
router = APIRouter(tags=["health"])


@router.get("/health")
async def health() -> dict:
    """Liveness: process FastAPI còn sống."""
    return {"status": "ok"}


@router.get("/ready")
async def ready(response: Response) -> dict:
    """Readiness: DB + (optional) RAG index. Không gọi Vertex generate mỗi lần."""
    settings = get_settings()
    checks: dict[str, object] = {}
    ready_ok = True

    # --- database (session store) ---
    store = get_store()
    ping = getattr(store, "ping", None)
    if ping is not None:
        try:
            await ping()
            checks["database"] = "ok"
        except Exception as exc:  # noqa: BLE001
            ready_ok = False
            checks["database"] = f"error:{type(exc).__name__}"
            logger.warning("readiness database failed: %s", type(exc).__name__)
    else:
        checks["database"] = "skipped"

    # --- RAG index (enable via AI_RAG_REQUIRE_INDEX=true after index build) ---
    if settings.rag_require_index:
        status_ = await asyncio.to_thread(check_index, settings)
        checks["rag"] = status_.detail()
        if not status_.ok:
            ready_ok = False
    else:
        checks["rag"] = "skipped"

    # --- bridge config presence (not live HTTP probe every readiness) ---
    if not settings.be_bridge_base_url:
        ready_ok = False
        checks["bridge_base_url"] = False
    else:
        checks["bridge_base_url"] = True
    checks["provider"] = (
        "vertex"
        if settings.gemini_use_vertex
        else ("gemini_api" if settings.gemini_api_key else "ollama")
    )

    if not ready_ok:
        response.status_code = status.HTTP_503_SERVICE_UNAVAILABLE
        return {"status": "not_ready", "checks": checks}
    return {"status": "ready", "checks": checks}
