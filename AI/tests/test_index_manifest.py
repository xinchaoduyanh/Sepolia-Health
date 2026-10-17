"""Index manifest helpers (Phase 5)."""
from pathlib import Path

from app.rag.indexer import (
    KnowledgeDoc,
    load_index_manifest,
    write_index_manifest,
    _knowledge_fingerprint,
    knowledge_fingerprint,
)


def test_write_and_load_manifest(tmp_path: Path):
    docs = [
        KnowledgeDoc(path=tmp_path / "a.md", metadata={"id": "a"}, body="hello"),
        KnowledgeDoc(path=tmp_path / "b.md", metadata={"id": "b"}, body="world"),
    ]
    h = _knowledge_fingerprint(docs)
    written = write_index_manifest(
        tmp_path / "chroma",
        files=2,
        chunks=5,
        embedding_model="bge-m3",
        knowledge_hash=h,
        elapsed_ms=12,
    )
    loaded = load_index_manifest(tmp_path / "chroma")
    assert loaded is not None
    assert loaded["chunks"] == 5
    assert loaded["embedding_model"] == "bge-m3"
    assert loaded["knowledge_hash"] == h
    assert written["collection"] == loaded["collection"]


def test_missing_manifest(tmp_path: Path):
    assert load_index_manifest(tmp_path / "nope") is None


def test_knowledge_fingerprint_changes_with_source(tmp_path: Path):
    doc = tmp_path / "faq" / "a.md"
    doc.parent.mkdir(parents=True)
    doc.write_text("---\nid: a\ntype: faq\n---\nhello", encoding="utf-8")
    first = knowledge_fingerprint(tmp_path)
    doc.write_text("---\nid: a\ntype: faq\n---\nchanged", encoding="utf-8")
    assert knowledge_fingerprint(tmp_path) != first
