from __future__ import annotations

import argparse
import asyncio
import hashlib
import json
import time
from dataclasses import dataclass
from pathlib import Path

import frontmatter

from app.config import get_settings
from app.providers.ollama_provider import OllamaProvider

COLLECTION_NAME = "knowledge_v1"
# bge-m3 dùng cosine; mặc định Chroma là L2 -> similarity_score sẽ vô nghĩa.
COLLECTION_METADATA = {"hnsw:space": "cosine"}
MANIFEST_NAME = "index_manifest.json"


def manifest_path(chroma_dir: str | Path) -> Path:
    return Path(chroma_dir) / MANIFEST_NAME


def load_index_manifest(chroma_dir: str | Path) -> dict | None:
    path = manifest_path(chroma_dir)
    if not path.is_file():
        return None
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        return None


def _knowledge_fingerprint(docs: list[KnowledgeDoc]) -> str:
    h = hashlib.sha256()
    for doc in sorted(docs, key=lambda d: str(d.path)):
        h.update(str(doc.path.as_posix()).encode("utf-8"))
        h.update(b"\0")
        h.update(doc.body.encode("utf-8"))
        h.update(b"\0")
        h.update(json.dumps(doc.metadata, sort_keys=True, default=str).encode("utf-8"))
        h.update(b"\n")
    return h.hexdigest()


def knowledge_fingerprint(knowledge_dir: str | Path) -> str:
    """Fingerprint current source documents for readiness/staleness checks."""
    return _knowledge_fingerprint(scan_docs(knowledge_dir))


def write_index_manifest(
    chroma_dir: str | Path,
    *,
    files: int,
    chunks: int,
    embedding_model: str,
    knowledge_hash: str,
    elapsed_ms: int,
) -> dict:
    payload = {
        "collection": COLLECTION_NAME,
        "files": files,
        "chunks": chunks,
        "embedding_model": embedding_model,
        "knowledge_hash": knowledge_hash,
        "built_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "elapsed_ms": elapsed_ms,
        "version": 1,
    }
    path = manifest_path(chroma_dir)
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    return payload


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

    elapsed_ms = int((time.perf_counter() - t0) * 1000)
    knowledge_hash = _knowledge_fingerprint(docs)
    manifest = write_index_manifest(
        settings.chroma_dir,
        files=len(docs),
        chunks=len(documents),
        embedding_model=settings.embedding_model,
        knowledge_hash=knowledge_hash,
        elapsed_ms=elapsed_ms,
    )
    return {
        "collection": COLLECTION_NAME,
        "files": len(docs),
        "chunks": len(documents),
        "elapsed_ms": elapsed_ms,
        "manifest": manifest,
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
