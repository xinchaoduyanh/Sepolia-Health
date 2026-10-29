"""Nén các lượt cũ ngoài cửa sổ history thành 1 đoạn tóm tắt ngắn (không gọi LLM).

Cửa sổ `ai_history_max_turns` chỉ giữ N lượt gần nhất nguyên văn; hội thoại dài hơn
thì thông tin ở đầu (triệu chứng, ưu tiên bác sĩ…) bị rơi. Digest giữ lại phần
ĐẦU của các câu user cũ (đó là nơi chứa yêu cầu) với ngân sách ký tự cố định, nên
chi phí prompt bị chặn trên bất kể độ dài hội thoại.
"""
from __future__ import annotations

DIGEST_MARKER = "[Tóm tắt các lượt trước trong cuộc trò chuyện]"


def build_history_digest(
    older: list[tuple[str | None, str | None]],
    *,
    max_chars: int = 600,
    per_item_chars: int = 120,
) -> str | None:
    """older: cũ -> mới. Ưu tiên giữ lượt GẦN cửa sổ hơn khi hết ngân sách."""
    lines: list[str] = []
    for user_msg, ai_msg in older:
        text = " ".join((user_msg or "").split())
        if not text:
            continue
        if len(text) > per_item_chars:
            text = text[: per_item_chars - 1].rstrip() + "…"
        lines.append(f"- Người dùng: {text}")
    if not lines:
        return None
    kept: list[str] = []
    used = len(DIGEST_MARKER)
    for line in reversed(lines):
        if used + len(line) + 1 > max_chars:
            break
        kept.append(line)
        used += len(line) + 1
    if not kept:
        return None
    kept.reverse()
    dropped = len(lines) - len(kept)
    head = DIGEST_MARKER + (f" (còn {dropped} lượt cũ hơn bị lược)" if dropped else "")
    return head + "\n" + "\n".join(kept)
