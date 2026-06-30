from __future__ import annotations

import argparse
import asyncio
import time
from dataclasses import dataclass
from pathlib import Path

import frontmatter

from app.config import get_settings
from app.providers.ollama_provider import OllamaProvider

COLLECTION_NAME = "knowledge_v1"
# bge-m3 dùng cosine; mặc định Chroma là L2 -> similarity_score sẽ vô nghĩa.
COLLECTION_METADATA = {"hnsw:space": "cosine"}


@dataclass(frozen=True)
class KnowledgeDoc:
    path: Path
    metadata: dict
    body: str


def _load_chromadb():
    try:
        import chromadb  # type: ignore
    except ImportError as exc:
        raise RuntimeError(
            "ChromaDB is not installed. Install AI requirements with chromadb enabled."
        ) from exc
    return chromadb


def scan_docs(knowledge_dir: str | Path) -> list[KnowledgeDoc]:
    root = Path(knowledge_dir)
    docs: list[KnowledgeDoc] = []
    for path in root.glob("**/*.md"):
        if path.parts[-2:] and "_meta" in path.parts:
            continue
        post = frontmatter.load(path)
        docs.append(KnowledgeDoc(path=path, metadata=dict(post.metadata), body=post.content.strip()))
    return docs


def split_markdown(body: str, max_chars: int = 2200) -> list[str]:
    chunks: list[str] = []
    current: list[str] = []
    for line in body.splitlines():
        if line.startswith("## ") and current:
            chunks.append("\n".join(current).strip())
            current = [line]
        else:
            current.append(line)
    if current:
        chunks.append("\n".join(current).strip())

    out: list[str] = []
    for chunk in chunks:
        if len(chunk) <= max_chars:
            out.append(chunk)
            continue
        for start in range(0, len(chunk), max_chars):
            out.append(chunk[start : start + max_chars].strip())
    return [chunk for chunk in out if chunk]


def _metadata(doc: KnowledgeDoc, chunk_idx: int) -> dict:
    file_id = str(doc.metadata.get("id") or doc.path.stem)
    return {
        "file_id": file_id,
        "chunk_idx": chunk_idx,
        "type": str(doc.metadata.get("type") or doc.path.parent.name.rstrip("s")),
        "canonical_name": str(doc.metadata.get("canonical_name") or file_id),
        "allowed_for_ai_mention": bool(doc.metadata.get("allowed_for_ai_mention", False)),
        "allowed_for_ai_diagnosis_hint": bool(doc.metadata.get("allowed_for_ai_diagnosis_hint", False)),
        "severity": str(doc.metadata.get("severity") or ""),
        "emergency": bool(doc.metadata.get("emergency", False)),
        "version": int(doc.metadata.get("version") or 1),
        "source_path": str(doc.path.as_posix()),
    }


async def rebuild_index() -> dict:
    settings = get_settings()
    chromadb = _load_chromadb()
    client = chromadb.PersistentClient(path=settings.chroma_dir)
    try:
        client.delete_collection(COLLECTION_NAME)
    except Exception:
        pass
    collection = client.get_or_create_collection(COLLECTION_NAME, metadata=COLLECTION_METADATA)

    provider = OllamaProvider(settings.ollama_base_url)
    docs = scan_docs(settings.knowledge_dir)
    ids: list[str] = []
    documents: list[str] = []
    metadatas: list[dict] = []

    for doc in docs:
        file_id = str(doc.metadata.get("id") or doc.path.stem)
        for idx, chunk in enumerate(split_markdown(doc.body)):
            ids.append(f"{file_id}#{idx}")
            documents.append(chunk)
            metadatas.append(_metadata(doc, idx))

    t0 = time.perf_counter()
    embeddings = await provider.embed(settings.embedding_model, documents) if documents else []
    if documents:
        collection.upsert(ids=ids, documents=documents, metadatas=metadatas, embeddings=embeddings)

    return {
        "collection": COLLECTION_NAME,
        "files": len(docs),
        "chunks": len(documents),
        "elapsed_ms": int((time.perf_counter() - t0) * 1000),
    }


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--rebuild", action="store_true", help="Rebuild the full ChromaDB collection")
    parser.add_argument("--update", action="store_true", help="Alias for --rebuild in V1")
    args = parser.parse_args()
    if not args.rebuild and not args.update:
        parser.error("Use --rebuild or --update")
    print(asyncio.run(rebuild_index()))


if __name__ == "__main__":
    main()
