"""Telemetry cho guardrail: mỗi lần một guard kích hoạt -> 1 log event + counter.

Chỉ ghi nhãn rule (vd "sh:tu sat"), không ghi text người dùng/model.
"""
from __future__ import annotations

import threading
from collections import Counter

from app.observability.tracing import log_event

_counts: Counter[tuple[str, str]] = Counter()
_lock = threading.Lock()


def record_guard(
    guard: str,
    action: str,
    *,
    trace_id: str | None = None,
    session_id: str | None = None,
    user_id: int | None = None,
    rules: list[str] | None = None,
) -> None:
    """guard: pre_filter|post_validator|rate_limit|...; action: block|flag|replace|reject."""
    with _lock:
        _counts[(guard, action)] += 1
    log_event(
        "guard_triggered",
        guard=guard,
        action=action,
        trace_id=trace_id,
        session_id=session_id,
        user_id=user_id,
        rules=rules or [],
    )


def snapshot() -> dict[str, int]:
    with _lock:
        return {f"{g}:{a}": n for (g, a), n in sorted(_counts.items())}


def reset_for_tests() -> None:
    with _lock:
        _counts.clear()
