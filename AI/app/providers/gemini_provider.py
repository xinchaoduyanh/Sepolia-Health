"""GeminiProvider — gọi Google Gemini qua httpx, 2 chế độ:

1. AI Studio (mặc định): endpoint generativelanguage.googleapis.com, auth bằng
   API key (header x-goog-api-key). Bật bằng AI_GEMINI_API_KEY.
2. Vertex AI: endpoint {location}-aiplatform.googleapis.com, auth bằng Bearer
   token mint từ service account JSON (google-auth). Bật bằng AI_GEMINI_USE_VERTEX
   + AI_GEMINI_PROJECT + AI_GEMINI_LOCATION + AI_GOOGLE_CREDENTIALS. Dùng Vertex
   để tiêu credit Google Cloud (Developer Program) — AI Studio prepay là ví khác.

Cả 2 chế độ dùng CHUNG body generateContent nên phần convert messages/tools kiểu
OpenAI sang format Gemini là chung. Embedding/RAG vẫn local trên Ollama — KHÔNG
đụng tới. KHÔNG vá JSON: lỗi provider -> ProviderError.
"""
from __future__ import annotations

import asyncio
import json
import time
from typing import Sequence

import httpx

from app.providers.base import AIProvider, ChatResponse, ProviderError, ToolCall

# JSON-Schema keys mà Gemini functionDeclarations KHÔNG nuốt được -> strip.
_UNSUPPORTED_SCHEMA_KEYS = ("title", "default", "additionalProperties", "$schema")
_CLOUD_PLATFORM_SCOPE = "https://www.googleapis.com/auth/cloud-platform"


def _clean_schema(node):
    """Bỏ các key JSON-Schema Gemini không hỗ trợ (đệ quy)."""
    if isinstance(node, list):
        return [_clean_schema(x) for x in node]
    if not isinstance(node, dict):
        return node
    return {k: _clean_schema(v) for k, v in node.items() if k not in _UNSUPPORTED_SCHEMA_KEYS}


def _to_tools(tools: list[dict] | None) -> list[dict] | None:
    """OpenAI tool schemas -> Gemini [{functionDeclarations:[...]}]."""
    if not tools:
        return None
    decls: list[dict] = []
    for t in tools:
        fn = t.get("function", t)
        decl: dict = {"name": fn["name"], "description": fn.get("description", "")}
        params = _clean_schema(fn.get("parameters") or {})
        if params.get("properties"):  # bỏ parameters rỗng (Gemini báo lỗi)
            decl["parameters"] = params
        decls.append(decl)
    return [{"functionDeclarations": decls}] if decls else None


def _to_contents(messages: list[dict]) -> tuple[str | None, list[dict]]:
    """messages kiểu OpenAI -> (system_instruction, contents[]) kiểu Gemini."""
    id_to_name: dict[str, str] = {}
    for m in messages:
        if m.get("role") == "assistant":
            for tc in m.get("tool_calls") or []:
                id_to_name[tc["id"]] = tc["function"]["name"]

    system_text: str | None = None
    contents: list[dict] = []
    for m in messages:
        role = m.get("role")
        if role == "system":
            system_text = m.get("content") or ""
        elif role == "user":
            contents.append({"role": "user", "parts": [{"text": m.get("content") or ""}]})
        elif role == "assistant":
            parts: list[dict] = []
            if m.get("content"):
                parts.append({"text": m["content"]})
            for tc in m.get("tool_calls") or []:
                fn = tc["function"]
                args = fn.get("arguments")
                if isinstance(args, str):
                    try:
                        args = json.loads(args or "{}")
                    except json.JSONDecodeError:
                        args = {}
                parts.append({"functionCall": {"name": fn["name"], "args": args or {}}})
            contents.append({"role": "model", "parts": parts or [{"text": ""}]})
        elif role == "tool":
            content = m.get("content")
            try:
                response_obj = json.loads(content) if isinstance(content, str) else content
            except json.JSONDecodeError:
                response_obj = {"result": content}
            if not isinstance(response_obj, dict):
                response_obj = {"result": response_obj}
            contents.append({
                "role": "user",
                "parts": [{
                    "functionResponse": {
                        "name": id_to_name.get(m.get("tool_call_id"), ""),
                        "response": response_obj,
                    }
                }],
            })
    return system_text, contents


class _VertexAuth:
    """Mint + cache Bearer token từ service account JSON (hoặc ADC nếu path trống).

    google-auth tự cache token tới gần hạn (1h) rồi refresh. refresh() là sync
    (gọi mạng) nên bọc asyncio.to_thread để không chặn event loop.
    """

    def __init__(self, credentials_path: str | None) -> None:
        try:
            import google.auth
            from google.oauth2 import service_account
        except ImportError as exc:  # pragma: no cover
            raise ProviderError(
                "Vertex cần google-auth: pip install google-auth"
            ) from exc

        if credentials_path:
            self._creds = service_account.Credentials.from_service_account_file(
                credentials_path, scopes=[_CLOUD_PLATFORM_SCOPE]
            )
        else:
            self._creds, _ = google.auth.default(scopes=[_CLOUD_PLATFORM_SCOPE])

    def _token_sync(self) -> str:
        from google.auth.transport.requests import Request

        if not self._creds.valid:
            self._creds.refresh(Request())
        return self._creds.token

    async def token(self) -> str:
        return await asyncio.to_thread(self._token_sync)


class GeminiProvider(AIProvider):
    def __init__(
        self,
        api_key: str | None = None,
        base_url: str = "https://generativelanguage.googleapis.com",
        *,
        vertex: bool = False,
        project: str | None = None,
        location: str = "us-central1",
        credentials_path: str | None = None,
        client: httpx.AsyncClient | None = None,
        timeout: float = 60.0,
    ) -> None:
        self._vertex = vertex
        self._client = client  # inject để test; None -> tạo per-call
        self._timeout = timeout

        if vertex:
            if not project:
                raise ProviderError("Vertex cần AI_GEMINI_PROJECT")
            self._project = project
            self._location = location
            self._auth = _VertexAuth(credentials_path)
        else:
            if not api_key:
                raise ProviderError("GeminiProvider (AI Studio) cần AI_GEMINI_API_KEY")
            self._api_key = api_key
            self._base = base_url.rstrip("/")

    async def _resolve_request(self, model: str) -> tuple[str, dict]:
        """Trả (url, headers) theo chế độ."""
        if self._vertex:
            host = (
                "https://aiplatform.googleapis.com"
                if self._location == "global"
                else f"https://{self._location}-aiplatform.googleapis.com"
            )
            url = (
                f"{host}/v1/projects/{self._project}/locations/{self._location}"
                f"/publishers/google/models/{model}:generateContent"
            )
            token = await self._auth.token()
            return url, {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
        url = f"{self._base}/v1beta/models/{model}:generateContent"
        return url, {"x-goog-api-key": self._api_key, "Content-Type": "application/json"}

    async def _send(self, url: str, headers: dict, payload: dict) -> httpx.Response:
        if self._client is not None:
            return await self._client.post(url, json=payload, headers=headers, timeout=self._timeout)
        async with httpx.AsyncClient(timeout=self._timeout) as client:
            return await client.post(url, json=payload, headers=headers)

    async def _post_json(self, url: str, headers: dict, payload: dict) -> dict:
        last_err: Exception | None = None
        for _ in range(2):  # 1 retry cho 5xx / lỗi mạng
            try:
                resp = await self._send(url, headers, payload)
            except (httpx.TimeoutException, httpx.TransportError) as exc:
                last_err = exc
                continue
            if resp.status_code >= 500:
                last_err = ProviderError(f"Gemini {resp.status_code} at {url}")
                continue
            if resp.status_code >= 400:
                raise ProviderError(f"Gemini {resp.status_code}: {resp.text}")
            return resp.json()
        raise ProviderError(f"Gemini không phản hồi sau retry: {url}") from last_err

    async def chat(
        self,
        model: str,
        messages: list[dict],
        tools: list[dict] | None = None,
        temperature: float = 0.1,
        max_tokens: int = 1024,
    ) -> ChatResponse:
        system_text, contents = _to_contents(messages)
        payload: dict = {
            "contents": contents,
            "generationConfig": {"temperature": temperature, "maxOutputTokens": max_tokens},
        }
        if system_text:
            payload["systemInstruction"] = {"parts": [{"text": system_text}]}
        gemini_tools = _to_tools(tools)
        if gemini_tools:
            payload["tools"] = gemini_tools

        url, headers = await self._resolve_request(model)
        t0 = time.perf_counter()
        data = await self._post_json(url, headers, payload)
        latency_ms = int((time.perf_counter() - t0) * 1000)

        candidates = data.get("candidates") or []
        parts = (candidates[0].get("content") or {}).get("parts") or [] if candidates else []
        text_chunks: list[str] = []
        tool_calls: list[ToolCall] = []
        for i, part in enumerate(parts):
            if part.get("text"):
                text_chunks.append(part["text"])
            fc = part.get("functionCall")
            if fc:
                tool_calls.append(
                    ToolCall(id=f"call_{i}", name=fc.get("name", ""), arguments=fc.get("args") or {})
                )

        usage = data.get("usageMetadata") or {}
        return ChatResponse(
            content=("\n".join(text_chunks) or None),
            tool_calls=tool_calls,
            raw_model=data.get("modelVersion", model),
            prompt_tokens=usage.get("promptTokenCount"),
            completion_tokens=usage.get("candidatesTokenCount"),
            latency_ms=latency_ms,
        )

    async def embed(self, model: str, texts: Sequence[str]) -> list[list[float]]:
        # Embedding/RAG cố tình giữ local trên Ollama (KnowledgeRetriever tự dựng
        # OllamaProvider). Chat provider không bao giờ được gọi embed.
        raise NotImplementedError("GeminiProvider.embed không dùng — embedding chạy trên Ollama.")
