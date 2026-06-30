"""OllamaProvider — gọi Ollama native API qua httpx.

Dùng httpx trực tiếp (thay vì SDK) để: (1) ít dep, (2) test bằng
httpx.MockTransport không cần Ollama thật. KHÔNG có healer JSON — Ollama
tool-calling chuẩn; trả lạ thì throw ProviderError.
"""
from __future__ import annotations

import json
import time
from typing import Sequence

import httpx

from app.providers.base import AIProvider, ChatResponse, ProviderError, ToolCall


class OllamaProvider(AIProvider):
    def __init__(
        self,
        base_url: str,
        client: httpx.AsyncClient | None = None,
        timeout: float = 60.0,
    ) -> None:
        self._base = base_url.rstrip("/")
        self._client = client          # inject để test; None -> tạo per-call
        self._timeout = timeout

    async def _send(self, path: str, payload: dict) -> httpx.Response:
        if self._client is not None:
            return await self._client.post(self._base + path, json=payload, timeout=self._timeout)
        async with httpx.AsyncClient(timeout=self._timeout) as client:
            return await client.post(self._base + path, json=payload)

    async def _post_json(self, path: str, payload: dict) -> dict:
        last_err: Exception | None = None
        for attempt in range(2):  # 1 retry cho 5xx / lỗi mạng
            try:
                resp = await self._send(path, payload)
            except (httpx.TimeoutException, httpx.TransportError) as exc:
                last_err = exc
                continue
            if resp.status_code >= 500:
                last_err = ProviderError(f"Ollama {resp.status_code} at {path}")
                continue
            if resp.status_code >= 400:
                raise ProviderError(f"Ollama {resp.status_code} at {path}: {resp.text}")
            return resp.json()
        raise ProviderError(f"Ollama không phản hồi sau retry: {path}") from last_err

    async def chat(
        self,
        model: str,
        messages: list[dict],
        tools: list[dict] | None = None,
        temperature: float = 0.1,
        max_tokens: int = 1024,
    ) -> ChatResponse:
        payload: dict = {
            "model": model,
            "messages": messages,
            "stream": False,
            "options": {"temperature": temperature, "num_predict": max_tokens},
        }
        if tools:
            payload["tools"] = tools

        t0 = time.perf_counter()
        data = await self._post_json("/api/chat", payload)
        latency_ms = int((time.perf_counter() - t0) * 1000)

        msg = data.get("message") or {}
        tool_calls: list[ToolCall] = []
        for i, tc in enumerate(msg.get("tool_calls") or []):
            fn = tc.get("function") or {}
            args = fn.get("arguments")
            if isinstance(args, str):
                try:
                    args = json.loads(args)
                except json.JSONDecodeError as exc:
                    raise ProviderError(f"tool arguments không phải JSON: {args!r}") from exc
            tool_calls.append(
                ToolCall(id=tc.get("id") or f"call_{i}", name=fn.get("name", ""), arguments=args or {})
            )

        return ChatResponse(
            content=(msg.get("content") or None),
            tool_calls=tool_calls,
            raw_model=data.get("model", model),
            prompt_tokens=data.get("prompt_eval_count"),
            completion_tokens=data.get("eval_count"),
            latency_ms=latency_ms,
        )

    async def embed(self, model: str, texts: Sequence[str]) -> list[list[float]]:
        data = await self._post_json("/api/embed", {"model": model, "input": list(texts)})
        embeddings = data.get("embeddings")
        if not isinstance(embeddings, list):
            raise ProviderError("Ollama embed không trả 'embeddings'")
        return embeddings
