"""Knowledge governance: schema frontmatter, trạng thái review, kiểm tra trước khi index.

Quy trình đầy đủ: knowledge/GOVERNANCE.md. Tài liệu thiếu `review_status` được coi
là `unreviewed` (KHÔNG tự suy ra đã duyệt). `reviewed` chỉ hợp lệ khi có người duyệt,
ngày duyệt và nguồn tham chiếu.
"""
from __future__ import annotations

import datetime as _dt
import json
from dataclasses import dataclass, field

REQUIRED_FIELDS = ("id", "type", "canonical_name", "version")
VALID_TYPES = {"disease", "symptom", "faq", "policy"}
VALID_STATUS = {"unreviewed", "reviewed", "deprecated"}
# Loại nội dung y khoa cần nguồn tham chiếu; faq/policy là quy định nội bộ.
MEDICAL_TYPES = {"disease", "symptom"}


@dataclass
class DocReport:
    file_id: str
    path: str
    review_status: str
    errors: list[str] = field(default_factory=list)
    warnings: list[str] = field(default_factory=list)


def review_status(metadata: dict) -> str:
    status = str(metadata.get("review_status") or "unreviewed").strip().lower()
    return status if status in VALID_STATUS else "invalid"


def is_indexable(metadata: dict, require_reviewed: bool) -> bool:
    status = review_status(metadata)
    if status in {"deprecated", "invalid"}:
        return False
    return status == "reviewed" if require_reviewed else True


def _as_date(value: object) -> _dt.date | None:
    if isinstance(value, _dt.datetime):
        return value.date()
    if isinstance(value, _dt.date):
        return value
    try:
        return _dt.date.fromisoformat(str(value))
    except ValueError:
        return None


def normalize_sources(metadata: dict) -> list[dict]:
    out: list[dict] = []
    raw = metadata.get("sources")
    for item in raw if isinstance(raw, list) else []:
        if isinstance(item, dict):
            out.append({k: str(v) for k, v in item.items() if v is not None})
        elif item:
            out.append({"title": str(item)})
    return out


def sources_summary(metadata: dict) -> str:
    """JSON gọn để lưu trong metadata chunk (Chroma chỉ nhận scalar)."""
    return json.dumps(
        [{k: s[k] for k in ("title", "url") if k in s} for s in normalize_sources(metadata)],
        ensure_ascii=False,
    )


def check_doc(metadata: dict, path: str, *, today: _dt.date | None = None) -> DocReport:
    today = today or _dt.date.today()
    status = review_status(metadata)
    rep = DocReport(file_id=str(metadata.get("id") or ""), path=path, review_status=status)

    for name in REQUIRED_FIELDS:
        if metadata.get(name) in (None, ""):
            rep.errors.append(f"thiếu frontmatter '{name}'")
    if metadata.get("type") and metadata["type"] not in VALID_TYPES:
        rep.errors.append(f"type '{metadata['type']}' không hợp lệ (cho phép: {sorted(VALID_TYPES)})")
    try:
        if int(metadata.get("version") or 0) < 1:
            rep.errors.append("version phải là số nguyên >= 1")
    except (TypeError, ValueError):
        rep.errors.append("version phải là số nguyên")
    if status == "invalid":
        rep.errors.append(f"review_status '{metadata.get('review_status')}' không hợp lệ (cho phép: {sorted(VALID_STATUS)})")

    sources = normalize_sources(metadata)
    if status == "reviewed":
        if not metadata.get("reviewed_by"):
            rep.errors.append("reviewed thiếu 'reviewed_by' (vai trò/ID người duyệt y khoa)")
        reviewed_at = _as_date(metadata.get("reviewed_at"))
        if reviewed_at is None:
            rep.errors.append("reviewed thiếu/sai 'reviewed_at' (YYYY-MM-DD)")
        elif reviewed_at > today:
            rep.errors.append("'reviewed_at' nằm trong tương lai")
        if metadata.get("type") in MEDICAL_TYPES and not sources:
            rep.errors.append("nội dung y khoa reviewed phải có 'sources' (title + url/accessed_at)")
        if not metadata.get("owner"):
            rep.warnings.append("chưa có 'owner'")
        next_review = _as_date(metadata.get("next_review_at"))
        if next_review is None:
            rep.warnings.append("chưa có 'next_review_at'")
        elif next_review < today:
            rep.warnings.append(f"quá hạn review lại ({next_review})")
    elif status == "unreviewed":
        rep.warnings.append("chưa review y khoa")
    for s in sources:
        if "title" not in s:
            rep.errors.append("mỗi source cần 'title'")
            break
    return rep
