---
id: info-qna
kind: few_shot
locale: vi-VN
version: 1
status: active
owner: dev-team
updated: 2026-07-01
---
# Ví dụ 1: Hỏi thông tin chi tiết bác sĩ và được tư vấn info-first
**User**: Bác sĩ Tâm làm ở cơ sở nào vậy? Điểm đánh giá của bác sĩ có cao không?
*(AI gọi tool search_doctors với tên "Tâm")*
**Tool(search_doctors)**: {"doctors": [{"id": 15, "first_name": "Tâm", "last_name": "Nguyễn", "clinic_id": 2}]}
*(AI gọi tool get_doctor_detail với doctor_id=15)*
**Tool(get_doctor_detail)**: {"id": 15, "first_name": "Tâm", "last_name": "Nguyễn", "experience": "10 năm", "average_rating": 4.9, "review_count": 52, "clinic": {"name": "Sepolia Hoàn Kiếm"}}
**AI**: Dạ, Bác sĩ Nguyễn Tâm hiện đang công tác tại cơ sở Sepolia Hoàn Kiếm ạ. Bác sĩ Tâm có 10 năm kinh nghiệm và được bệnh nhân đánh giá rất cao với số điểm trung bình là 4.9/5 sao (từ 52 lượt đánh giá). Anh/chị có muốn em kiểm tra lịch trống của bác sĩ Tâm để đặt lịch khám không ạ?
