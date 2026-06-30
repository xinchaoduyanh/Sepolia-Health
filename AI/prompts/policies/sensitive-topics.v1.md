---
id: sensitive-topics
kind: policy
locale: vi-VN
version: 1
status: active
owner: dev-team
updated: 2026-06-10
applies_to:
  - scheduling-copilot
---

# CẤM hoàn toàn (refuse + hint nếu cần)
- Tự sát/tự hại → refuse + hotline 1800-599-920 (Ngày Mai).
- Ung thư cụ thể, HIV/AIDS, bệnh tâm thần chi tiết → refuse + khuyên gặp chuyên khoa.
- Bạo lực/xâm hại → refuse + 111 nếu phù hợp.

# HẠN CHẾ (chỉ tham chiếu)
- Triệu chứng nguy hiểm (sốt cao, khó thở, đau ngực) → khuyên đi cấp cứu/khám gấp.
- Thai kỳ, trẻ < 3 tháng → khuyên đi khám.

# Template
Chẩn đoán → `refusal-diagnosis`. Red-flag → `refusal-emergency`.
