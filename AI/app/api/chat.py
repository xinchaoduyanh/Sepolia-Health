"""Chat endpoints — session + turn loop with locks, rate limit, privacy."""
from __future__ import annotations

import asyncio
import json
import logging
import time
from contextlib import asynccontextmanager
import uuid
from datetime import datetime, timedelta, timezone
from typing import Awaitable, Callable

from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import StreamingResponse

from app.api.rate_limit import get_ip_rate_limiter, get_rate_limiter
from app.api.schemas import (
    CreateSessionRequest,
    CreateSessionResponse,
    MessageRequest,
    MessageResponse,
)
from app.config import Settings, get_settings
from app.deps import (
    build_agent_for_user,
    get_bridge,
    get_emergency_detector,
    get_knowledge_policy,
    get_provider,
    get_registry,
    get_retriever,
    get_store,
)
from app.observability.guards import record_guard
from app.observability.redact import redact_obj, redact_text
from app.observability.tracing import log_event, new_trace_id
from app.prompts.loader import PromptRegistry
from app.providers.base import AIProvider
from app.rag.emergency import EmergencyDetector
from app.rag.policy import KnowledgePolicy
from app.rag.retriever import KnowledgeRetriever
from app.routing.model_router import ModelRouter
from app.session.history import build_history_digest
from app.session.models import SessionState
from app.session.retention import run_purge_once
from app.session.store import (
    SessionBusyError,
    SessionClosedError,
    SessionConflictError,
    SessionStore,
)
from app.tools.be_bridge import BridgeClient

_LOG = logging.getLogger(__name__)

router = APIRouter(prefix="/chat", tags=["chat"])


def _session_fresh(state: SessionState, max_age_minutes: int) -> bool:
    last = state.last_updated
    if last.tzinfo is None:  # snapshot cũ lưu naive datetime
        last = last.replace(tzinfo=timezone.utc)
    return datetime.now(timezone.utc) - last <= timedelta(minutes=max_age_minutes)


def _enforce_rate_limit(user_id: int, settings: Settings) -> None:
    if settings.rate_limit_per_minute <= 0 and settings.rate_limit_per_day <= 0:
        return
    limiter = get_rate_limiter(
        per_minute=max(1, settings.rate_limit_per_minute) if settings.rate_limit_per_minute else 10**9,
        per_day=max(1, settings.rate_limit_per_day) if settings.rate_limit_per_day else 10**9,
    )
    decision = limiter.check(user_id)
    if not decision.allowed:
        record_guard("rate_limit", "reject", user_id=user_id, rules=[decision.reason or "rate_limited"])
        raise HTTPException(
            status_code=429,
            detail={
                "error_code": decision.reason or "rate_limited",
                "retry_after_sec": decision.retry_after_sec,
            },
            headers={"Retry-After": str(decision.retry_after_sec or 60)},
        )


def client_ip(request: Request, settings: Settings) -> str:
    if settings.trust_proxy_headers:
        fwd = request.headers.get("x-forwarded-for", "")
        first = fwd.split(",")[0].strip()
        if first:
            return first
    return request.client.host if request.client else "unknown"


def enforce_ip_rate_limit(request: Request, settings: Settings = Depends(get_settings)) -> None:
    """Dependency cho các route sinh turn: 429 khi một IP vượt ngưỡng."""
    per_min, per_day = settings.ip_rate_limit_per_minute, settings.ip_rate_limit_per_day
    if per_min <= 0 and per_day <= 0:
        return
    limiter = get_ip_rate_limiter(
        per_minute=per_min if per_min > 0 else 10**9,
        per_day=per_day if per_day > 0 else 10**9,
    )
    decision = limiter.check(client_ip(request, settings))
    if not decision.allowed:
        record_guard("ip_rate_limit", "reject", rules=[decision.reason or "rate_limited"])
        raise HTTPException(
            status_code=429,
            detail={
                "error_code": "ip_" + (decision.reason or "rate_limited"),
                "retry_after_sec": decision.retry_after_sec,
            },
            headers={"Retry-After": str(decision.retry_after_sec or 60)},
        )


async def _require_open_session(store: SessionStore, session_id: str) -> SessionState:
    """Chặn closed/deleted ở MỌI path turn (message / stream / confirm / cancel).

    Dùng store.get() — KHÔNG dùng get_including_closed().
    """
    state = await store.get(session_id)
    if state is None:
        raise HTTPException(
            status_code=404,
            detail={"error_code": "session_not_found_or_closed", "session_id": session_id},
        )
    return state


@router.post("/sessions", response_model=CreateSessionResponse)
async def create_session(
    req: CreateSessionRequest,
    store: SessionStore = Depends(get_store),
    settings: Settings = Depends(get_settings),
) -> CreateSessionResponse:
    if req.channel_id:
        existing = await store.get_open_by_channel(req.channel_id)
        # Defense-in-depth: chỉ reconnect nếu session thuộc đúng user + còn tươi.
        if existing:
            if existing.user_id != req.user_id:
                raise HTTPException(
                    status_code=409,
                    detail={"error_code": "channel_owned_by_another_user"},
                )
            if _session_fresh(existing, settings.session_reconnect_max_age_minutes):
                log_event(
                    "session_reconnected",
                    session_id=existing.session_id,
                    user_id=req.user_id,
                )
                return CreateSessionResponse(session_id=existing.session_id)
            # Release partial unique index before creating the replacement.
            await store.delete_session(existing.session_id, purge_turns=False)
            log_event(
                "session_expired",
                session_id=existing.session_id,
                user_id=req.user_id,
            )

    session_id = "sess_" + uuid.uuid4().hex[:16]
    state = SessionState(session_id=session_id, user_id=req.user_id, channel_id=req.channel_id)
    created = await store.create(state)
    if created.user_id != req.user_id:
        raise HTTPException(
            status_code=409,
            detail={"error_code": "channel_owned_by_another_user"},
        )
    event = "session_created" if created.session_id == session_id else "session_reconnected"
    log_event(event, session_id=created.session_id, user_id=req.user_id)
    return CreateSessionResponse(session_id=created.session_id)


@router.get("/sessions/{session_id}", response_model=SessionState)
async def get_session(session_id: str, store: SessionStore = Depends(get_store)) -> SessionState:
    # Active only — closed session 404 (cùng contract message/confirm).
    return await _require_open_session(store, session_id)


@router.get("/sessions/{session_id}/export")
async def export_session(
    session_id: str,
    store: SessionStore = Depends(get_store),
) -> dict:
    """Privacy: export qua get_including_closed (metadata wipe), không reopen turn."""
    payload = await store.export_session(session_id)
    if payload is None:
        raise HTTPException(status_code=404, detail="session not found")
    return payload


@router.delete("/sessions/{session_id}")
async def delete_session(
    session_id: str,
    store: SessionStore = Depends(get_store),
) -> dict:
    """Privacy: invalidate session (closedAt + wipe state) and purge turns.

    Sau DELETE: get() / messages / stream / confirm / cancel → 404.
    BE Map cache phải recreate session (404/410).
    """
    # Cho phép delete idempotent cả session đã closed (export/audit row còn).
    existing = await store.get_including_closed(session_id)
    if existing is None:
        raise HTTPException(status_code=404, detail="session not found")
    ok = await store.delete_session(session_id, purge_turns=True)
    if not ok:
        raise HTTPException(status_code=404, detail="session not found")
    log_event("session_deleted", session_id=session_id)
    return {"status": "deleted", "session_id": session_id, "invalidated": True}


@router.post("/admin/purge-expired")
async def purge_expired(
    store: SessionStore = Depends(get_store),
    settings: Settings = Depends(get_settings),
) -> dict:
    """Retention job (call from cron with internal token)."""
    result = await run_purge_once(store, settings)
    return {"status": "ok", **result}


@asynccontextmanager
async def _turn_guard(store: SessionStore, session_id: str, settings: Settings):
    """Turn lock; quá hạn chờ -> 409 session_busy (client retry)."""
    try:
        async with store.turn_lock(session_id, settings.session_turn_lock_timeout_sec):
            yield
    except SessionBusyError:
        raise HTTPException(
            status_code=409,
            detail={"error_code": "session_busy", "retry_after_sec": 5},
            headers={"Retry-After": "5"},
        ) from None


async def _load_history(
    store: SessionStore, session_id: str, settings: Settings
) -> list[tuple[str | None, str | None]]:
    window = settings.ai_history_max_turns
    extra = max(0, settings.ai_history_digest_turns)
    turns = await store.list_recent_turns(session_id, window + extra)
    if len(turns) <= window:
        return turns
    older, recent = turns[:-window] if window > 0 else turns, turns[-window:] if window > 0 else []
    digest = build_history_digest(older, max_chars=settings.ai_history_digest_max_chars)
    return ([(digest, None)] if digest else []) + recent


async def _run_turn(
    session_id: str,
    message: str,
    store: SessionStore,
    provider: AIProvider,
    bridge: BridgeClient,
    prompts: PromptRegistry,
    settings: Settings,
    retriever: KnowledgeRetriever | None,
    emergency_detector: EmergencyDetector | None,
    knowledge_policy: KnowledgePolicy | None,
    stream_callback: Callable[[str], Awaitable[None]] | None = None,
) -> MessageResponse:
    # Gate closed session — message / confirm / cancel / stream đều qua đây.
    state = await _require_open_session(store, session_id)

    if len(message) > settings.max_message_chars:
        raise HTTPException(
            status_code=400,
            detail={"error_code": "message_too_long", "max": settings.max_message_chars},
        )

    _enforce_rate_limit(state.user_id, settings)

    # Phase 4: serialize turns before LLM/tool execution.
    async with _turn_guard(store, session_id, settings):
        # Re-read under lock (delete có thể xảy ra giữa chừng).
        state = await _require_open_session(store, session_id)

        agent = build_agent_for_user(
            state.user_id,
            provider,
            bridge,
            prompts,
            settings,
            retriever=retriever,
            emergency_detector=emergency_detector,
            knowledge_policy=knowledge_policy,
        )
        history = await _load_history(store, session_id, settings)

        trace_id = new_trace_id()
        started = time.perf_counter()
        resp = None
        try:
            resp = await agent.handle_turn(
                state, message, trace_id, history=history, stream_callback=stream_callback
            )
        finally:
            latency_ms = int((time.perf_counter() - started) * 1000)
            try:
                await store.update(state)
            except SessionClosedError:
                raise HTTPException(status_code=410, detail="session closed")
            except SessionConflictError:
                if resp is None:
                    pass
                else:
                    raise HTTPException(status_code=409, detail="session busy, retry")

            log_event(
                "turn",
                session_id=session_id,
                trace_id=trace_id,
                state=state.agent_state.value,
                latency_ms=latency_ms,
                injection_suspected=bool(resp and resp.injection_suspected),
                policy_violations=(resp.policy_violations if resp else None),
            )

            if resp is not None:
                try:
                    # toolCalls = lời gọi (name+args); toolResults = summary ok/error.
                    # Không copy summary vào toolCalls (P3 audit bug).
                    await store.record_turn(
                        session_id=session_id,
                        trace_id=trace_id,
                        user_message=redact_text(message),
                        ai_message=redact_text(resp.message),
                        tool_results=redact_obj([s.model_dump() for s in resp.tool_results_summary]),
                        tool_calls=redact_obj([c.model_dump() for c in resp.tool_calls_audit]),
                        model=ModelRouter(settings).select("response"),
                        latency_ms=latency_ms,
                        policy_violations={
                            "violations": resp.policy_violations,
                            "injection_suspected": resp.injection_suspected,
                        },
                    )
                except Exception:
                    _LOG.exception("record_turn failed for session %s trace %s", session_id, trace_id)

        return resp


@router.post("/sessions/{session_id}/messages", response_model=MessageResponse, dependencies=[Depends(enforce_ip_rate_limit)])
async def post_message(
    session_id: str,
    req: MessageRequest,
    store: SessionStore = Depends(get_store),
    provider: AIProvider = Depends(get_provider),
    bridge: BridgeClient = Depends(get_bridge),
    prompts: PromptRegistry = Depends(get_registry),
    settings: Settings = Depends(get_settings),
    retriever: KnowledgeRetriever = Depends(get_retriever),
    emergency_detector: EmergencyDetector = Depends(get_emergency_detector),
    knowledge_policy: KnowledgePolicy = Depends(get_knowledge_policy),
) -> MessageResponse:
    return await _run_turn(
        session_id,
        req.message,
        store,
        provider,
        bridge,
        prompts,
        settings,
        retriever,
        emergency_detector,
        knowledge_policy,
    )


@router.post("/sessions/{session_id}/messages/stream", dependencies=[Depends(enforce_ip_rate_limit)])
async def stream_message(
    session_id: str,
    req: MessageRequest,
    store: SessionStore = Depends(get_store),
    provider: AIProvider = Depends(get_provider),
    bridge: BridgeClient = Depends(get_bridge),
    prompts: PromptRegistry = Depends(get_registry),
    settings: Settings = Depends(get_settings),
    retriever: KnowledgeRetriever = Depends(get_retriever),
    emergency_detector: EmergencyDetector = Depends(get_emergency_detector),
    knowledge_policy: KnowledgePolicy = Depends(get_knowledge_policy),
):
    # Fail-fast HTTP 404 TRƯỚC StreamingResponse (closed → get() None).
    # Nếu để lỗi trong SSE task, BE nhận 200 và Map cache không invalidate.
    await _require_open_session(store, session_id)

    queue: asyncio.Queue = asyncio.Queue()

    async def stream_callback(chunk: str):
        await queue.put({"type": "chunk", "text": chunk})

    async def run_task():
        try:
            resp = await _run_turn(
                session_id,
                req.message,
                store,
                provider,
                bridge,
                prompts,
                settings,
                retriever,
                emergency_detector,
                knowledge_policy,
                stream_callback=stream_callback,
            )
            await queue.put({"type": "final", "response": resp.model_dump(mode="json")})
        except HTTPException as he:
            detail = he.detail if isinstance(he.detail, dict) else {"message": str(he.detail)}
            await queue.put(
                {
                    "type": "error",
                    "status": he.status_code,
                    **(detail if isinstance(detail, dict) else {"message": detail}),
                }
            )
        except Exception:
            _LOG.exception("Error in stream task")
            await queue.put(
                {"type": "error", "message": "Có lỗi xảy ra, anh/chị thử lại giúp em nhé."}
            )
        finally:
            await queue.put(None)

    async def sse_generator():
        task = asyncio.create_task(run_task())
        try:
            while True:
                chunk = await queue.get()
                if chunk is None:
                    break
                yield f"data: {json.dumps(chunk, ensure_ascii=False)}\n\n"
        finally:
            task.cancel()

    return StreamingResponse(sse_generator(), media_type="text/event-stream")


@router.post("/sessions/{session_id}/confirm", response_model=MessageResponse, dependencies=[Depends(enforce_ip_rate_limit)])
async def confirm(
    session_id: str,
    store: SessionStore = Depends(get_store),
    provider: AIProvider = Depends(get_provider),
    bridge: BridgeClient = Depends(get_bridge),
    prompts: PromptRegistry = Depends(get_registry),
    settings: Settings = Depends(get_settings),
    retriever: KnowledgeRetriever = Depends(get_retriever),
    emergency_detector: EmergencyDetector = Depends(get_emergency_detector),
    knowledge_policy: KnowledgePolicy = Depends(get_knowledge_policy),
) -> MessageResponse:
    return await _run_turn(
        session_id,
        "vâng",
        store,
        provider,
        bridge,
        prompts,
        settings,
        retriever,
        emergency_detector,
        knowledge_policy,
    )


@router.post("/sessions/{session_id}/cancel", response_model=MessageResponse, dependencies=[Depends(enforce_ip_rate_limit)])
async def cancel(
    session_id: str,
    store: SessionStore = Depends(get_store),
    provider: AIProvider = Depends(get_provider),
    bridge: BridgeClient = Depends(get_bridge),
    prompts: PromptRegistry = Depends(get_registry),
    settings: Settings = Depends(get_settings),
    retriever: KnowledgeRetriever = Depends(get_retriever),
    emergency_detector: EmergencyDetector = Depends(get_emergency_detector),
    knowledge_policy: KnowledgePolicy = Depends(get_knowledge_policy),
) -> MessageResponse:
    return await _run_turn(
        session_id,
        "không",
        store,
        provider,
        bridge,
        prompts,
        settings,
        retriever,
        emergency_detector,
        knowledge_policy,
    )
