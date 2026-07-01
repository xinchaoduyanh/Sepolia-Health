# Implementation Plan — Trí nhớ hội thoại, Session bền & Cá nhân hóa AI

Mục tiêu: tận dụng Gemini 2.5 Flash để chatbot đặt lịch **nhớ ngữ cảnh**, **không hỏi lại
thông tin đã biết**, **bền qua restart**, và **cá nhân hóa** theo hồ sơ + lịch sử khám của
người dùng. Kèm các case nâng chất lượng phản hồi.

Ký hiệu: ✅ đã xong · 🔜 làm tiếp · ⏳ tùy chọn.

---

## Phase 0 — Nền trí nhớ (✅ ĐÃ XONG, đã merge & test 96/96)

- Conversation memory: nhồi `ai_history_max_turns` (mặc định 6) lượt gần nhất từ bảng
  `AiTurn` vào prompt Gemini — `store.list_recent_turns`, `chat.py::_run_turn`,
  `scheduling_agent.handle_turn(history=...)`.
- `last_offered`: sau mỗi tool trả list (bác sĩ/dịch vụ/cơ sở/slot) → map ra `OfferedItem`
  (kèm id thật) lưu vào session, render vào prompt qua `{{LAST_OFFERED}}` để resolve
  "bác sĩ thứ 2 / slot 19h".
- Doctor search đa token ở BE (`ai-bridge.service.ts::searchDoctors`) — tên đầy đủ khớp.
- Prompt rule: 1 bác sĩ → dùng luôn; nhiều → liệt kê; rỗng → báo không thấy.

> Việc dọn còn lại: xoá **1 trong 2** block `{{LAST_OFFERED}}` trùng trong
> `prompts/system/scheduling-copilot.v1.md` (đang lặp ở 2 mục).

---

## Phase 1 — Session bền qua restart 🔜 (ưu tiên: đang mất trí nhớ khi BE restart)

**Vấn đề:** map `channel → session_id` chỉ nằm trong RAM của BE
(`AiPlatformClient.sessionByChannel`). BE restart → cache trống → tạo `session_id` mới →
mất toàn bộ lịch sử (dù row `AiSession`/`AiTurn` cũ vẫn còn trong DB, không ai trỏ lại).

### Hướng A — DB lookup theo channelId (khuyến nghị, không thêm hạ tầng)

`AiSession` đã có cột `channelId`. Dùng DB làm nguồn sự thật.

- **AI** `session/store.py` + `postgres_store.py`: thêm
  `get_open_by_channel(channel_id) -> SessionState | None`
  (query `AiSession WHERE channelId = ? AND closedAt IS NULL ORDER BY createdAt DESC LIMIT 1`).
- **AI** `api/chat.py`: endpoint `POST /chat/sessions` — trước khi tạo mới, nếu có
  `channel_id` và tồn tại session mở → **trả session cũ** thay vì tạo mới (idempotent theo channel).
- **BE** `ai-platform-client.service.ts`: giữ cache RAM như lớp nhanh, nhưng khi miss thì
  gọi createSession (đã idempotent theo channel ở trên) — tự nhiên nối lại session cũ.

### Hướng B — Redis (chọn nếu chạy nhiều BE instance / muốn TTL phiên)

- **BE**: thay `Map` bằng Redis `channel:{id} -> session_id`, TTL ví dụ 24h.
  Thêm `ioredis`, config `REDIS_URL`. Cache-aside: miss → tạo/tra session → set key.
- Vẫn nên kèm Hướng A làm fallback bền (Redis mất key ≠ mất session).

**Quyết định:** làm **A** trước (đủ fix bug, miễn phí). Redis là lớp tăng tốc/scale thêm sau.

**Test:** tạo session với channelId → “restart” (xoá cache) → gọi lại → cùng session_id,
`list_recent_turns` vẫn thấy lịch sử cũ.

---

## Phase 2 — Cá nhân hóa theo hồ sơ + lịch sử khám 🔜 (giá trị cao)

Dữ liệu đã có: `PatientProfile` (+`healthDetailsJson`), `Appointment.notes`,
`AppointmentResult` (`diagnosis`/`notes`/`prescription`/`recommendations`),
`Prescription`/`PrescriptionItem`, `Feedback`.

Thiết kế **hybrid** để cân bằng token & riêng tư:

### 2.1 Header tĩnh (nhẹ, không nhạy cảm) — nạp mỗi lượt
- **BE bridge** `GET /api/internal/bridge/patients/{userId}/summary`: trả
  `{ full_name, age, gender, default_clinic, last_visit: { date, doctor_name, specialty } }`.
  KHÔNG gồm chẩn đoán/đơn thuốc.
- **AI**:
  - `SessionState` thêm field `patient_summary: dict | None` (cache trong session).
  - `handle_turn`: nếu `patient_summary is None` → gọi bridge 1 lần → lưu.
  - `scheduling-copilot.v1.md`: thêm `{{PATIENT_CONTEXT}}` (tên/tuổi/cơ sở hay khám/lần khám gần nhất).
- Mở khóa: "đặt như lần trước", gợi ý chủ động "Lần trước anh khám Da liễu với BS X, đặt lại nhé?".

### 2.2 Lịch sử sâu (nhạy cảm) — chỉ qua tool khi user hỏi
- **BE bridge** `GET /api/internal/bridge/patients/{userId}/history?limit=5`: N lần khám gần
  nhất kèm `AppointmentResult` (diagnosis/notes/recommendations) + tóm tắt đơn thuốc.
  Enforce `actingUserId` (ownership).
- **AI** tool mới `get_patient_history`:
  - `tools/schemas.py`: `GetPatientHistoryInput { user_id }`.
  - `tools/registry.py`: spec, allowed states `{IDLE, COLLECTING, BOOKED, FAILED}`.
  - `tools/be_bridge.py`: method + `HttpBridgeClient`.
  - Model tự gọi khi user hỏi "lần trước bác sĩ dặn gì / tôi tái khám được chưa".

### Ràng buộc bắt buộc
1. **Riêng tư:** header KHÔNG chứa chẩn đoán/đơn thuốc (chúng chỉ load qua tool 2.2 khi user
   chủ động hỏi) — hạn chế đẩy PII y tế lên Gemini cloud.
2. **Scope:** bot KHÔNG chẩn đoán. Lịch sử chỉ để **gợi ý đặt lịch/tái khám**. Giữ
   `post_validator` + `knowledge_policy`; thêm rule prompt nêu rõ điều này.
3. **Ownership & đúng hồ sơ:** 1 user quản nhiều `PatientProfile` (gia đình, có `managerId`/
   `relationship`). Enforce `actingUserId`; xác định đặt cho **ai** (self/con) trước khi nạp.

**Test:** FakeBridge trả summary/history → assert prompt có `{{PATIENT_CONTEXT}}`; tool
`get_patient_history` gọi đúng; ownership chặn cross-user.

---

## Phase 3 — Trích nhiều slot trong 1 câu 🔜 (cắt số lượt hội thoại)

"đặt khám mắt với BS Minh sáng thứ 3 tuần sau ở Hà Đông" → Gemini trích **một lần** cả
chuyên khoa + bác sĩ + ngày + buổi + cơ sở, gọi tool tuần tự thay vì hỏi từng cái.

- **Prompt** `prompts/few_shot/`: thêm few-shot `multi-slot-extraction.v1.md` minh họa 1 câu →
  nhiều tool call (`resolve_date` → `search_clinics` → `search_doctors` → `get_doctor_availability`).
- Không đổi code (loop tool đã hỗ trợ nhiều iter). Chỉ prompt.

**Test:** kịch bản 1 câu đủ thông tin → agent ra thẳng draft/slot, không hỏi lại.

---

## Phase 4 — Gợi ý slot thay thế khi giờ mong muốn bận ⏳

`getDoctorAvailability` đã trả **cả list slot trống**. Hiện chỉ báo "không có 9h".

- **Prompt**: rule — nếu giờ user muốn không có, chủ động đề xuất 2–3 slot gần nhất trong ngày
  ("9h kín rồi, gần nhất có **8h30** hoặc **10h**, anh/chị chọn nhé?"). Không đổi code.

---

## Phase 5 — Disambiguation thông minh ⏳

Khi trùng tên / nhiều bác sĩ: dùng cái **đã biết** (cơ sở/chuyên khoa) để lọc trước rồi mới hỏi.

- **Prompt**: rule — nếu đã biết cơ sở, truyền `clinic_id` vào `search_doctors` để thu hẹp;
  chỉ hỏi khi vẫn còn nhiều.

---

## Phase 6 — Luồng đổi / huỷ lịch (reschedule / cancel) ⏳ (khoảng trống tính năng)

`proposed_action` đã khai báo `cancel_booking`/`reschedule` nhưng **chưa có tool thực thi**.

- **BE bridge**: `cancel_appointment(appointmentId)` + (tùy) reschedule = cancel + rebook.
- **AI**: tool `cancel_appointment` (+ dùng `get_my_upcoming_appointments` để chọn lịch),
  state machine bổ sung nhánh huỷ. Giữ **confirm deterministic** cho cả huỷ (chốt an toàn).
- Case: "đổi lịch khám mai sang thứ 5" → upcoming → xác nhận huỷ → đặt lại.

---

## Phase 7 — Lưới an toàn cho hội thoại dài ⏳

Khi convo > `ai_history_max_turns`, slot đã biết rơi khỏi history verbatim.

- Wire `booking_requirement` (đang bỏ trống): sau mỗi lượt lưu slot đã biết
  (specialty/doctor/date/service); render "Đã biết / Còn thiếu" vào prompt → không hỏi lại dù dài.

---

## Thứ tự đề xuất

1. Phase 0 cleanup (xoá block `{{LAST_OFFERED}}` trùng)
2. **Phase 1A** (session bền — fix bug mất trí nhớ khi restart)
3. **Phase 3 + 4 + 5** (chỉ prompt/few-shot, rủi ro thấp, impact lớn)
4. **Phase 2** (cá nhân hóa)
5. Phase 6 (đổi/huỷ lịch)
6. Phase 7 (lưới an toàn) — nếu vẫn thấy hỏi lặp

## Nguyên tắc xuyên suốt
- **KHÔNG** giao `confirm_intent` (chốt đặt/huỷ) cho LLM — giữ deterministic.
- Tool luôn **DATA-only**; ownership qua `actingUserId`, không tin LLM.
- PII y tế nhạy cảm chỉ load **on-demand qua tool**, không nhồi mặc định vào prompt.
- Mỗi thay đổi prompt: bump version + cập nhật `_version-log.md` nếu tạo file mới.
