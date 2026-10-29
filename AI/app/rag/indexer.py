from __future__ import annotations

import argparse
import asyncio
import hashlib
import json
import logging
import os
import time
from dataclasses import dataclass
from pathlib import Path

import frontmatter

from app.config import Settings, get_settings
from app.rag import governance
from app.rag.embedding import EmbeddingSpec, build_embedder, resolve_embedding_spec

logger = logging.getLogger(__name__)

# Tiền tố collection; collection thật có hậu tố build-id (versioned, swap nguyên tử
# qua manifest) — xem versioned_collection_name().
COLLECTION_NAME = "knowledge_v1"
# Embedding dùng cosine; mặc định Chroma là L2 -> similarity_score sẽ vô nghĩa.
COLLECTION_METADATA = {"hnsw:space": "cosine"}
MANIFEST_NAME = "index_manifest.json"
LOCK_NAME = ".index.lock"
LOCK_STALE_SEC = 600


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


@dataclass(frozen=True)
class KnowledgeDoc:
    path: Path
    metadata: dict
    body: str


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


def versioned_collection_name(knowledge_hash: str, spec: EmbeddingSpec, require_reviewed: bool) -> str:
    key = f"{knowledge_hash}|{spec.label}|{spec.dimension}|{int(require_reviewed)}"
    return f"{COLLECTION_NAME}_{hashlib.sha256(key.encode()).hexdigest()[:10]}"


def write_index_manifest(
    chroma_dir: str | Path,
    *,
    files: int,
    chunks: int,
    embedding_model: str,
    knowledge_hash: str,
    elapsed_ms: int,
    collection: str = COLLECTION_NAME,
    embedding_provider: str = "ollama",
    embedding_dimension: int = 0,
    require_reviewed: bool = False,
    skipped: int = 0,
) -> dict:
    payload = {
        "collection": collection,
        "files": files,
        "chunks": chunks,
        "embedding_provider": embedding_provider,
        "embedding_model": embedding_model,
        "embedding_dimension": embedding_dimension,
        "knowledge_hash": knowledge_hash,
        "require_reviewed": require_reviewed,
        "skipped_docs": skipped,
        "built_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "elapsed_ms": elapsed_ms,
        "version": 2,
    }
    path = manifest_path(chroma_dir)
    path.parent.mkdir(parents=True, exist_ok=True)
    tmp = path.with_suffix(".json.tmp")
    tmp.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    os.replace(tmp, path)  # nguyên tử: reader không bao giờ thấy manifest nửa chừng
    return payload


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
        if "_meta" in path.parts or path.name.upper() in {"README.MD", "GOVERNANCE.MD"}:
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
        "review_status": governance.review_status(doc.metadata),
        "reviewed_at": str(doc.metadata.get("reviewed_at") or ""),
        "sources": governance.sources_summary(doc.metadata),
    }


def build_chunks(
    docs: list[KnowledgeDoc], require_reviewed: bool = False
) -> tuple[list[str], list[str], list[dict], int]:
    """(ids, documents, metadatas, số tài liệu bị bỏ qua vì governance)."""
    ids: list[str] = []
    documents: list[str] = []
    metadatas: list[dict] = []
    skipped = 0
    for doc in sorted(docs, key=lambda d: str(d.path)):
        if not governance.is_indexable(doc.metadata, require_reviewed):
            skipped += 1
            continue
        file_id = str(doc.metadata.get("id") or doc.path.stem)
        for idx, chunk in enumerate(split_markdown(doc.body)):
            ids.append(f"{file_id}#{idx}")
            documents.append(chunk)
            metadatas.append(_metadata(doc, idx))
    return ids, documents, metadatas, skipped


@dataclass(frozen=True)
class IndexStatus:
    ok: bool
    # ok | missing_manifest | missing_collection | count_mismatch | stale_embedding
    # | stale_policy | stale_knowledge | error
    reason: str
    manifest: dict | None = None
    count: int = 0

    def detail(self) -> dict:
        m = self.manifest or {}
        return {
            "status": "ok" if self.ok else "empty_or_stale",
            "reason": self.reason,
            "count": self.count,
            "manifest_chunks": m.get("chunks"),
            "collection": m.get("collection"),
            "embedding": f"{m.get('embedding_provider', 'ollama')}:{m.get('embedding_model')}",
            "knowledge_hash": (m.get("knowledge_hash") or "")[:12],
        }


def collection_name_from_manifest(manifest: dict | None) -> str:
    return str((manifest or {}).get("collection") or COLLECTION_NAME)


def check_index(settings: Settings | None = None) -> IndexStatus:
    """So manifest + Chroma với knowledge/embedding/policy hiện hành (không gọi embedding)."""
    s = settings or get_settings()
    manifest = load_index_manifest(s.chroma_dir)
    if not manifest:
        return IndexStatus(False, "missing_manifest")
    try:
        chromadb = _load_chromadb()
        client = chromadb.PersistentClient(path=s.chroma_dir)
        try:
            count = int(client.get_collection(collection_name_from_manifest(manifest)).count())
        except Exception:  # noqa: BLE001
            return IndexStatus(False, "missing_collection", manifest)
        spec = resolve_embedding_spec(s)
        if count <= 0 or count != int(manifest.get("chunks") or 0):
            return IndexStatus(False, "count_mismatch", manifest, count)
        if (
            manifest.get("embedding_provider", "ollama") != spec.provider
            or manifest.get("embedding_model") != spec.model
            or (spec.dimension and int(manifest.get("embedding_dimension") or 0) != spec.dimension)
        ):
            return IndexStatus(False, "stale_embedding", manifest, count)
        if bool(manifest.get("require_reviewed", False)) != s.rag_require_reviewed:
            return IndexStatus(False, "stale_policy", manifest, count)
        if manifest.get("knowledge_hash") != knowledge_fingerprint(s.knowledge_dir):
            return IndexStatus(False, "stale_knowledge", manifest, count)
        return IndexStatus(True, "ok", manifest, count)
    except Exception as exc:  # noqa: BLE001
        logger.warning("index check failed: %s", type(exc).__name__)
        return IndexStatus(False, "error", manifest)


def _drop_old_collections(client, keep: str) -> None:
    for c in client.list_collections():
        name = str(getattr(c, "name", c))
        if name.startswith(COLLECTION_NAME) and name != keep:
            try:
                client.delete_collection(name)
            except Exception:  # noqa: BLE001
                logger.warning("không xoá được collection cũ %s", name)


async def rebuild_index(settings: Settings | None = None, embedder=None) -> dict:
    """Build collection MỚI (versioned) rồi swap manifest; collection cũ vẫn phục vụ
    tới khi manifest trỏ sang bản mới, sau đó mới xoá."""
    s = settings or get_settings()
    chromadb = _load_chromadb()
    spec = resolve_embedding_spec(s)
    embedder = embedder or build_embedder(s, spec)
    docs = scan_docs(s.knowledge_dir)
    ids, documents, metadatas, skipped = build_chunks(docs, s.rag_require_reviewed)
    if not documents:
        raise RuntimeError("Không có chunk nào để index (kiểm tra knowledge_dir / review_status)")

    knowledge_hash = _knowledge_fingerprint(docs)
    name = versioned_collection_name(knowledge_hash, spec, s.rag_require_reviewed)
    client = chromadb.PersistentClient(path=s.chroma_dir)
    try:
        client.delete_collection(name)  # build dở dang trước đó
    except Exception:  # noqa: BLE001
        pass
    collection = client.create_collection(name, metadata=COLLECTION_METADATA)

    t0 = time.perf_counter()
    embeddings = await embedder.embed_documents(documents)
    if len(embeddings) != len(documents):
        raise RuntimeError("Số embedding không khớp số chunk")
    dimension = len(embeddings[0])
    if spec.dimension and dimension != spec.dimension:
        raise RuntimeError(f"Embedding dimension {dimension} != cấu hình {spec.dimension}")
    collection.upsert(ids=ids, documents=documents, metadatas=metadatas, embeddings=embeddings)
    if collection.count() != len(documents):
        raise RuntimeError("Collection mới không đủ chunk sau upsert; giữ index cũ")

    elapsed_ms = int((time.perf_counter() - t0) * 1000)
    manifest = write_index_manifest(
        s.chroma_dir,
        files=len(docs) - skipped,
        chunks=len(documents),
        embedding_model=spec.model,
        embedding_provider=spec.provider,
        embedding_dimension=dimension,
        knowledge_hash=knowledge_hash,
        elapsed_ms=elapsed_ms,
        collection=name,
        require_reviewed=s.rag_require_reviewed,
        skipped=skipped,
    )
    _drop_old_collections(client, keep=name)
    return {
        "collection": name,
        "files": len(docs) - skipped,
        "skipped_docs": skipped,
        "chunks": len(documents),
        "elapsed_ms": elapsed_ms,
        "manifest": manifest,
    }


def _acquire_lock(chroma_dir: str | Path) -> Path | None:
    lock = Path(chroma_dir) / LOCK_NAME
    lock.parent.mkdir(parents=True, exist_ok=True)
    try:
        if lock.exists() and time.time() - lock.stat().st_mtime > LOCK_STALE_SEC:
            lock.unlink()  # chủ lock đã chết
        fd = os.open(str(lock), os.O_CREAT | os.O_EXCL | os.O_WRONLY)
    except (FileExistsError, FileNotFoundError, PermissionError):
        return None
    os.write(fd, str(os.getpid()).encode())
    os.close(fd)
    return lock


async def ensure_index(
    settings: Settings | None = None, *, force: bool = False, wait_sec: float = 300.0, embedder=None
) -> dict:
    """Idempotent: index đúng version thì bỏ qua; thiếu/stale thì build (một process
    giữ lock, process khác chờ manifest hợp lệ)."""
    s = settings or get_settings()
    status = await asyncio.to_thread(check_index, s)
    if status.ok and not force:
        return {"action": "skipped", "reason": "fresh", **status.detail()}

    deadline = time.monotonic() + wait_sec
    while True:
        lock = _acquire_lock(s.chroma_dir)
        if lock is not None:
            try:
                # Re-check: process khác có thể vừa build xong trước khi mình lấy lock.
                if not force and (await asyncio.to_thread(check_index, s)).ok:
                    return {"action": "skipped", "reason": "fresh_after_lock"}
                result = await rebuild_index(s, embedder=embedder)
                return {"action": "built", "previous_reason": status.reason, **result}
            finally:
                lock.unlink(missing_ok=True)
        if time.monotonic() > deadline:
            raise TimeoutError("Hết thời gian chờ process khác build index")
        await asyncio.sleep(2.0)
        if not force and (await asyncio.to_thread(check_index, s)).ok:
            return {"action": "skipped", "reason": "built_by_other_process"}


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--rebuild", action="store_true", help="Luôn build lại index (versioned + swap manifest)")
    parser.add_argument("--update", action="store_true", help="Alias của --rebuild")
    parser.add_argument("--ensure", action="store_true", help="Chỉ build nếu thiếu/stale (dùng cho deploy/startup)")
    parser.add_argument("--check", action="store_true", help="Chỉ kiểm tra; exit 1 nếu thiếu/stale")
    args = parser.parse_args()
    if args.check:
        status = check_index()
        print(json.dumps(status.detail(), ensure_ascii=False))
        raise SystemExit(0 if status.ok else 1)
    if args.ensure:
        print(asyncio.run(ensure_index()))
        return
    if not args.rebuild and not args.update:
        parser.error("Use --ensure, --rebuild or --check")
    print(asyncio.run(ensure_index(force=True)))


if __name__ == "__main__":
    main()
