"""Offline evaluation suite (Phase 6) — no Vertex/Ollama required for core gates.

Usage:
  python -m eval.run_offline
  python -m eval.run_offline --fail-under 0.95

Metrics reported:
  - safety pre_filter recall / precision-ish (exact match expected)
  - confirm_intent accuracy
  - post_validator detection
Quality gate default: 100% on safety + confirm + post_validate curated sets.
"""
from __future__ import annotations

import argparse
import json
import sys
from dataclasses import dataclass, field
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from app.nlu.confirm_intent import ConfirmIntent, classify_confirmation
from app.policies import post_validator, pre_filter

DATASETS = Path(__file__).resolve().parent / "datasets"


@dataclass
class CaseResult:
    id: str
    ok: bool
    detail: str = ""


@dataclass
class SuiteReport:
    name: str
    results: list[CaseResult] = field(default_factory=list)

    @property
    def passed(self) -> int:
        return sum(1 for r in self.results if r.ok)

    @property
    def total(self) -> int:
        return len(self.results)

    @property
    def rate(self) -> float:
        return self.passed / self.total if self.total else 1.0


def _load_jsonl(path: Path) -> list[dict]:
    rows = []
    for line in path.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#"):
            continue
        rows.append(json.loads(line))
    return rows


def eval_safety() -> SuiteReport:
    report = SuiteReport("safety")
    for row in _load_jsonl(DATASETS / "safety.jsonl"):
        exp = row["expected"]
        pf = pre_filter.check(row["input"])
        ok = True
        details = []
        if exp.get("pre_filter_blocked") is not None and pf.blocked != exp["pre_filter_blocked"]:
            ok = False
            details.append(f"blocked={pf.blocked}")
        if exp.get("reason") and pf.reason != exp["reason"]:
            ok = False
            details.append(f"reason={pf.reason}")
        if exp.get("injection_suspected") is not None and pf.injection_suspected != exp["injection_suspected"]:
            ok = False
            details.append(f"injection={pf.injection_suspected}")
        report.results.append(CaseResult(row["id"], ok, ";".join(details)))
    return report


def eval_confirm() -> SuiteReport:
    report = SuiteReport("nlu_confirm")
    mapping = {
        "confirm": ConfirmIntent.CONFIRM,
        "reject": ConfirmIntent.REJECT,
        "ambiguous": ConfirmIntent.AMBIGUOUS,
    }
    for row in _load_jsonl(DATASETS / "nlu.jsonl"):
        if row.get("category") != "nlu_confirm":
            continue
        got = classify_confirmation(row["input"])
        want = mapping[row["expected"]["intent"]]
        # OTHER treated as ambiguous for safety gate (must not auto-confirm)
        ok = got == want or (
            row["expected"]["intent"] == "ambiguous" and got in (ConfirmIntent.AMBIGUOUS, ConfirmIntent.OTHER)
        )
        report.results.append(CaseResult(row["id"], ok, f"got={got.value}"))
    return report


def eval_post_validate() -> SuiteReport:
    report = SuiteReport("post_validate")
    for row in _load_jsonl(DATASETS / "post_validate.jsonl"):
        pv = post_validator.check(row["input"])
        exp = row["expected"]
        ok = pv.violated == exp.get("violated", False)
        contain = exp.get("reasons_contain")
        if contain and contain not in pv.reasons:
            ok = False
        report.results.append(CaseResult(row["id"], ok, f"reasons={pv.reasons}"))
    return report


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--fail-under", type=float, default=1.0, help="Min pass rate overall")
    args = parser.parse_args()

    suites = [eval_safety(), eval_confirm(), eval_post_validate()]
    overall_pass = 0
    overall_total = 0
    print("=== Offline AI Eval ===")
    for s in suites:
        overall_pass += s.passed
        overall_total += s.total
        status = "PASS" if s.rate >= args.fail_under else "FAIL"
        print(f"[{status}] {s.name}: {s.passed}/{s.total} ({s.rate:.0%})")
        for r in s.results:
            if not r.ok:
                print(f"  - FAIL {r.id}: {r.detail}")
    rate = overall_pass / overall_total if overall_total else 1.0
    print(f"OVERALL: {overall_pass}/{overall_total} ({rate:.0%})")
    if rate < args.fail_under:
        print("QUALITY GATE FAILED")
        return 1
    print("QUALITY GATE PASSED")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
