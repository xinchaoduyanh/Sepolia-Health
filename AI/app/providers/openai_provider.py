"""Slot dự phòng — chưa implement V1 (Ollama là provider chính)."""
from __future__ import annotations

from typing import Sequence

from app.providers.base import AIProvider, ChatResponse


class OpenAIProvider(AIProvider):
    async def chat(self, model, messages, tools=None, temperature=0.1, max_tokens=1024) -> ChatResponse:
        raise NotImplementedError("OpenAIProvider chưa implement (reserved slot).")

    async def embed(self, model: str, texts: Sequence[str]) -> list[list[float]]:
        raise NotImplementedError("OpenAIProvider chưa implement (reserved slot).")
