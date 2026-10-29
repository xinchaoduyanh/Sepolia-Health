from __future__ import annotations

from pathlib import Path

from app.config import get_settings
from app.rag.embedding import Embedder, build_embedder, resolve_min_score
from app.rag.indexer import collection_name_from_manifest, load_index_manifest, manifest_path
from app.rag.lexical import Bm25Index, rrf_fuse
from app.rag.models import KnowledgeType, RetrievedChunk
from app.rag.policy import KnowledgePolicy

# Số chunk dense lấy về trước khi trộn/lọc. KB nhỏ (~100 chunk) nên lấy hết; KB lớn hơn
# thì chunk chỉ-có-BM25 ngoài top này bị bỏ (cần similarity để áp ngưỡng).
_DENSE_POOL = 200


class RetrievalUnavailableError(RuntimeError):
    """Index/embedding/query infrastructure is unavailable."""


def _load_chromadb():
    try:
        import chromadb  # type: ignore
    except ImportError as exc:
        raise RuntimeError(
            "ChromaDB is not installed. Install AI requirements with chromadb enabled."
        ) from exc
    return chromadb


class KnowledgeRetriever:
    def __init__(
        self,
        knowledge_dir: str | Path | None = None,
        chroma_dir: str | Path | None = None,
        ollama_base_url: str | None = None,
        embedding_model: str | None = None,
        embedder: Embedder | None = None,
        hybrid: bool | None = None,
        min_score: float | None = None,
    ) -> None:
        settings = get_settings()
        self.knowledge_dir = Path(knowledge_dir or settings.knowledge_dir)
        self.chroma_dir = str(chroma_dir or settings.chroma_dir)
        overrides = {}
        if ollama_base_url:
            overrides["ollama_base_url"] = ollama_base_url
        if embedding_model:
            overrides["embedding_model"] = embedding_model
        eff = settings.model_copy(update=overrides) if overrides else settings
        self.embedder = embedder or build_embedder(eff)
        self.hybrid = settings.rag_hybrid if hybrid is None else hybrid
        self.min_score = resolve_min_score(eff) if min_score is None else min_score
        self.policy = KnowledgePolicy(self.knowledge_dir)
        self._collection = None  # lazy; nạp lại khi manifest đổi (index swap lúc chạy)
        self._manifest_mtime = 0.0
        self._lexical: tuple[Bm25Index, list[str], dict[str, tuple[str, dict]]] | None = None

    def _manifest_mtime_now(self) -> float:
        try:
            return manifest_path(self.chroma_dir).stat().st_mtime
        except OSError:
            return 0.0

    def _get_collection(self):
        """Lấy collection đã index theo manifest. Không get_or_create rỗng (giả ready)."""
        mtime = self._manifest_mtime_now()
        if self._collection is None or mtime != self._manifest_mtime:
            chromadb = _load_chromadb()
            client = chromadb.PersistentClient(path=self.chroma_dir)
            name = collection_name_from_manifest(load_index_manifest(self.chroma_dir))
            try:
                self._collection = client.get_collection(name)
            except Exception as exc:  # noqa: BLE001
                self._collection = None
                raise RuntimeError(
                    f"RAG collection '{name}' missing. Run: python -m app.rag.indexer --ensure"
                ) from exc
            self._manifest_mtime = mtime
            self._lexical = None
        return self._collection

    def collection_count(self) -> int:
        try:
            return int(self._get_collection().count())
        except Exception:  # noqa: BLE001
            return 0

    def _get_lexical(self, collection):
        if self._lexical is None:
            data = collection.get(include=["documents", "metadatas"])
            ids = list(data["ids"])
            docs = list(data["documents"])
            self._lexical = (
                Bm25Index(docs),
                ids,
                {i: (d, m) for i, d, m in zip(ids, docs, data["metadatas"])},
            )
        return self._lexical

    async def retrieve(
        self,
        query: str,
        top_k: int = 5,
        filter_types: list[KnowledgeType] | None = None,
        allowed_only: bool = True,
        min_score: float | None = None,
        hybrid: bool | None = None,
    ) -> list[RetrievedChunk]:
        min_score = self.min_score if min_score is None else min_score
        use_hybrid = self.hybrid if hybrid is None else hybrid
        try:
            collection = self._get_collection()
            total = int(collection.count())
            if total == 0:
                raise RetrievalUnavailableError("RAG collection is empty")
        except RetrievalUnavailableError:
            raise
        except Exception as exc:
            raise RetrievalUnavailableError("RAG collection unavailable") from exc

        try:
            query_embedding = await self.embedder.embed_query(query)
        except Exception as exc:
            raise RetrievalUnavailableError("Embedding provider unavailable") from exc

        where = {"type": {"$in": filter_types}} if filter_types else None
        try:
            result = collection.query(
                query_embeddings=[query_embedding],
                n_results=min(total, _DENSE_POOL),
                where=where,
                include=["documents", "metadatas", "distances"],
            )
        except Exception as exc:
            raise RetrievalUnavailableError("Vector query failed") from exc

        ids = result.get("ids", [[]])[0]
        docs = result.get("documents", [[]])[0]
        metadatas = result.get("metadatas", [[]])[0]
        distances = result.get("distances", [[]])[0]
        dense = {
            cid: (text, meta, max(0.0, 1.0 - float(dist)))
            for cid, text, meta, dist in zip(ids, docs, metadatas, distances)
        }
        order = list(ids)  # đã xếp theo khoảng cách tăng dần

        if use_hybrid:
            try:
                index, lex_ids, _ = self._get_lexical(collection)
                lex_order = [
                    lex_ids[i]
                    for i, _score in index.top(query, 50)
                    if lex_ids[i] in dense  # giữ filter type + cần similarity để áp ngưỡng
                ]
                order = [cid for cid, _ in rrf_fuse([order, lex_order])]
            except Exception:  # noqa: BLE001 — lexical hỏng thì rơi về dense thuần
                pass

        chunks: list[RetrievedChunk] = []
        for cid in order:
            text, metadata, score = dense[cid]
            if score < min_score:
                continue
            chunks.append(
                RetrievedChunk(
                    file_id=str(metadata.get("file_id") or ""),
                    canonical_name=str(metadata.get("canonical_name") or ""),
                    type=metadata.get("type"),
                    text=text,
                    metadata=metadata,
                    similarity_score=score,
                )
            )
        if allowed_only:
            chunks = self.policy.filter_chunks(chunks)
        return chunks[:top_k]
