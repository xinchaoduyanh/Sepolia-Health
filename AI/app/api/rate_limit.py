"""In-process rate limit per user (Phase 7).

Suitable for single-worker AI. Multi-instance: put Redis in front or
share counters externally.
"""
from __future__ import annotations

import threading
import time
from collections import defaultdict, deque
from dataclasses import dataclass


@dataclass
class RateLimitDecision:
    allowed: bool
    reason: str | None = None
    retry_after_sec: int | None = None


class UserRateLimiter:
    def __init__(
        self,
        *,
        per_minute: int = 30,
        per_day: int = 500,
    ) -> None:
        self.per_minute = per_minute
        self.per_day = per_day
        self._minute: dict[int | str, deque[float]] = defaultdict(deque)
        self._day: dict[int | str, deque[float]] = defaultdict(deque)
        self._lock = threading.Lock()

    def check(self, user_id: int | str) -> RateLimitDecision:
        now = time.time()
        minute_cut = now - 60.0
        day_cut = now - 86400.0
        with self._lock:
            mq = self._minute[user_id]
            dq = self._day[user_id]
            while mq and mq[0] < minute_cut:
                mq.popleft()
            while dq and dq[0] < day_cut:
                dq.popleft()
            if len(mq) >= self.per_minute:
                retry = max(1, int(60 - (now - mq[0])))
                return RateLimitDecision(False, "rate_limit_minute", retry)
            if len(dq) >= self.per_day:
                retry = max(1, int(86400 - (now - dq[0])))
                return RateLimitDecision(False, "rate_limit_day", retry)
            mq.append(now)
            dq.append(now)
            return RateLimitDecision(True)


# Process-wide limiter; configured from settings at first use.
_limiter: UserRateLimiter | None = None
_limiter_lock = threading.Lock()


def get_rate_limiter(per_minute: int = 30, per_day: int = 500) -> UserRateLimiter:
    global _limiter
    with _limiter_lock:
        if _limiter is None:
            _limiter = UserRateLimiter(per_minute=per_minute, per_day=per_day)
        return _limiter


_ip_limiter: UserRateLimiter | None = None


def get_ip_rate_limiter(per_minute: int, per_day: int) -> UserRateLimiter:
    """Limiter riêng theo client IP (cùng cơ chế sliding window với user limiter)."""
    global _ip_limiter
    with _limiter_lock:
        if _ip_limiter is None:
            _ip_limiter = UserRateLimiter(per_minute=per_minute, per_day=per_day)
        return _ip_limiter


def reset_rate_limiter_for_tests() -> None:
    global _limiter, _ip_limiter
    with _limiter_lock:
        _limiter = None
        _ip_limiter = None
