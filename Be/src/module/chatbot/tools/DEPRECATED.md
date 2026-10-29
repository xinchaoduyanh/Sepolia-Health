# chatbot/tools — DEPRECATED

Bộ tool cũ (trả chuỗi hội thoại, không có `error_code`). AI/ gọi
`ai-bridge/ai-bridge.service.ts` qua `/api/internal/bridge/*`; đó là nguồn sự thật duy nhất cho
search / availability / booking.

Kiểm tra consumer (không còn):

- `app/`, `web/`, `AI/`: không có lời gọi `chatbot/tools/*`.
- `ChatbotService` chỉ inject các tool trong constructor, không gọi `.execute()`.
- Chỉ còn 2 route công khai gọi trực tiếp: `GET /chatbot/tools/doctor-schedule`,
  `GET /chatbot/tools/search-doctors` (đã đánh dấu `deprecated` trong Swagger).

Việc còn lại để xóa hẳn: gỡ 2 route + inject + 5 file `*.tool.ts` sau khi xác nhận không có client
bên ngoài repo gọi (log truy cập production). Không thêm tính năng mới vào thư mục này.
