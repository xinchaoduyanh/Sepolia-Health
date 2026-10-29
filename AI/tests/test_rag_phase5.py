"""Phase 5: embedding providers, governance, versioned index + ensure_index."""
import datetime as dt
import json
from pathlib import Path

import httpx
import pytest

from app.config import Settings
from app.providers.base import ProviderError
from app.rag import governance
from app.rag.embedding import (
    GeminiApiEmbedder,
    OllamaEmbedder,
    VertexEmbedder,
    build_embedder,
    resolve_embedding_spec,
)
from app.rag.indexer import check_index, ensure_index, load_index_manifest


@pytest.fixture(autouse=True)
def _hermetic_env(monkeypatch):
    # Settings đọc env AI_*; test không được phụ thuộc cấu hình Vertex/Ollama của máy chạy.
    import os

    for key in [k for k in os.environ if k.startswith("AI_") and k != "AI_AGENT"]:
        monkeypatch.delenv(key)


# ---- embedding spec -------------------------------------------------------
def _settings(tmp_path: Path, **kw) -> Settings:
    base = dict(
        _env_file=None,
        knowledge_dir=str(tmp_path / "k"),
        chroma_dir=str(tmp_path / "chroma"),
        internal_shared_secret="x" * 40,
    )
    base.update(kw)
    return Settings(**base)


def test_spec_auto_follows_chat_provider(tmp_path):
    assert resolve_embedding_spec(_settings(tmp_path)).provider == "ollama"
    assert resolve_embedding_spec(_settings(tmp_path, gemini_api_key="k")).provider == "gemini"
    spec = resolve_embedding_spec(_settings(tmp_path, gemini_use_vertex=True, gemini_api_key="k"))
    assert spec.provider == "vertex" and spec.model == "text-multilingual-embedding-002"


def test_spec_explicit_ollama_uses_ollama_model(tmp_path):
    spec = resolve_embedding_spec(_settings(tmp_path, gemini_use_vertex=True, embedding_provider="ollama"))
    assert spec.label == "ollama:bge-m3"
    with pytest.raises(ValueError):
        resolve_embedding_spec(_settings(tmp_path, embedding_provider="nope"))


def test_build_embedder_types(tmp_path):
    assert isinstance(build_embedder(_settings(tmp_path)), OllamaEmbedder)
    assert isinstance(build_embedder(_settings(tmp_path, gemini_api_key="k")), GeminiApiEmbedder)


# ---- cloud embedders (MockTransport) ---------------------------------------
class _Auth:
    async def token(self):
        return "tok"


@pytest.mark.asyncio
async def test_vertex_embedder_batches_and_sets_task_type():
    calls = []

    def handler(req: httpx.Request) -> httpx.Response:
        body = json.loads(req.content)
        calls.append(body)
        assert req.headers["authorization"] == "Bearer tok"
        assert ":predict" in req.url.path
        return httpx.Response(
            200, json={"predictions": [{"embeddings": {"values": [1.0, 0.0]}} for _ in body["instances"]]}
        )

    client = httpx.AsyncClient(transport=httpx.MockTransport(handler))
    emb = VertexEmbedder("proj", "asia-southeast1", "m", auth=_Auth(), client=client, batch_size=2, dimension=2)
    vecs = await emb.embed_documents(["a", "b", "c"])
    assert len(vecs) == 3 and len(calls) == 2
    assert calls[0]["instances"][0]["task_type"] == "RETRIEVAL_DOCUMENT"
    assert calls[0]["parameters"] == {"outputDimensionality": 2}
    await emb.embed_query("q")
    assert calls[-1]["instances"][0]["task_type"] == "RETRIEVAL_QUERY"


@pytest.mark.asyncio
async def test_vertex_embedder_retries_429_then_succeeds_and_fails_on_400():
    state = {"n": 0}

    def handler(req: httpx.Request) -> httpx.Response:
        state["n"] += 1
        if state["n"] == 1:
            return httpx.Response(429, text="quota")
        return httpx.Response(200, json={"predictions": [{"embeddings": {"values": [0.5]}}]})

    client = httpx.AsyncClient(transport=httpx.MockTransport(handler))
    emb = VertexEmbedder("p", "global", "m", auth=_Auth(), client=client, retry_delay=0)
    assert await emb.embed_query("x") == [0.5]

    bad = httpx.AsyncClient(transport=httpx.MockTransport(lambda r: httpx.Response(400, text="bad")))
    with pytest.raises(ProviderError):
        await VertexEmbedder("p", "global", "m", auth=_Auth(), client=bad, retry_delay=0).embed_query("x")


@pytest.mark.asyncio
async def test_gemini_api_embedder_parses_batch():
    def handler(req: httpx.Request) -> httpx.Response:
        body = json.loads(req.content)
        assert req.headers["x-goog-api-key"] == "k"
        return httpx.Response(200, json={"embeddings": [{"values": [0.1, 0.2]} for _ in body["requests"]]})

    client = httpx.AsyncClient(transport=httpx.MockTransport(handler))
    emb = GeminiApiEmbedder("k", "m", client=client)
    assert await emb.embed_documents(["a", "b"]) == [[0.1, 0.2], [0.1, 0.2]]


# ---- governance ---------------------------------------------------------------
def test_governance_unreviewed_by_default_and_indexability():
    meta = {"id": "a", "type": "disease", "canonical_name": "A", "version": 1}
    rep = governance.check_doc(meta, "a.md")
    assert rep.review_status == "unreviewed" and not rep.errors
    assert governance.is_indexable(meta, require_reviewed=False)
    assert not governance.is_indexable(meta, require_reviewed=True)
    assert not governance.is_indexable({**meta, "review_status": "deprecated"}, False)


def test_governance_reviewed_requires_reviewer_date_sources():
    meta = {"id": "a", "type": "symptom", "canonical_name": "A", "version": 1, "review_status": "reviewed"}
    errs = " ".join(governance.check_doc(meta, "a.md").errors)
    assert "reviewed_by" in errs and "reviewed_at" in errs and "sources" in errs
    ok = {
        **meta,
        "reviewed_by": "bs-noi-khoa",
        "reviewed_at": dt.date(2026, 1, 2),
        "sources": [{"title": "MOH guideline", "url": "https://example.org", "accessed_at": "2026-01-01"}],
        "owner": "clinical",
        "next_review_at": "2099-01-01",
    }
    rep = governance.check_doc(ok, "a.md")
    assert not rep.errors and not rep.warnings
    assert governance.is_indexable(ok, require_reviewed=True)
    assert json.loads(governance.sources_summary(ok)) == [{"title": "MOH guideline", "url": "https://example.org"}]
    future = governance.check_doc({**ok, "reviewed_at": "2099-01-01"}, "a.md")
    assert any("tương lai" in e for e in future.errors)


def test_current_knowledge_passes_schema_validation():
    from scripts.validate_knowledge import validate

    knowledge = Path(__file__).resolve().parents[1] / "knowledge"
    reports, problems = validate(knowledge)
    assert reports and not problems


# ---- index build / manifest / readiness -----------------------------------------
class FakeEmbedder:
    provider = "ollama"
    model = "fake"

    def __init__(self):
        self.doc_calls = 0

    async def embed_documents(self, texts):
        self.doc_calls += 1
        return [[float(len(t) % 7 + 1), 1.0, 0.5] for t in texts]

    async def embed_query(self, text):
        return [1.0, 1.0, 0.5]


def _write_knowledge(root: Path, body="Nội dung A", status=None):
    f = root / "k" / "faq" / "a.md"
    f.parent.mkdir(parents=True, exist_ok=True)
    extra = f"review_status: {status}\n" if status else ""
    f.write_text(
        f"---\nid: a\ntype: faq\ncanonical_name: A\nversion: 1\n{extra}---\n# A\n\n## Mục\n{body}\n",
        encoding="utf-8",
    )


@pytest.mark.asyncio
async def test_ensure_index_builds_then_skips_then_rebuilds_on_change(tmp_path):
    s = _settings(tmp_path, embedding_provider="ollama", embedding_model="fake")
    _write_knowledge(tmp_path)
    emb = FakeEmbedder()
    assert check_index(s).reason == "missing_manifest"

    built = await ensure_index(s, embedder=emb)
    assert built["action"] == "built" and built["chunks"] >= 1
    manifest = load_index_manifest(s.chroma_dir)
    assert manifest["embedding_dimension"] == 3 and manifest["collection"].startswith("knowledge_v1_")
    assert check_index(s).ok

    again = await ensure_index(s, embedder=emb)
    assert again["action"] == "skipped" and emb.doc_calls == 1

    _write_knowledge(tmp_path, body="Đã sửa nội dung")
    assert check_index(s).reason == "stale_knowledge"
    old_collection = manifest["collection"]
    rebuilt = await ensure_index(s, embedder=emb)
    assert rebuilt["action"] == "built" and rebuilt["collection"] != old_collection
    assert check_index(s).ok
    import chromadb

    names = [getattr(c, "name", c) for c in chromadb.PersistentClient(path=s.chroma_dir).list_collections()]
    assert names == [rebuilt["collection"]]  # bản cũ đã được dọn sau khi swap


@pytest.mark.asyncio
async def test_index_stale_when_embedding_or_policy_changes(tmp_path):
    s = _settings(tmp_path, embedding_provider="ollama", embedding_model="fake")
    _write_knowledge(tmp_path)
    await ensure_index(s, embedder=FakeEmbedder())
    assert check_index(s).ok
    assert check_index(s.model_copy(update={"embedding_model": "other"})).reason == "stale_embedding"
    vertex = s.model_copy(update={"gemini_use_vertex": True, "embedding_provider": "vertex"})
    assert check_index(vertex).reason == "stale_embedding"
    assert check_index(s.model_copy(update={"rag_require_reviewed": True})).reason == "stale_policy"


@pytest.mark.asyncio
async def test_require_reviewed_skips_unreviewed_docs(tmp_path):
    s = _settings(tmp_path, embedding_provider="ollama", embedding_model="fake", rag_require_reviewed=True)
    _write_knowledge(tmp_path)
    with pytest.raises(RuntimeError):  # không còn gì để index
        await ensure_index(s, embedder=FakeEmbedder())
    _write_knowledge(tmp_path, status="reviewed")
    out = await ensure_index(s, embedder=FakeEmbedder())
    assert out["files"] == 1 and out["skipped_docs"] == 0


@pytest.mark.asyncio
async def test_failed_build_keeps_previous_index(tmp_path):
    s = _settings(tmp_path, embedding_provider="ollama", embedding_model="fake")
    _write_knowledge(tmp_path)
    await ensure_index(s, embedder=FakeEmbedder())
    before = load_index_manifest(s.chroma_dir)

    class Broken(FakeEmbedder):
        async def embed_documents(self, texts):
            raise RuntimeError("quota")

    _write_knowledge(tmp_path, body="khác")
    with pytest.raises(RuntimeError):
        await ensure_index(s, embedder=Broken())
    assert load_index_manifest(s.chroma_dir) == before  # manifest cũ nguyên vẹn
    assert not (Path(s.chroma_dir) / ".index.lock").exists()


@pytest.mark.asyncio
async def test_retriever_uses_manifest_collection(tmp_path):
    from app.rag.retriever import KnowledgeRetriever

    s = _settings(tmp_path, embedding_provider="ollama", embedding_model="fake")
    _write_knowledge(tmp_path)
    emb = FakeEmbedder()
    await ensure_index(s, embedder=emb)
    r = KnowledgeRetriever(knowledge_dir=s.knowledge_dir, chroma_dir=s.chroma_dir, embedder=emb)
    chunks = await r.retrieve("anything", min_score=0.0)
    assert chunks and chunks[0].file_id == "a" and chunks[0].metadata["review_status"] == "unreviewed"
