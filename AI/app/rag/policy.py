from __future__ import annotations

from pathlib import Path
from typing import Iterable

import frontmatter

from app.rag.models import PolicyCheckResult, RetrievedChunk
from app.rag.text import contains_phrase


class KnowledgePolicy:
    def __init__(self, knowledge_dir: str | Path) -> None:
        self.knowledge_dir = Path(knowledge_dir)
        self.allowed_ids = self._load_allowed_ids()
        self.blocked_terms = self._load_blocked_terms()

    def _load_allowed_ids(self) -> set[str]:
        path = self.knowledge_dir / "_meta" / "allowed-diagnoses.md"
        if not path.exists():
            return set()
        ids: set[str] = set()
        in_allowed = False
        for raw in path.read_text(encoding="utf-8").splitlines():
            line = raw.strip()
            if line.startswith("# "):
                in_allowed = "được phép" in line.lower() or "duoc phep" in line.lower()
                continue
            if in_allowed and line.startswith("- "):
                ids.add(line[2:].strip())
        return ids

    @staticmethod
    def _iter_list(value: object) -> Iterable[str]:
        if isinstance(value, list):
            return (str(item) for item in value)
        if isinstance(value, str):
            return (value,)
        return ()

    def _load_blocked_terms(self) -> set[str]:
        terms: set[str] = self._load_meta_blocked_terms()
        for path in (self.knowledge_dir / "diseases").glob("*.md"):
            post = frontmatter.load(path)
            file_id = str(post.metadata.get("id") or path.stem)
            allowed = bool(post.metadata.get("allowed_for_ai_mention", False))
            if file_id in self.allowed_ids and allowed:
                continue
            canonical = post.metadata.get("canonical_name")
            if canonical:
                terms.add(str(canonical))
            terms.update(self._iter_list(post.metadata.get("aliases")))
        return {term for term in terms if term.strip()}

    def _load_meta_blocked_terms(self) -> set[str]:
        path = self.knowledge_dir / "_meta" / "allowed-diagnoses.md"
        if not path.exists():
            return set()
        terms: set[str] = set()
        in_blocked = False
        for raw in path.read_text(encoding="utf-8").splitlines():
            line = raw.strip()
            if line.startswith("# "):
                lower = line.lower()
                in_blocked = "cấm" in lower or "cam" in lower
                continue
            if in_blocked and line.startswith("- "):
                # slug "ung-thu-*" -> "ung thu" để khớp văn xuôi (contains_phrase
                # chuẩn hoá theo từ; giữ slug có dấu '-' sẽ không bao giờ match prose).
                slug = line[2:].strip().replace("*", "").strip()
                if slug:
                    terms.add(slug.replace("-", " ").strip())
        return terms

    def filter_chunks(self, chunks: list[RetrievedChunk]) -> list[RetrievedChunk]:
        filtered: list[RetrievedChunk] = []
        for chunk in chunks:
            if chunk.type != "disease":
                filtered.append(chunk)
                continue
            allowed = bool(chunk.metadata.get("allowed_for_ai_mention", False))
            if chunk.file_id in self.allowed_ids and allowed:
                filtered.append(chunk)
        return filtered

    def check_response_mentions(self, response_text: str) -> PolicyCheckResult:
        found = sorted(term for term in self.blocked_terms if contains_phrase(response_text, term))
        return PolicyCheckResult(violated=bool(found), found=found)
