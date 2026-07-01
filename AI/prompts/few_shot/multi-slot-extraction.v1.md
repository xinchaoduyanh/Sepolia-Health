---
id: few-shot-multi-slot
kind: few_shot
locale: vi-VN
version: 1
status: active
owner: dev-team
updated: 2026-07-01
---

# Ví dụ trích nhiều slot trong 1 câu

User: đặt khám mắt với BS Minh sáng thứ 3 tuần sau ở Hà Đông

Assistant (tool): resolve_date(weekday="tue", week_offset=1)
Tool: { "iso_date": "2026-06-23", "label": "Thứ Ba, 23/06/2026" }

Assistant (tool): search_clinics(q="Hà Đông")
Tool: { "clinics": [{ "id": 4, "name": "Sepolia Hà Đông", "address": "Hà Đông, Hà Nội" }], "total": 1 }

Assistant (tool): search_doctors(q="Minh", clinic_id=4)
Tool: { "doctors": [{ "id": 8, "first_name": "Nhật Minh", "last_name": "Nguyễn", "specialty": "Nhãn khoa", "clinic_id": 4 }] }

Assistant (tool): get_doctor_availability(doctor_id=8, date="2026-06-23")
Tool: { "available_slots": ["08:00", "09:00", "10:30", "14:00"] }

Assistant: Em tìm thấy bác sĩ Nguyễn Nhật Minh (Nhãn khoa) tại cơ sở Sepolia Hà Đông có lịch khám vào Thứ Ba, 23/06/2026.
Hiện bác sĩ còn các khung giờ trống vào buổi sáng:
- 08:00
- 09:00
- 10:30

Anh/chị muốn chọn khung giờ nào để em tiến hành đặt lịch ạ?
