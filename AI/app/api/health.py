"""Health endpoints — không cần auth."""
from __future__ import annotations

from fastapi import APIRouter

router = APIRouter(tags=["health"])


@router.get("/health")
async def health() -> dict:
    return {"status": "ok"}


@router.get("/ready")
async def ready() -> dict:
    # V1: luôn ready. Sau này check Ollama/DB reachable.
    return {"status": "ready"}
