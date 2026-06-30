"""Observability tối thiểu: trace_id + log JSON (stdlib logging, chưa cần structlog)."""
from __future__ import annotations

import json
import logging
import uuid

logger = logging.getLogger("ai")


def new_trace_id() -> str:
    return uuid.uuid4().hex


def log_event(event: str, **fields) -> None:
    """Log 1 dòng JSON: {event, trace_id, session_id, model, latency_ms, ...}."""
    logger.info(json.dumps({"event": event, **fields}, default=str, ensure_ascii=False))
