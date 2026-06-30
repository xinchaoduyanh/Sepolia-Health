"""Contract test OllamaProvider bằng httpx.MockTransport — KHÔNG cần Ollama thật."""
import json

import httpx
import pytest

from app.providers.base import ProviderError
from app.providers.ollama_provider import OllamaProvider


async def test_chat_parse_tool_calls():
    def handler(request: httpx.Request) -> httpx.Response:
        assert request.url.path == "/api/chat"
        body = json.loads(request.content)
        assert body["model"] == "qwen"
        assert body["stream"] is False
        assert body["tools"]  # tools được truyền qua
        return httpx.Response(200, json={
            "model": "qwen",
            "message": {"content": "", "tool_calls": [
                {"function": {"name": "search_clinics", "arguments": {"q": "da lieu"}}}
            ]},
            "prompt_eval_count": 10, "eval_count": 5,
        })

    client = httpx.AsyncClient(transport=httpx.MockTransport(handler))
    provider = OllamaProvider("http://x", client=client)
    resp = await provider.chat(
        "qwen", [{"role": "user", "content": "hi"}],
        tools=[{"type": "function", "function": {"name": "search_clinics"}}],
    )
    await client.aclose()

    assert resp.content is None
    assert len(resp.tool_calls) == 1
    assert resp.tool_calls[0].name == "search_clinics"
    assert resp.tool_calls[0].arguments == {"q": "da lieu"}
    assert resp.raw_model == "qwen"
    assert resp.prompt_tokens == 10 and resp.completion_tokens == 5


async def test_chat_arguments_as_json_string():
    def handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(200, json={
            "model": "qwen",
            "message": {"tool_calls": [{"function": {"name": "f", "arguments": "{\"a\": 1}"}}]},
        })

    client = httpx.AsyncClient(transport=httpx.MockTransport(handler))
    resp = await OllamaProvider("http://x", client=client).chat("qwen", [])
    await client.aclose()
    assert resp.tool_calls[0].arguments == {"a": 1}


async def test_embed_dimension():
    def handler(request: httpx.Request) -> httpx.Response:
        assert request.url.path == "/api/embed"
        return httpx.Response(200, json={"embeddings": [[0.0] * 1024]})

    client = httpx.AsyncClient(transport=httpx.MockTransport(handler))
    vecs = await OllamaProvider("http://x", client=client).embed("bge-m3", ["cảm cúm"])
    await client.aclose()
    assert len(vecs) == 1 and len(vecs[0]) == 1024


async def test_retry_then_success():
    calls = {"n": 0}

    def handler(request: httpx.Request) -> httpx.Response:
        calls["n"] += 1
        if calls["n"] == 1:
            return httpx.Response(503)
        return httpx.Response(200, json={"model": "qwen", "message": {"content": "ok"}})

    client = httpx.AsyncClient(transport=httpx.MockTransport(handler))
    resp = await OllamaProvider("http://x", client=client).chat("qwen", [])
    await client.aclose()
    assert calls["n"] == 2 and resp.content == "ok"


async def test_5xx_after_retry_raises():
    def handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(500)

    client = httpx.AsyncClient(transport=httpx.MockTransport(handler))
    with pytest.raises(ProviderError):
        await OllamaProvider("http://x", client=client).chat("qwen", [])
    await client.aclose()
