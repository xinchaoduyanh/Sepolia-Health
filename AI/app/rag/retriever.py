from __future__ import annotations

from pathlib import Path

from app.config import get_settings
from app.providers.ollama_provider import OllamaProvider
from app.rag.indexer import COLLECTION_NAME
from app.rag.models import KnowledgeType, RetrievedChunk
from app.rag.policy import KnowledgePolicy


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
    ) -> None:
        settings = get_settings()
        self.knowledge_dir = Path(knowledge_dir or settings.knowledge_dir)
        self.chroma_dir = str(chroma_dir or settings.chroma_dir)
        self.embedding_model = embedding_model or settings.embedding_model
        self.provider = OllamaProvider(ollama_base_url or settings.ollama_base_url)
        self.policy = KnowledgePolicy(self.knowledge_dir)
        self._collection = None  # lazy + cached giữa các lần retrieve

    def _get_collection(self):
        """Lấy collection đã index. Không get_or_create rỗng (giả ready)."""
        if self._collection is None:
            chromadb = _load_chromadb()
            client = chromadb.PersistentClient(path=self.chroma_dir)
            try:
                self._collection = client.get_collection(COLLECTION_NAME)
            except Exception as exc:  # noqa: BLE001
                raise RuntimeError(
                    f"RAG collection '{COLLECTION_NAME}' missing. "
                    "Run: python -m app.rag.indexer --rebuild"
                ) from exc
        return self._collection

    def collection_count(self) -> int:
        try:
            return int(self._get_collection().count())
        except Exception:  # noqa: BLE001
            return 0

    async def retrieve(
        self,
        query: str,
        top_k: int = 5,
        filter_types: list[KnowledgeType] | None = None,
        allowed_only: bool = True,
        min_score: float = 0.45,
    ) -> list[RetrievedChunk]:
        try:
            collection = self._get_collection()
            if collection.count() == 0:
                raise RetrievalUnavailableError("RAG collection is empty")
        except RetrievalUnavailableError:
            raise
        except Exception as exc:
            raise RetrievalUnavailableError("RAG collection unavailable") from exc

        try:
            query_embedding = (await self.provider.embed(self.embedding_model, [query]))[0]
        except Exception as exc:
            raise RetrievalUnavailableError("Embedding provider unavailable") from exc

        where = {"type": {"$in": filter_types}} if filter_types else None
        try:
            result = collection.query(
                query_embeddings=[query_embedding],
                n_results=top_k,
                where=where,
                include=["documents", "metadatas", "distances"],
            )
        except Exception as exc:
            raise RetrievalUnavailableError("Vector query failed") from exc

        docs = result.get("documents", [[]])[0]
        metadatas = result.get("metadatas", [[]])[0]
        distances = result.get("distances", [[]])[0]

        chunks: list[RetrievedChunk] = []
        for text, metadata, distance in zip(docs, metadatas, distances):
            score = max(0.0, 1.0 - float(distance))
            if score >= min_score:
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

        return self.policy.filter_chunks(chunks) if allowed_only else chunks
