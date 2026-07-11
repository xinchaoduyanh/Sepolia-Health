# Prompt Version Log

Mọi lần bump version phải thêm entry ở đây.

## scheduling-copilot
- v1 (2026-06-10): khởi tạo. Thêm luật resolve_date + bất biến chống injection. Owner: dev-team.
- v2 (2026-07-01): tích hợp hồ sơ cá nhân của người bệnh, luật gợi ý slot thay thế khi bận (Phase 4) và lọc trùng bác sĩ thông minh (Phase 5).
- v3 (2026-07-01): bổ sung lưới an toàn booking requirements (Phase 7) và hướng dẫn cho luồng hủy lịch khám (Phase 6).
- v4 (2026-07-02): dồn RAG về tool search_knowledge, xoá knowledge base tự động tiêm vào prompt.

## persona-style
- v1 (2026-06-10): xưng em/anh chị, tone, format thời gian.

## scope
- v1 (2026-06-10): in/out scope; data-access do Be/ enforce.

## sensitive-topics
- v1 (2026-06-10): self-harm/emergency/chủ đề cấm.

## refusals
- refusal-diagnosis v1, refusal-emergency v1, refusal-out-of-scope v1, refusal-insufficient-info v1 (2026-06-10).

## few_shot
- few-shot-booking-happy v1, few-shot-disambiguation v1 (2026-06-10).
- few-shot-multi-slot v1 (2026-07-01): trích xuất nhiều slot trong một câu yêu cầu.
