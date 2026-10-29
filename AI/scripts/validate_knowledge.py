"""Kiểm tra governance cho AI/knowledge: schema frontmatter, review, nguồn, id trùng.

  python -m scripts.validate_knowledge            # in báo cáo; exit 1 nếu có lỗi schema
  python -m scripts.validate_knowledge --strict   # coi unreviewed/quá hạn là lỗi (gate go-live)
"""
from __future__ import annotations

import argparse
import sys
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from app.config import get_settings  # noqa: E402
from app.rag import governance  # noqa: E402
from app.rag.indexer import scan_docs  # noqa: E402


def validate(knowledge_dir: str | Path, strict: bool = False) -> tuple[list[governance.DocReport], list[str]]:
    docs = scan_docs(knowledge_dir)
    reports = [governance.check_doc(d.metadata, d.path.as_posix()) for d in docs]
    problems: list[str] = []
    ids = Counter(r.file_id for r in reports if r.file_id)
    problems += [f"id trùng: {i} ({n} file)" for i, n in ids.items() if n > 1]
    for r in reports:
        problems += [f"{r.path}: {e}" for e in r.errors]
        if strict:
            problems += [f"{r.path}: {w}" for w in r.warnings]
    return reports, problems


def main() -> int:
    sys.stdout.reconfigure(encoding="utf-8")  # console Windows mặc định cp1252
    parser = argparse.ArgumentParser()
    parser.add_argument("--dir", default=None)
    parser.add_argument("--strict", action="store_true")
    args = parser.parse_args()
    reports, problems = validate(args.dir or get_settings().knowledge_dir, args.strict)
    by_status = Counter(r.review_status for r in reports)
    print(f"{len(reports)} tài liệu: " + ", ".join(f"{k}={v}" for k, v in sorted(by_status.items())))
    for line in problems:
        print(f"  x {line}")
    if not problems:
        print("OK")
    return 1 if problems else 0


if __name__ == "__main__":
    raise SystemExit(main())
