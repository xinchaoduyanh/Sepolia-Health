# E2E conversation pipeline

Giả lập người dùng nhắn AI, đối chiếu kết quả với kỳ vọng. LLM luôn là Gemini thật (Vertex, key trong `AI/.env`);
Ollama không bắt buộc.

| Chế độ | Lệnh | Backend |
|---|---|---|
| Mô phỏng (mặc định, hermetic) | `python -m eval.e2e.run_e2e` | `SimBridge` (phòng khám giả, có trạng thái) — không đụng DB |
| Live | `python -m eval.e2e.run_e2e --live` | BE thật (`AI_BE_BRIDGE_BASE_URL`) + DB thật, user test `--user-id` (mặc định 121). Tự dọn lịch của user sau mỗi kịch bản |
| Service đang chạy | `--target http://127.0.0.1:8088` | HTTP vào AI service; bỏ qua kiểm tra hậu quả nghiệp vụ |

Tuỳ chọn: `--only ID`, `--tag TAG` (hợp OR), `--repeat N` (đo độ chập chờn của LLM), `--no-judge`, `--fail-under 0.9` (exit 1 nếu thấp hơn).
Báo cáo: `eval/reports/e2e-latest.md`.

## Viết kịch bản
`scenarios.py` — mỗi `Turn(say, expect)`; `expect` hỗ trợ `reply_any/reply_all/reply_none`, `tools/no_tools`,
`confirm`, `action`, `state/state_in/until_state`, `judge` (tiêu chí ngôn ngữ tự nhiên do Gemini chấm).
`final(bridge)` kiểm tra hậu quả nghiệp vụ (số lịch thật sự được tạo/hủy). Tag `sim_only` = không chạy ở live.

## Chạy live cần
BE chạy ở cổng 8000 với Redis hợp lệ; DB đã áp migration `Be/prisma/migrations/20260718020000_harden_ai_booking_and_sessions`
(thiếu thì `create_booking_draft` trả 500).
