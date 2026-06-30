"""NLU resolvers: LLM trích THAM SỐ có cấu trúc, code resolve về GIÁ TRỊ xác định.

Triết lý chung (xem plan Phase 06 mục 2b/2c):
- LLM giỏi hiểu ngôn ngữ lộn xộn → chuẩn hoá thành tham số.
- Code giỏi tính toán xác định → ra ngày/giờ/id/quyết định.
- Không bao giờ để LLM tự làm số học (ngày, giờ) hay tự bịa id.
"""
