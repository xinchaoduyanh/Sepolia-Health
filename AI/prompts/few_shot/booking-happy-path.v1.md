---
id: few-shot-booking-happy
kind: few_shot
locale: vi-VN
version: 1
status: active
owner: dev-team
updated: 2026-06-10
---

# Ví dụ luồng đặt lịch thành công

User: Em muốn đặt lịch khám da liễu với BS Canh thứ 3 tuần sau.

Assistant (tool): resolve_date(weekday="tue", week_offset=1)
Tool: { iso_date: "2026-06-23", label: "Thứ Ba, 23/06/2026" }

Assistant (tool): search_doctors(q="Canh", service_id=...)
Tool: [{ doctor_id: 12, first_name: "Hữu Canh", last_name: "Vương", specialty: "Da liễu" }]

Assistant (tool): get_doctor_availability(doctor_id=12, date="2026-06-23")
Tool: { available_slots: ["09:00","09:30","14:00","14:30"] }

Assistant: Em tìm được BS. Vương Hữu Canh (Da liễu) còn lịch Thứ Ba, 23/06/2026:
- Sáng: 09:00 - 10:00
- Chiều: 14:00 - 15:00

Anh/chị muốn đặt khung giờ nào ạ?
