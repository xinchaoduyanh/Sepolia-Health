"""Live retrieval quality gate against the deployed/local Chroma index.

Requires the configured embedding provider and an index whose manifest matches
the current knowledge tree.
"""
from __future__ import annotations

import argparse
import asyncio
import json
from pathlib import Path

from app.rag.retriever import KnowledgeRetriever, RetrievalUnavailableError

DATASET = Path(__file__).resolve().parent / "datasets" / "retrieval.jsonl"


def load_cases() -> list[dict]:
    return [
        json.loads(line)
        for line in DATASET.read_text(encoding="utf-8").splitlines()
        if line.strip() and not line.lstrip().startswith("#")
    ]


async def run(fail_under: float) -> int:
    retriever = KnowledgeRetriever()
    cases = load_cases()
    passed = 0
    for case in cases:
        try:
            chunks = await retriever.retrieve(case["input"], top_k=5)
        except RetrievalUnavailableError as exc:
            print(f"[ERROR] retrieval unavailable: {exc}")
            return 2
        got = {chunk.file_id for chunk in chunks}
        expected = set(case.get("expected_documents") or [])
        ok = bool(expected & got)
        passed += int(ok)
        print(
            f"[{'PASS' if ok else 'FAIL'}] {case['id']}: "
            f"expected={sorted(expected)} got={sorted(got)}"
        )
    rate = passed / len(cases) if cases else 1.0
    print(f"Hit@5: {passed}/{len(cases)} ({rate:.1%})")
    return 0 if rate >= fail_under else 1


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--fail-under", type=float, default=0.90)
    args = parser.parse_args()
    return asyncio.run(run(args.fail_under))


if __name__ == "__main__":
    raise SystemExit(main())

