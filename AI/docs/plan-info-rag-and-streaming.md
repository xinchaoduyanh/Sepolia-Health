# Implementation Plan — Hỏi đáp thông tin (RAG/cơ sở/bác sĩ) & Streaming

Tiếp nối `plan-memory-and-personalization.md`. Mục tiêu: mở RAG cho FAQ/policy (đang
"chết"), làm giàu dữ liệu cơ sở & bác sĩ, cho phép lượt thuần hỏi-đáp, và stream câu trả
lời từng chữ. Tận dụng Gemini để "tìm thông tin mượt như hỏi lễ tân am hiểu".

Ký hiệu: 🔜 làm · ⏳ tùy chọn · ⚠️ điểm rủi ro.

---

## Phase A — RAG thành **tool**, mở FAQ/Policy 🔜 (giá trị cao nhất)

**Vấn đề hiện tại:** `knowledge/faq/*` và `knowledge/policy/*` đã index nhưng **không bao giờ
truy hồi được** vì `handle_turn` chỉ gọi retriever qua cổng từ khóa `_is_symptom_query` +
`filter_types=["disease","symptom"]`. Câu hỏi thủ tục/chính sách → bot trả lời chay/bịa.

**Cách làm:** biến RAG thành tool để Gemini tự quyết khi nào tra & tra loại gì.

- **AI** `tools/schemas.py`: `SearchKnowledgeInput { query: str, types: list[str] }`
  (validate `types` ⊂ `{disease, symptom, faq, policy}`).
- **AI** `tools/registry.py`:
  - `ToolRegistry.__init__` nhận thêm `retriever` (như `resolve_date` chạy local, không qua bridge).
  - Spec `search_knowledge` — mô tả: "Tra cứu kiến thức: bệnh/triệu chứng → gợi ý chuyên khoa;
    thủ tục/chính sách đặt–huỷ–đổi lịch". Allowed states `{IDLE, COLLECTING, CANDIDATE, SLOT}`.
  - `_run`: gọi `retriever.retrieve(query, top_k=5, filter_types=types, allowed_only=True)`,
    trả `{chunks: [{canonical_name, type, text, score}]}` (DATA-only).
- **AI** `agents/scheduling_agent.py`: giữ cổng auto-symptom hiện tại như **lưới an toàn y tế**
  (vẫn prefetch disease/symptom), nhưng FAQ/policy đi qua tool. Output vẫn qua
  `post_validator` + `KnowledgePolicy` như cũ.
- **Prompt**: rule — câu hỏi thủ tục/chính sách/bệnh → gọi `search_knowledge` trước khi trả lời;
  KHÔNG bịa quy trình.

**Test:** hỏi "thủ tục đặt lịch"/"chính sách huỷ" → agent gọi `search_knowledge(types=["faq"/"policy"])`
và chunk xuất hiện trong context; giữ chặn chẩn đoán.

---

## Phase B — Làm giàu dữ liệu **cơ sở** 🔜

"Hỏi thông tin cơ sở" = structured data, KHÔNG phải RAG.

- **BE** `ai-bridge.service.ts::searchClinics`: thêm `phone, email, description` vào payload
  (hiện chỉ `id/name/address`).
- **BE** endpoint mới `GET /clinics/:id` → `getClinicDetail(clinicId)`: thông tin cơ sở +
  danh sách dịch vụ/chuyên khoa có tại cơ sở + số bác sĩ.
- **AI** tool `get_clinic_detail(clinic_id)` (schemas + registry + be_bridge + HttpBridgeClient).
- ⚠️ **Giới hạn dữ liệu:** schema KHÔNG có "giờ mở cửa theo cơ sở" (giờ làm gắn theo
  `DoctorAvailability`). Prompt phải nói rõ khi user hỏi giờ mở cửa cơ sở → trả "phụ thuộc lịch
  từng bác sĩ", không bịa.

**Test:** `search_clinics` trả phone/description; `get_clinic_detail` trả dịch vụ + số bác sĩ.

---

## Phase C — Hỏi-đáp **bác sĩ** phong phú 🔜

`DoctorProfile` có `experience`, nhiều `specialties`, `services` nhưng `searchDoctors` chỉ trả
`specialties[0]`, bỏ `experience`/services.

- **BE** `searchDoctors`: thêm `experience`, **tất cả** chuyên khoa, danh sách dịch vụ (id/name/price).
- **BE** endpoint mới `GET /doctors/:id` → `getDoctorDetail(doctorId)`: hồ sơ đầy đủ (kinh nghiệm,
  chuyên khoa, dịch vụ+giá, cơ sở) + **điểm đánh giá trung bình** (aggregate `Feedback` qua
  `Appointment.doctorId`) + số lượt đánh giá.
- **AI** tool `get_doctor_detail(doctor_id)` (schemas + registry + be_bridge + HttpBridgeClient),
  allowed states `{IDLE, COLLECTING, CANDIDATE}`.
- Kết quả `get_doctor_detail` cũng nạp vào `last_offered` (đã có cơ chế) để đặt tiếp mượt.

**Test:** `search_doctors` có experience + nhiều chuyên khoa; `get_doctor_detail` có rating trung bình.

---

## Phase D — Lượt "thuần hỏi đáp" (info-first) 🔜 (chỉ prompt)

Agent hiện booking-centric. Cho phép trả lời thông tin trước, gợi ý đặt lịch sau.

- **Prompt** `scheduling-copilot.v1.md`: section "Chế độ hỏi đáp thông tin":
  - Câu hỏi về bác sĩ/cơ sở/thủ tục → dùng `get_doctor_detail`/`get_clinic_detail`/`search_knowledge`,
    **trả lời đủ ý trước**, rồi mới nhẹ nhàng hỏi có muốn đặt lịch không.
  - Được tổng hợp nhiều nguồn (data cơ sở + chi tiết bác sĩ + FAQ) thành 1 câu tự nhiên.
- **Prompt** `few_shot/info-qna.v1.md`: 1 ví dụ hỏi thông tin bác sĩ → trả lời rồi mời đặt lịch.

**Test:** câu hỏi thông tin thuần → không ép vào luồng đặt lịch, có mời đặt cuối câu.

---

## Phase E — Streaming câu trả lời từng chữ 🔜 (mượt "cảm giác")

Hai đầu đều hỗ trợ: Gemini `streamGenerateContent?alt=sse`; Stream Chat qua
`partialUpdateMessage` → event `message.updated`.

### E.1 Provider (AI)
- `providers/base.py`: thêm `chat_stream(...) -> AsyncIterator[str]` (yield delta text).
- `providers/gemini_provider.py`: gọi `:streamGenerateContent?alt=sse` bằng `httpx.AsyncClient.stream`,
  parse SSE, yield `parts[].text`. Cùng auth (`x-goog-api-key`). Non-stream giữ nguyên cho tool-loop.

### E.2 Agent (AI)
- `handle_turn` nhận optional `stream_callback: Callable[[str], Awaitable[None]]`.
- **Chỉ stream lượt CUỐI** (iteration không còn `tool_calls`). Các lượt tool-calling vẫn chờ.
- ⚠️ **Validator theo câu:** buffer tới hết câu (`. ! ? \n`) → chạy `post_validator`/`KnowledgePolicy`
  trên câu → mới `stream_callback(câu)`. Nếu câu vi phạm → thay bằng refusal, dừng stream.
  (Chốt cứng emergency/self-harm vẫn an toàn vì `pre_filter` chạy trước LLM.)

### E.3 API (AI)
- Endpoint mới `POST /chat/sessions/{id}/messages/stream` trả **SSE**: emit các delta câu, rồi 1
  event cuối chứa metadata đầy đủ (`proposed_action`, `requires_confirmation`, `session_state`).
- Vẫn `store.update` + `record_turn` như thường sau khi hoàn tất.

### E.4 BE (NestJS)
- `ai-platform-client.service.ts`: `streamMessage(userId, channelId, message, onDelta, onDone)` đọc SSE từ AI.
- `chatbot.service.ts`:
  1. `sendMessage` placeholder rỗng của bot → lấy `message.id`.
  2. Tích luỹ delta, **throttle** `partialUpdateMessage(id, {set:{text}})` mỗi ~200ms / ~30 token
     (⚠️ tránh dội rate-limit Stream Chat).
  3. Update cuối: set text đầy đủ + `extra` (proposedAction, requiresConfirmation, traceId...).
- Giữ typing heartbeat cho tới khi delta đầu tiên tới.

### E.5 Cấu hình & fallback
- `config.py` (AI) `streaming_enabled: bool = False`; BE `CHATBOT_STREAMING=true`.
- Nếu tắt hoặc provider không hỗ trợ → dùng luồng non-stream hiện tại (không đổi hành vi cũ).

**Test:** parse SSE Gemini (fixture) → ghép đúng text; agent emit theo câu; câu vi phạm bị chặn
giữa stream; BE throttle không update quá dày (đếm số lần update trong mock).

---

## Thứ tự đề xuất
1. **A** (mở FAQ/policy — đang chết) 
2. **C** (enrich bác sĩ) → **B** (enrich cơ sở)
3. **D** (prompt info-first — chỉ prompt, khoá lại trải nghiệm hỏi đáp)
4. **E** (streaming — tách riêng vì đụng cả AI provider/API + BE Stream Chat)

## Nguyên tắc xuyên suốt (giữ như trước)
- Tool **DATA-only**; ownership qua `actingUserId`; PII y tế (chẩn đoán/đơn thuốc) chỉ qua tool on-demand.
- RAG output luôn qua `post_validator` + `KnowledgePolicy`; KHÔNG chẩn đoán.
- Streaming KHÔNG được bỏ qua validator — buffer theo câu trước khi emit.
- Mỗi đổi prompt: bump version + cập nhật `_version-log.md`.
