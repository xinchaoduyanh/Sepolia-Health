"""PromptRegistry — load các file MD trong prompts/ (frontmatter), cache, render.

Mọi persona/scope/refusal nằm trong MD versioned. Đổi cách AI nói = sửa MD +
bump version + reload, không sửa code.
"""
from __future__ import annotations

import re
from dataclasses import dataclass, field
from pathlib import Path

import frontmatter

_VAR_RE = re.compile(r"\{\{\s*(\w+)\s*\}\}")
_REQUIRED = ("id", "kind", "version")


@dataclass
class Prompt:
    id: str
    kind: str            # system | policy | refusal | few_shot
    version: int
    status: str          # active | draft | deprecated
    locale: str
    body: str
    meta: dict = field(default_factory=dict)


class PromptValidationError(ValueError):
    pass


class PromptRegistry:
    def __init__(self, prompts_dir: str | Path) -> None:
        self.dir = Path(prompts_dir)
        self._by_id: dict[str, dict[int, Prompt]] = {}

    def load_all(self) -> None:
        self._by_id.clear()
        for path in sorted(self.dir.rglob("*.md")):
            if path.name.startswith("_") or path.name.lower() == "readme.md":
                continue
            post = frontmatter.load(str(path))
            meta = post.metadata
            missing = [k for k in _REQUIRED if k not in meta]
            if missing:
                raise PromptValidationError(f"{path.name} thiếu frontmatter: {missing}")
            prompt = Prompt(
                id=str(meta["id"]),
                kind=str(meta["kind"]),
                version=int(meta["version"]),
                status=str(meta.get("status", "active")),
                locale=str(meta.get("locale", "vi-VN")),
                body=post.content.strip(),
                meta=dict(meta),
            )
            bucket = self._by_id.setdefault(prompt.id, {})
            if prompt.version in bucket:
                raise PromptValidationError(f"{prompt.id} trùng version {prompt.version}")
            bucket[prompt.version] = prompt
        self._validate()

    def _validate(self) -> None:
        for pid, versions in self._by_id.items():
            actives = [p for p in versions.values() if p.status == "active"]
            if len(actives) > 1:
                raise PromptValidationError(f"{pid} có >1 version active")

    def get(self, id: str, version: int | None = None) -> Prompt:
        versions = self._by_id.get(id)
        if not versions:
            raise KeyError(f"prompt không tồn tại: {id}")
        if version is not None:
            return versions[version]
        actives = [p for p in versions.values() if p.status == "active"]
        pool = actives or list(versions.values())
        return max(pool, key=lambda p: p.version)

    def render(self, id: str, context: dict, version: int | None = None) -> str:
        return self._render_str(self.get(id, version).body, context)

    @staticmethod
    def _render_str(body: str, context: dict) -> str:
        def repl(m: re.Match) -> str:
            key = m.group(1)
            return str(context[key]) if key in context else m.group(0)

        return _VAR_RE.sub(repl, body)

    def reload(self) -> None:
        self.load_all()
