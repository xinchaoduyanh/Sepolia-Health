from __future__ import annotations

from pathlib import Path

from app.config import get_settings
from app.providers.ollama_provider import OllamaProvider
from app.rag.indexer import COLLECTION_METADATA, COLLECTION_NAME
from app.rag.models import KnowledgeType, RetrievedChunk
from app.rag.policy import KnowledgePolicy


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
        if self._collection is None:
            chromadb = _load_chromadb()
            client = chromadb.PersistentClient(path=self.chroma_dir)
            self._collection = client.get_or_create_collection(
                COLLECTION_NAME, metadata=COLLECTION_METADATA
            )
        return self._collection

    async def retrieve(
        self,
        query: str,
        top_k: int = 5,
        filter_types: list[KnowledgeType] | None = None,
        allowed_only: bool = True,
        min_score: float = 0.45,
    ) -> list[RetrievedChunk]:
        collection = self._get_collection()

        query_embedding = (await self.provider.embed(self.embedding_model, [query]))[0]
        where = {"type": {"$in": filter_types}} if filter_types else None
        result = collection.query(
            query_embeddings=[query_embedding],
            n_results=top_k,
            where=where,
            include=["documents", "metadatas", "distances"],
        )

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
