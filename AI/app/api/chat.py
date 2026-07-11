"""Chat endpoints (skeleton). Business logic agent ở Phase 06 — V1 là stub.

Auth qua require_internal_token (gắn ở router cha trong main.py).
"""
from __future__ import annotations

import asyncio
import json
import logging
import time
import uuid
from datetime import datetime, timedelta, timezone
from typing import Callable, Awaitable

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse

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
from app.observability.tracing import log_event, new_trace_id
from app.prompts.loader import PromptRegistry
from app.providers.base import AIProvider
from app.rag.emergency import EmergencyDetector
from app.rag.policy import KnowledgePolicy
from app.rag.retriever import KnowledgeRetriever
from app.routing.model_router import ModelRouter
from app.session.models import SessionState
from app.session.store import SessionStore, SessionConflictError
from app.tools.be_bridge import BridgeClient

_LOG = logging.getLogger(__name__)

router = APIRouter(prefix="/chat", tags=["chat"])


def _session_fresh(state: SessionState, max_age_minutes: int) -> bool:
    last = state.last_updated
    if last.tzinfo is None:  # snapshot cũ lưu naive datetime
        last = last.replace(tzinfo=timezone.utc)
    return datetime.now(timezone.utc) - last <= timedelta(minutes=max_age_minutes)


@router.post("/sessions", response_model=CreateSessionResponse)
async def create_session(
    req: CreateSessionRequest,
    store: SessionStore = Depends(get_store),
    settings: Settings = Depends(get_settings),
) -> CreateSessionResponse:
    if req.channel_id:
        existing = await store.get_open_by_channel(req.channel_id)
        # Defense-in-depth: chỉ reconnect nếu session thuộc đúng user. Channel đã là
        # ai-consult-{userId} nhưng vẫn chốt để không nối nhầm session của user khác.
        # Và chỉ reconnect session còn TƯƠI: state/requirement từ nhiều ngày trước
        # (bác sĩ X, giờ Y đã qua) chỉ gây kẹt luồng mới — quá hạn thì mở session mới.
        if (
            existing
            and existing.user_id == req.user_id
            and _session_fresh(existing, settings.session_reconnect_max_age_minutes)
        ):
            log_event("session_reconnected", session_id=existing.session_id, user_id=req.user_id)
            return CreateSessionResponse(session_id=existing.session_id)

    session_id = "sess_" + uuid.uuid4().hex[:16]
    state = SessionState(session_id=session_id, user_id=req.user_id, channel_id=req.channel_id)
    await store.create(state)
    log_event("session_created", session_id=session_id, user_id=req.user_id)
    return CreateSessionResponse(session_id=session_id)


@router.get("/sessions/{session_id}", response_model=SessionState)
async def get_session(session_id: str, store: SessionStore = Depends(get_store)) -> SessionState:
    state = await store.get(session_id)
    if state is None:
        raise HTTPException(status_code=404, detail="session not found")
    return state


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
    state = await store.get(session_id)
    if state is None:
        raise HTTPException(status_code=404, detail="session not found")
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
    # Conversation memory: nhồi N lượt gần nhất (đã lưu ở AiTurn) làm context.
    # Lấy TRƯỚC record_turn của lượt này nên không bị trùng câu hiện tại.
    history = await store.list_recent_turns(session_id, settings.ai_history_max_turns)

    trace_id = new_trace_id()
    started = time.perf_counter()
    resp = None
    try:
        resp = await agent.handle_turn(state, message, trace_id, history=history, stream_callback=stream_callback)
    finally:
        latency_ms = int((time.perf_counter() - started) * 1000)
        try:
            await store.update(state)
        except SessionConflictError:
            if resp is None:
                pass  # Do not mask original exception from handle_turn
            else:
                raise HTTPException(status_code=409, detail="session busy, retry")
        
        log_event("turn", session_id=session_id, trace_id=trace_id, state=state.agent_state.value)

        if resp is not None:
            try:
                await store.record_turn(
                    session_id=session_id,
                    trace_id=trace_id,
                    user_message=message,
                    ai_message=resp.message,
                    tool_results=[s.model_dump() for s in resp.tool_results_summary],
                    model=ModelRouter(settings).select("response"),
                    latency_ms=latency_ms,
                )
            except Exception:
                _LOG.exception("record_turn failed for session %s trace %s", session_id, trace_id)

    return resp


@router.post("/sessions/{session_id}/messages", response_model=MessageResponse)
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
        session_id, req.message, store, provider, bridge, prompts, settings, retriever, emergency_detector, knowledge_policy
    )


@router.post("/sessions/{session_id}/messages/stream")
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
    queue = asyncio.Queue()

    async def stream_callback(chunk: str):
        await queue.put({"type": "chunk", "text": chunk})

    async def run_task():
        try:
            resp = await _run_turn(
                session_id, req.message, store, provider, bridge, prompts, settings, retriever, emergency_detector, knowledge_policy, stream_callback=stream_callback
            )
            await queue.put({"type": "final", "response": resp.model_dump(mode="json")})
        except Exception as e:
            _LOG.exception("Error in stream task")
            await queue.put({"type": "error", "message": "Có lỗi xảy ra, anh/chị thử lại giúp em nhé."})
        finally:
            await queue.put(None)  # EOF

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


@router.post("/sessions/{session_id}/confirm", response_model=MessageResponse)
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
    # FE bấm "Xác nhận" -> coi như user đồng ý (agent xử ở state awaiting_confirmation).
    return await _run_turn(
        session_id, "vâng", store, provider, bridge, prompts, settings, retriever, emergency_detector, knowledge_policy
    )


@router.post("/sessions/{session_id}/cancel", response_model=MessageResponse)
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
        session_id, "không", store, provider, bridge, prompts, settings, retriever, emergency_detector, knowledge_policy
    )
