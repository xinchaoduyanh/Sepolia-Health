"""Embedding providers cho RAG: Vertex AI / Gemini API (cloud) hoặc Ollama (tuỳ chọn).

Chọn bằng AI_EMBEDDING_PROVIDER = auto | vertex | gemini | ollama. `auto` đi theo
chat provider: Vertex nếu AI_GEMINI_USE_VERTEX, Gemini API nếu có key, ngược lại
Ollama — nên deploy chỉ-cloud không cần chạy Ollama. Vector của model khác nhau
KHÔNG tương thích: provider/model/dimension được ghi vào index manifest và
readiness coi lệch là stale (phải rebuild).
"""
from __future__ import annotations

import asyncio
from dataclasses import dataclass
from typing import Protocol, Sequence

import httpx

from app.config import Settings, get_settings
from app.providers.base import ProviderError
from app.providers.ollama_provider import OllamaProvider

_DEFAULT_BATCH = 8  # predict giới hạn ~20k token/request; chunk ≤2200 ký tự


DEFAULT_CLOUD_MODEL = {"vertex": "text-multilingual-embedding-002", "gemini": "gemini-embedding-001"}
# Ngưỡng similarity đã đo trên golden set (eval/reports/retrieval-baseline.md). Với
# text-multilingual-embedding-002 query ngoài phạm vi vẫn đạt ~0.59-0.68 nên 0.45 không lọc
# được gì; 0.60 cắt bớt nhiễu mà không mất recall. Model khác chưa đo -> dùng 0.45 cũ.
DEFAULT_MIN_SCORE = {("vertex", "text-multilingual-embedding-002"): 0.60}
FALLBACK_MIN_SCORE = 0.45


class Embedder(Protocol):
    provider: str
    model: str

    async def embed_documents(self, texts: Sequence[str]) -> list[list[float]]: ...

    async def embed_query(self, text: str) -> list[float]: ...


@dataclass(frozen=True)
class EmbeddingSpec:
    provider: str  # vertex | gemini | ollama
    model: str
    dimension: int  # 0 = mặc định của model

    @property
    def label(self) -> str:
        return f"{self.provider}:{self.model}"


def resolve_embedding_spec(settings: Settings | None = None) -> EmbeddingSpec:
    s = settings or get_settings()
    provider = (s.embedding_provider or "auto").lower()
    if provider == "auto":
        if s.gemini_use_vertex:
            provider = "vertex"
        elif s.gemini_api_key:
            provider = "gemini"
        else:
            provider = "ollama"
    if provider not in {"vertex", "gemini", "ollama"}:
        raise ValueError(f"AI_EMBEDDING_PROVIDER không hợp lệ: {s.embedding_provider!r}")
    if provider == "ollama":
        model = s.embedding_model
    else:
        model = s.cloud_embedding_model or DEFAULT_CLOUD_MODEL[provider]
    return EmbeddingSpec(provider=provider, model=model, dimension=s.embedding_dimension)


def resolve_min_score(settings: Settings | None = None) -> float:
    s = settings or get_settings()
    if s.rag_min_score >= 0:
        return s.rag_min_score
    spec = resolve_embedding_spec(s)
    return DEFAULT_MIN_SCORE.get((spec.provider, spec.model), FALLBACK_MIN_SCORE)


class OllamaEmbedder:
    provider = "ollama"

    def __init__(self, base_url: str, model: str, client: httpx.AsyncClient | None = None) -> None:
        self.model = model
        self._provider = OllamaProvider(base_url, client=client)

    async def embed_documents(self, texts: Sequence[str]) -> list[list[float]]:
        if not texts:
            return []
        return await self._provider.embed(self.model, list(texts))

    async def embed_query(self, text: str) -> list[float]:
        return (await self._provider.embed(self.model, [text]))[0]


class _CloudEmbedder:
    """Khung chung: batch + retry (429/5xx/lỗi mạng) cho endpoint cloud."""

    provider = "cloud"

    def __init__(
        self,
        model: str,
        dimension: int = 0,
        client: httpx.AsyncClient | None = None,
        timeout: float = 60.0,
        batch_size: int = _DEFAULT_BATCH,
        retry_delay: float = 1.0,
    ) -> None:
        self.model = model
        self._dimension = dimension
        self._client = client
        self._timeout = timeout
        self._batch = max(1, batch_size)
        self._retry_delay = retry_delay

    async def _request(self, texts: list[str], task: str) -> list[list[float]]:
        raise NotImplementedError

    async def _post(self, url: str, headers: dict, payload: dict) -> dict:
        last: Exception | None = None
        for attempt in range(3):
            try:
                if self._client is not None:
                    resp = await self._client.post(url, json=payload, headers=headers, timeout=self._timeout)
                else:
                    async with httpx.AsyncClient(timeout=self._timeout) as client:
                        resp = await client.post(url, json=payload, headers=headers)
            except (httpx.TimeoutException, httpx.TransportError) as exc:
                last = exc
            else:
                if resp.status_code == 429 or resp.status_code >= 500:
                    last = ProviderError(f"{self.provider} embed {resp.status_code}")
                elif resp.status_code >= 400:
                    raise ProviderError(f"{self.provider} embed {resp.status_code}: {resp.text[:300]}")
                else:
                    return resp.json()
            await asyncio.sleep(self._retry_delay * (2**attempt))
        raise ProviderError(f"{self.provider} embed không phản hồi sau retry") from last

    async def embed_documents(self, texts: Sequence[str]) -> list[list[float]]:
        out: list[list[float]] = []
        items = list(texts)
        for i in range(0, len(items), self._batch):
            out.extend(await self._request(items[i : i + self._batch], "RETRIEVAL_DOCUMENT"))
        return out

    async def embed_query(self, text: str) -> list[float]:
        return (await self._request([text], "RETRIEVAL_QUERY"))[0]


class VertexEmbedder(_CloudEmbedder):
    """Vertex AI `:predict` (text-multilingual-embedding-002, text-embedding-005, ...)."""

    provider = "vertex"

    def __init__(
        self,
        project: str,
        location: str,
        model: str,
        credentials_path: str | None = None,
        auth=None,
        **kwargs,
    ) -> None:
        super().__init__(model, **kwargs)
        if not project:
            raise ProviderError("Vertex embedding cần AI_GEMINI_PROJECT")
        self._project = project
        self._location = location
        if auth is None:
            from app.providers.gemini_provider import _VertexAuth

            auth = _VertexAuth(credentials_path)
        self._auth = auth

    def _url(self) -> str:
        host = (
            "https://aiplatform.googleapis.com"
            if self._location == "global"
            else f"https://{self._location}-aiplatform.googleapis.com"
        )
        return (
            f"{host}/v1/projects/{self._project}/locations/{self._location}"
            f"/publishers/google/models/{self.model}:predict"
        )

    async def _request(self, texts: list[str], task: str) -> list[list[float]]:
        payload: dict = {"instances": [{"content": t, "task_type": task} for t in texts]}
        if self._dimension:
            payload["parameters"] = {"outputDimensionality": self._dimension}
        headers = {"Authorization": f"Bearer {await self._auth.token()}", "Content-Type": "application/json"}
        data = await self._post(self._url(), headers, payload)
        preds = data.get("predictions")
        try:
            vectors = [p["embeddings"]["values"] for p in preds]
        except (TypeError, KeyError) as exc:
            raise ProviderError("Vertex embed không trả predictions[].embeddings.values") from exc
        if len(vectors) != len(texts):
            raise ProviderError(f"Vertex embed trả {len(vectors)} vector cho {len(texts)} input")
        return vectors


class GeminiApiEmbedder(_CloudEmbedder):
    """Gemini API (AI Studio) `:batchEmbedContents`."""

    provider = "gemini"

    def __init__(self, api_key: str, model: str, base_url: str = "https://generativelanguage.googleapis.com", **kwargs) -> None:
        super().__init__(model, **kwargs)
        if not api_key:
            raise ProviderError("Gemini embedding cần AI_GEMINI_API_KEY")
        self._api_key = api_key
        self._base = base_url.rstrip("/")

    async def _request(self, texts: list[str], task: str) -> list[list[float]]:
        requests = []
        for t in texts:
            req: dict = {
                "model": f"models/{self.model}",
                "content": {"parts": [{"text": t}]},
                "taskType": task,
            }
            if self._dimension:
                req["outputDimensionality"] = self._dimension
            requests.append(req)
        url = f"{self._base}/v1beta/models/{self.model}:batchEmbedContents"
        headers = {"x-goog-api-key": self._api_key, "Content-Type": "application/json"}
        data = await self._post(url, headers, {"requests": requests})
        try:
            vectors = [e["values"] for e in data["embeddings"]]
        except (TypeError, KeyError) as exc:
            raise ProviderError("Gemini embed không trả embeddings[].values") from exc
        if len(vectors) != len(texts):
            raise ProviderError(f"Gemini embed trả {len(vectors)} vector cho {len(texts)} input")
        return vectors


def build_embedder(settings: Settings | None = None, spec: EmbeddingSpec | None = None) -> Embedder:
    s = settings or get_settings()
    spec = spec or resolve_embedding_spec(s)
    if spec.provider == "vertex":
        return VertexEmbedder(
            project=s.gemini_project,
            location=s.gemini_location,
            model=spec.model,
            credentials_path=s.google_credentials or None,
            dimension=spec.dimension,
        )
    if spec.provider == "gemini":
        return GeminiApiEmbedder(
            api_key=s.gemini_api_key,
            model=spec.model,
            base_url=s.gemini_base_url,
            dimension=spec.dimension,
        )
    return OllamaEmbedder(s.ollama_base_url, spec.model)
