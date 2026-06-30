"""Interface provider LLM. Ollama là default; OpenAI/Gemini để slot sau."""
from __future__ import annotations

from abc import ABC, abstractmethod
from typing import Sequence

from pydantic import BaseModel


class ToolCall(BaseModel):
    id: str
    name: str
    arguments: dict


class ChatResponse(BaseModel):
    content: str | None = None
    tool_calls: list[ToolCall] = []
    raw_model: str
    prompt_tokens: int | None = None
    completion_tokens: int | None = None
    latency_ms: int


class ProviderError(RuntimeError):
    """Provider trả lỗi / không reachable. KHÔNG vá JSON (bỏ AI Healer cũ)."""


class AIProvider(ABC):
    @abstractmethod
    async def chat(
        self,
        model: str,
        messages: list[dict],
        tools: list[dict] | None = None,
        temperature: float = 0.1,
        max_tokens: int = 1024,
    ) -> ChatResponse: ...

    @abstractmethod
    async def embed(self, model: str, texts: Sequence[str]) -> list[list[float]]: ...
