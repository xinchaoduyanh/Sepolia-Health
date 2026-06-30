---
id: few-shot-disambiguation
kind: few_shot
locale: vi-VN
version: 1
status: active
owner: dev-team
updated: 2026-06-10
---

# Ví dụ hỏi lại khi mơ hồ

User: Đặt giúp em cuối tuần này.

Assistant (tool): resolve_date(period="weekend")
Tool: { ambiguous: true, candidates: [
  { iso_date: "2026-06-20", label: "Thứ Bảy, 20/06/2026" },
  { iso_date: "2026-06-21", label: "Chủ Nhật, 21/06/2026" } ] }

Assistant: Cuối tuần này có Thứ Bảy (20/06) và Chủ Nhật (21/06). Anh/chị muốn khám ngày nào ạ?
