"""Simple circuit breaker for bridge/provider calls.

States: closed (normal) → open (fail-fast) → half_open (probe).
"""
from __future__ import annotations

import threading
import time
from dataclasses import dataclass


class CircuitOpenError(RuntimeError):
    """Raised when circuit is open and calls are rejected."""


@dataclass
class CircuitStats:
    state: str
    failures: int
    successes: int
    opened_at: float | None


class CircuitBreaker:
    def __init__(
        self,
        name: str,
        *,
        failure_threshold: int = 5,
        recovery_timeout_sec: float = 60.0,
        half_open_successes: int = 2,
    ) -> None:
        self.name = name
        self.failure_threshold = failure_threshold
        self.recovery_timeout_sec = recovery_timeout_sec
        self.half_open_successes = half_open_successes
        self._failures = 0
        self._half_open_ok = 0
        self._state = "closed"
        self._opened_at: float | None = None
        self._lock = threading.Lock()

    def stats(self) -> CircuitStats:
        with self._lock:
            return CircuitStats(
                state=self._state,
                failures=self._failures,
                successes=self._half_open_ok,
                opened_at=self._opened_at,
            )

    def _maybe_half_open(self) -> None:
        if self._state == "open" and self._opened_at is not None:
            if time.monotonic() - self._opened_at >= self.recovery_timeout_sec:
                self._state = "half_open"
                self._half_open_ok = 0

    def before_call(self) -> None:
        with self._lock:
            self._maybe_half_open()
            if self._state == "open":
                raise CircuitOpenError(f"circuit_open:{self.name}")

    def record_success(self) -> None:
        with self._lock:
            if self._state == "half_open":
                self._half_open_ok += 1
                if self._half_open_ok >= self.half_open_successes:
                    self._state = "closed"
                    self._failures = 0
                    self._opened_at = None
            else:
                self._failures = 0

    def record_failure(self) -> None:
        with self._lock:
            self._failures += 1
            if self._state == "half_open" or self._failures >= self.failure_threshold:
                self._state = "open"
                self._opened_at = time.monotonic()
                self._half_open_ok = 0
