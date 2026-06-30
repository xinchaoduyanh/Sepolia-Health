"""Smoke test RAG: retriever thật (ChromaDB + bge-m3 qua Ollama).

Cần: Ollama có model `bge-m3` (port theo AI_OLLAMA_BASE_URL) + index đã build
(`python -m app.rag.indexer --rebuild`). KHÔNG thuộc pytest (cần model thật).

Chạy:  AI/.venv/Scripts/python.exe -m scripts.smoke_rag
"""
import asyncio
import sys

# Console Windows mặc định cp1252 -> in tiếng Việt sẽ crash. Ép UTF-8.
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

from app.config import get_settings
from app.rag.retriever import KnowledgeRetriever

QUERIES = [
    "ho khan đau họng kéo dài mấy ngày",
    "sốt cao liên tục không hạ",
    "cảm cúm hắt hơi sổ mũi",
]


async def main() -> None:
    s = get_settings()
    print(f"chroma_dir={s.chroma_dir}  ollama={s.ollama_base_url}  embed={s.embedding_model}")
    retriever = KnowledgeRetriever(
        knowledge_dir=s.knowledge_dir,
        chroma_dir=s.chroma_dir,
        ollama_base_url=s.ollama_base_url,
        embedding_model=s.embedding_model,
    )

    for q in QUERIES:
        print("=" * 70)
        print(f"Q: {q}")
        try:
            chunks = await retriever.retrieve(
                q, top_k=3, filter_types=["disease", "symptom"], allowed_only=True
            )
        except Exception as exc:  # noqa: BLE001
            print(f"  !! retrieve lỗi: {type(exc).__name__}: {exc}")
            print("  Gợi ý: kiểm tra Ollama có bge-m3 + đã chạy indexer --rebuild chưa.")
            continue
        if not chunks:
            print("  (không có chunk nào — index rỗng hoặc bị allowlist lọc hết)")
        for c in chunks:
            print(f"  [{c.similarity_score:.3f}] {c.type:8s} {c.canonical_name}  ({c.file_id})")
            print(f"          {c.text[:90].replace(chr(10), ' ')}…")


if __name__ == "__main__":
    asyncio.run(main())
