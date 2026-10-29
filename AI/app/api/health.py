"""Health endpoints — public. Liveness vs readiness tách biệt."""
from __future__ import annotations

import logging
import asyncio
import os
from pathlib import Path

import httpx
from fastapi import APIRouter, Response, status

from app.config import get_settings
from app.deps import get_store
from app.rag.indexer import check_index

logger = logging.getLogger(__name__)
router = APIRouter(tags=["health"])

_PROBE_TIMEOUT_SEC = 2.0


def _vertex_credential_state(settings) -> tuple[bool, str]:
    """Kiểm tra credential Vertex tồn tại (file SA hoặc ADC) và project đã set."""
    if not settings.gemini_project:
        return False, "missing_project"
    path = settings.google_credentials or os.environ.get("GOOGLE_APPLICATION_CREDENTIALS", "")
    if path:
        return (True, "ok") if Path(path).is_file() else (False, "credential_file_missing")
    try:
        import google.auth  # type: ignore

        google.auth.default()
        return True, "ok"
    except Exception as exc:  # noqa: BLE001
        return False, f"adc_unavailable:{type(exc).__name__}"


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

    # --- bridge: Be/ must answer HTTP (any status = reachable) ---
    if not settings.be_bridge_base_url:
        ready_ok = False
        checks["bridge"] = "not_configured"
    else:
        try:
            async with httpx.AsyncClient(timeout=_PROBE_TIMEOUT_SEC) as client:
                await client.get(settings.be_bridge_base_url)
            checks["bridge"] = "ok"
        except Exception as exc:  # noqa: BLE001
            ready_ok = False
            checks["bridge"] = f"unreachable:{type(exc).__name__}"
            logger.warning("readiness bridge failed: %s", type(exc).__name__)

    # --- provider credential (no generate call) ---
    if settings.gemini_use_vertex:
        cred_ok, cred_state = _vertex_credential_state(settings)
        checks["provider"] = "vertex"
        checks["vertex_credential"] = cred_state
        if not cred_ok:
            ready_ok = False
    else:
        checks["provider"] = "gemini_api" if settings.gemini_api_key else "ollama"

    if not ready_ok:
        response.status_code = status.HTTP_503_SERVICE_UNAVAILABLE
        return {"status": "not_ready", "checks": checks}
    return {"status": "ready", "checks": checks}
