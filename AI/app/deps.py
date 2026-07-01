"""Dependency injection cho FastAPI."""
from __future__ import annotations

from functools import lru_cache

from fastapi import Depends, Header, HTTPException

from app.agents.scheduling_agent import SchedulingAgent
from app.config import Settings, get_settings
from app.prompts.loader import PromptRegistry
from app.providers.base import AIProvider
from app.rag.emergency import EmergencyDetector
from app.rag.policy import KnowledgePolicy
from app.rag.retriever import KnowledgeRetriever
from app.providers.gemini_provider import GeminiProvider
from app.providers.ollama_provider import OllamaProvider
from app.routing.model_router import ModelRouter
from app.session.store import SessionStore
from app.session.postgres_store import PostgresSessionStore
from app.tools.be_bridge import BridgeClient, HttpBridgeClient
from app.tools.registry import ToolRegistry


@lru_cache
def get_store() -> SessionStore:
    return PostgresSessionStore(get_settings().database_url)


@lru_cache
def get_provider() -> AIProvider:
    # Vertex (tiêu credit Cloud) > AI Studio key > Ollama local. Embedding/RAG luôn
    # chạy Ollama (KnowledgeRetriever tự dựng provider riêng).
    s = get_settings()
    if s.gemini_use_vertex:
        return GeminiProvider(
            vertex=True,
            project=s.gemini_project,
            location=s.gemini_location,
            credentials_path=s.google_credentials or None,
        )
    if s.gemini_api_key:
        return GeminiProvider(api_key=s.gemini_api_key, base_url=s.gemini_base_url)
    return OllamaProvider(s.ollama_base_url)


@lru_cache
def get_bridge() -> BridgeClient:
    s = get_settings()
    return HttpBridgeClient(s.be_bridge_base_url, s.internal_shared_secret)


@lru_cache
def get_registry() -> PromptRegistry:
    reg = PromptRegistry(get_settings().prompts_dir)
    try:
        reg.load_all()
    except FileNotFoundError:
        pass  # prompts/ có thể chưa tồn tại lúc skeleton
    return reg


@lru_cache
def get_emergency_detector() -> EmergencyDetector:
    return EmergencyDetector(get_settings().knowledge_dir)


@lru_cache
def get_retriever() -> KnowledgeRetriever:
    s = get_settings()
    return KnowledgeRetriever(
        knowledge_dir=s.knowledge_dir,
        chroma_dir=s.chroma_dir,
        ollama_base_url=s.ollama_base_url,
        embedding_model=s.embedding_model,
    )


@lru_cache
def get_knowledge_policy() -> KnowledgePolicy:
    return KnowledgePolicy(get_settings().knowledge_dir)


def build_agent_for_user(
    user_id: int,
    provider: AIProvider,
    bridge: BridgeClient,
    prompts: PromptRegistry,
    settings: Settings,
    retriever: KnowledgeRetriever | None = None,
    emergency_detector: EmergencyDetector | None = None,
    knowledge_policy: KnowledgePolicy | None = None,
) -> SchedulingAgent:
    scoped_bridge = bridge
    if isinstance(bridge, HttpBridgeClient):
        scoped_bridge = bridge.with_acting_user(user_id)
    model = ModelRouter(settings).select("response")
    return SchedulingAgent(
        provider,
        model,
        ToolRegistry(scoped_bridge, retriever=retriever),
        prompts,
        retriever=retriever,
        emergency_detector=emergency_detector,
        knowledge_policy=knowledge_policy,
    )


def require_internal_token(
    x_internal_token: str | None = Header(default=None),
    settings: Settings = Depends(get_settings),
) -> None:
    if x_internal_token != settings.internal_shared_secret:
        raise HTTPException(status_code=401, detail="invalid or missing X-Internal-Token")
