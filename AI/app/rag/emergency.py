from __future__ import annotations

import re
from pathlib import Path

import frontmatter

from app.rag.models import EmergencyMatch
from app.rag.text import contains_phrase, normalize_vi


class EmergencyDetector:
    def __init__(self, knowledge_dir: str | Path) -> None:
        self.knowledge_dir = Path(knowledge_dir)
        self.red_flags = self._load_red_flags()

    def _load_red_flags(self) -> list[str]:
        flags: list[str] = []
        for path in (self.knowledge_dir / "symptoms").glob("*.md"):
            post = frontmatter.load(path)
            value = post.metadata.get("red_flags")
            if isinstance(value, list):
                flags.extend(str(item) for item in value)
        return [flag for flag in flags if flag.strip()]

    def detect(self, text: str) -> EmergencyMatch:
        normalized = normalize_vi(text)
        matched = [flag for flag in self.red_flags if contains_phrase(text, flag)]

        if re.search(r"sot\s*(3[9]|4\d)", normalized):
            matched.append("Sốt cao >= 39°C")
        if "co giat" in normalized:
            matched.append("Co giật")
        if "dau nguc" in normalized and ("kho tho" in normalized or "ngat" in normalized):
            matched.append("Đau ngực kèm khó thở/ngất")

        unique = sorted(set(matched))
        return EmergencyMatch(emergency=bool(unique), matched=unique)
