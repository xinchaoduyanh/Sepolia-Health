"""Chọn model theo workload. V1: tất cả dùng cùng 1 model (Qwen 3B).

Khi AI_GEMINI_API_KEY được set, mọi workload route sang gemini_model (cloud).
Sau này có thể route 3B cho 'decision', 7B cho 'response'.
"""
from __future__ import annotations

from typing import Literal

from app.config import Settings

Workload = Literal["decision", "response", "summarization"]


class ModelRouter:
    def __init__(self, settings: Settings) -> None:
        if settings.gemini_enabled:
            m = settings.gemini_model
            self._map: dict[str, str] = {"decision": m, "response": m, "summarization": m}
        else:
            self._map = {
                "decision": settings.default_model_decision,
                "response": settings.default_model_response,
                "summarization": settings.default_model_summarization,
            }

    def select(self, workload: Workload) -> str:
        return self._map[workload]
