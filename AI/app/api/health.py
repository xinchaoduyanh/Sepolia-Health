"""Health endpoints — public. Liveness vs readiness tách biệt."""
from __future__ import annotations

import logging
import os
from pathlib import Path

import httpx
from fastapi import APIRouter, Response, status

from app.config import get_settings
from app.deps import get_store
from app.rag.indexer import (
    COLLECTION_NAME,
    knowledge_fingerprint,
    load_index_manifest,
)

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
        manifest = load_index_manifest(settings.chroma_dir)
        chroma_path = Path(settings.chroma_dir)
        if not manifest:
            ready_ok = False
            checks["rag"] = "missing_manifest"
        elif not chroma_path.exists():
            ready_ok = False
            checks["rag"] = "missing_chroma_dir"
        else:
            try:
                import chromadb  # type: ignore

                client = chromadb.PersistentClient(path=str(chroma_path))
                try:
                    coll = client.get_collection(COLLECTION_NAME)
                    count = coll.count()
                except Exception:  # noqa: BLE001
                    count = 0
                expected = int(manifest.get("chunks") or 0)
                current_hash = knowledge_fingerprint(settings.knowledge_dir)
                manifest_ok = (
                    manifest.get("collection") == COLLECTION_NAME
                    and manifest.get("embedding_model") == settings.embedding_model
                    and manifest.get("knowledge_hash") == current_hash
                )
                if count <= 0 or count != expected or not manifest_ok:
                    ready_ok = False
                    checks["rag"] = {
                        "status": "empty_or_stale",
                        "count": count,
                        "manifest_chunks": expected,
                        "embedding_model": manifest.get("embedding_model"),
                        "manifest_matches_runtime": manifest_ok,
                    }
                else:
                    checks["rag"] = {
                        "status": "ok",
                        "count": count,
                        "manifest_chunks": expected,
                        "embedding_model": manifest.get("embedding_model"),
                        "collection": manifest.get("collection", COLLECTION_NAME),
                    }
            except Exception as exc:  # noqa: BLE001
                ready_ok = False
                checks["rag"] = f"error:{type(exc).__name__}"
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
