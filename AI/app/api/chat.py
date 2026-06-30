"""Chat endpoints (skeleton). Business logic agent ở Phase 06 — V1 là stub.

Auth qua require_internal_token (gắn ở router cha trong main.py).
"""
from __future__ import annotations

import logging
import time
import uuid

from fastapi import APIRouter, Depends, HTTPException

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
from app.session.store import SessionStore
from app.tools.be_bridge import BridgeClient

_LOG = logging.getLogger(__name__)

router = APIRouter(prefix="/chat", tags=["chat"])


@router.post("/sessions", response_model=CreateSessionResponse)
async def create_session(
    req: CreateSessionRequest,
    store: SessionStore = Depends(get_store),
) -> CreateSessionResponse:
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
    resp = await agent.handle_turn(state, message, trace_id, history=history)
    latency_ms = int((time.perf_counter() - started) * 1000)
    await store.update(state)
    log_event("turn", session_id=session_id, trace_id=trace_id, state=state.agent_state.value)

    # Observability: ghi AiTurn. Lỗi ghi không được làm hỏng lượt chat.
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
    except Exception:  # noqa: BLE001 - observability không được chặn happy path
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
