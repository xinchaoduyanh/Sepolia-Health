# Phản biện chéo AI Module — Review và Verdict

> Ngày rà soát: 17/07/2026
> Tài liệu được phản biện:
>
> - [AI_MODULE_STATUS_REPORT.md](./AI_MODULE_STATUS_REPORT.md)
> - [AI_MODULE_REMEDIATION_PLAN.md](./AI_MODULE_REMEDIATION_PLAN.md)
> - [AI_MODULE_GAPS_FOR_STANDARD_LLM_DEPLOYMENT.md](./AI_MODULE_GAPS_FOR_STANDARD_LLM_DEPLOYMENT.md)
>
> Phạm vi kiểm chứng: `AI/`, `Be/src/module/chatbot/`,
> `Be/src/module/ai-bridge/`, domain appointment/notification, mobile chat và
> cấu hình deployment trong repository.

## 1. Kết luận điều hành

Tài liệu gap của Grok có giá trị và phát hiện đúng một số vấn đề mà hai tài
liệu gốc chưa mô tả đủ, đặc biệt ở Stream Chat lifecycle, mobile contract,
silent patient-profile fallback, appointment notification và tài liệu vận
hành.

Tuy nhiên, không nên coi toàn bộ nội dung của file Grok là những gap mới:

1. Nhiều mục đã được `AI_MODULE_REMEDIATION_PLAN.md` quy định rõ, gồm booking
   invariant, transaction, idempotency, tool contract, session serialization,
   webhook dedup, RAG manifest, evaluation, rate limit, circuit breaker,
   privacy và production readiness.
2. Một số claim chỉ đúng một phần vì code đã có nền tảng tương ứng.
3. Một số đề xuất là lựa chọn product/operations, không phải bằng chứng code
   hiện đang sai.
4. Có ít nhất hai vấn đề quan trọng cả ba tài liệu chưa nhấn đủ:
   AI booking bypass domain appointment service và webhook trả `200` trước khi
   có durable handoff.

### Verdict tổng thể

| Nhóm | Verdict |
|---|---|
| Stream Chat reliability | Đúng và có phát hiện mới |
| Booking invariant | Đúng về code, nhưng phần lớn đã có trong plan |
| Patient profile, appointment type, notification | Đúng và là bổ sung quan trọng |
| Tool contract | Đúng hướng, phần lớn trùng plan |
| Session/concurrency | Đúng hướng, phần lớn trùng plan |
| Provider lifecycle | Đúng một phần; đánh giá P0 hơi rộng |
| RAG/evaluation | Đúng hướng, phần lớn trùng plan |
| Security/privacy/observability | Checklist tốt nhưng nhiều mục đã có trong plan |
| Frontend/mobile | Tài liệu gốc còn mỏng, nhưng code không phải “gần như chưa có” |
| Learning pack/ADR | Hữu ích nếu mục tiêu là học; không phải production blocker |

## 2. Quy ước verdict

| Nhãn | Ý nghĩa |
|---|---|
| **ĐÚNG — NEW** | Code xác nhận và hai file gốc chưa biến thành work item đủ rõ |
| **ĐÚNG — ALREADY PLANNED** | Code xác nhận nhưng remediation plan đã cover |
| **ĐÚNG MỘT PHẦN** | Có rủi ro thật nhưng claim hoặc mức ưu tiên bị phóng đại |
| **SAI / GÂY HIỂU NHẦM** | Không khớp code hoặc trộn preventive checklist với current defect |
| **OPTIONAL** | Quyết định product/learning/operations, không phải lỗi bắt buộc |

## 3. Những nhận định đúng và nên bổ sung

### 3.1 Streaming có thể để lại message rỗng

**Verdict: ĐÚNG — NEW, P0 cho product path.**

`ChatbotService.processViaAiPlatform` tạo trước một Stream message có
`text: ''`, sau đó cập nhật dần. Khi AI stream lỗi, error handler gửi một
message lỗi mới nhưng không xóa hoặc cập nhật message rỗng ban đầu.

Bằng chứng:

- `Be/src/module/chatbot/chatbot.service.ts:85-109`
- `Be/src/module/chatbot/chatbot.service.ts:470-505`

Hệ quả là người dùng có thể thấy bubble rỗng kèm một bubble lỗi khác.

Nên bổ sung lifecycle rõ ràng:

```text
created/thinking → streaming → completed
                           ↘ failed
```

Message placeholder phải có text/trạng thái hiển thị được và luôn được finalize
thành `completed` hoặc `failed`.

### 3.2 Partial Stream update bị bỏ qua lỗi và có thể chạy đua

**Verdict: ĐÚNG — NEW, P1.**

Lỗi `updateMessage` bị catch rồi bỏ qua. Ngoài ra, SSE parser gọi callback
`onChunk(data.text)` nhưng không `await`, trong khi callback thực hiện
`updateMessage` bất đồng bộ.

Bằng chứng:

- `Be/src/module/chatbot/chatbot.service.ts:95-108`
- `Be/src/module/chatbot/ai-platform-client.service.ts:161-177`

Điều này có thể tạo nhiều update chạy song song hoặc để partial update đến sau
final update. Cần serialize/coalesce update, ghi metric lỗi và bảo đảm final
update thắng.

### 3.3 Bot user được upsert trong hot path

**Verdict: ĐÚNG — NEW, P2.**

Bot được `upsertUser` ở đầu mỗi turn và lặp lại trong error handler:

- `Be/src/module/chatbot/chatbot.service.ts:415-432`
- `Be/src/module/chatbot/chatbot.service.ts:487-505`

Nên chuyển sang setup/deploy job hoặc cache trạng thái setup với cơ chế refresh
có chủ đích.

### 3.4 Silent fallback từ patient profile sai sang SELF

**Verdict: ĐÚNG — NEW, P0 nếu family booking có scope; P1 nếu chỉ SELF.**

Nếu `patientProfileId` không tồn tại hoặc không thuộc acting user, bridge âm
thầm chọn SELF hoặc profile đầu tiên:

- `Be/src/module/ai-bridge/ai-bridge.service.ts:376-399`

Đây không phải fallback an toàn. Một request đặt cho người thân có thể biến
thành lịch của chính chủ mà user không nhận ra.

Nên trả error code phân biệt:

- `patient_profile_not_found`
- `patient_profile_forbidden`
- `family_booking_not_supported`

Nếu product chỉ hỗ trợ SELF, tool không nên nhận `patient_profile_id` do model
tự chọn.

### 3.5 Appointment type bị hard-code OFFLINE

**Verdict: ĐÚNG — NEW, P1 hoặc P0 tùy product scope.**

AI confirm luôn tạo:

```ts
type: 'OFFLINE'
```

Bằng chứng: `Be/src/module/ai-bridge/ai-bridge.service.ts:513-523`.

Cần chốt một trong hai quyết định:

1. AI chỉ đặt lịch offline và phải công bố capability này; hoặc
2. Thêm appointment type vào draft, validate service capability và tạo
   meeting đúng domain flow cho lịch online.

### 3.6 AI booking bỏ qua notification

**Verdict: ĐÚNG — NEW, P1.**

AI bridge tạo appointment trực tiếp nhưng không gửi notification. Luồng
appointment chuẩn gửi notification cho cả patient và doctor:

- AI path: `Be/src/module/ai-bridge/ai-bridge.service.ts:513-530`
- Domain path: `Be/src/module/patient/appointment/appointment.service.ts:1209-1252`

Không nên chỉ copy notification call vào bridge. Nên tái sử dụng cùng domain
command/service để tránh tiếp tục tạo hai nguồn sự thật.

### 3.7 Ops runbook, threat model và environment matrix

**Verdict: ĐÚNG — NEW, P1 cho production-learning.**

Repo chưa có artifact rõ cho:

- Stream Dashboard setup/rotation;
- incident “double reply”, “double book”, “Vertex quota”, “RAG empty”;
- trust-boundary/threat model;
- ma trận local/CI/staging/prod;
- migration/index rollout order.

Các tài liệu này hữu ích cho cả vận hành lẫn mục tiêu học triển khai LLM.

### 3.8 Mobile contract chưa type/version đầy đủ

**Verdict: ĐÚNG — NEW, P1.**

Mobile đang đọc Stream metadata bằng `any` và hỗ trợ cả `.extra` lẫn root:

- `app/components/CustomMessage.tsx:318-339`

Cần schema/version dùng chung cho:

- `requiresConfirmation`
- `resolved`
- `proposedAction`
- `traceId`
- `expiresAt`
- `schemaVersion`

## 4. Những nhận định đúng nhưng đã có trong remediation plan

Các mục dưới đây không nên tạo backlog mới. Chỉ cần bổ sung chi tiết vào phase
đã tồn tại.

| Claim trong file Grok | Đã có trong plan |
|---|---|
| Draft không được tạo khi có conflict | Phase 2, mục 5.1, item 9 |
| Validate DoctorService | Phase 2, mục 5.1, item 3 |
| Timezone/future/working-hours/override | Phase 2, mục 5.1, item 5–8 |
| Atomic confirm và DB constraint | Phase 2, mục 5.2 |
| Idempotency theo user/action/canonical payload | Phase 2, mục 5.3 |
| `search_services(clinicId)` | Phase 3, mục 6.1 |
| Contract table và stable error code | Phase 3, mục 6.3 |
| Deprecate tool cũ | Phase 3, mục 6.3 |
| Serialize turn trước LLM/tool | Phase 4, mục 7.1 |
| Cache TTL và distributed state | Phase 4, mục 7.2 |
| Unique open session | Phase 4, mục 7.3 |
| Webhook dedup | Phase 4, mục 7.4 |
| Index manifest/release build/atomic swap | Phase 5, mục 8.2 |
| Source ID/version và citation support | Phase 5, mục 8.3 |
| Empty retrieval fallback | Phase 5, tiêu chí nghiệm thu |
| Golden/adversarial/concurrent/duplicate dataset | Phase 6, mục 9.1 |
| Retrieval/tool/safety/runtime metrics | Phase 6, mục 9.2 |
| Model/prompt/index regression report | Phase 6, tiêu chí nghiệm thu |
| Safety settings, rate limit, daily quota | Phase 7, mục 10.1 |
| Circuit breaker | Phase 7, mục 10.1 |
| Retention, consent, delete/export, redaction | Phase 7, mục 10.2 |
| Fail-fast secret `changeme` | Phase 1, mục 4.3 |
| Non-root image, readiness, `.dockerignore` | Phase 1 |
| Rollback procedure | Production checklist |
| Trace Stream → BE → AI → tool/DB | Definition of Done |

Kết luận cho nhóm này: Grok xác nhận hướng của plan gốc là đúng, nhưng cách
trình bày “gap bổ sung” làm người đọc dễ hiểu nhầm rằng plan chưa cover.

## 5. Những nhận định chỉ đúng một phần

### 5.1 “Hai ingress gây double reply”

**Verdict: ĐÚNG MỘT PHẦN.**

Backend có cả:

- signed Stream webhook;
- authenticated `POST /chatbot/process`.

Tuy nhiên mobile hiện chỉ gửi AI message qua Stream và có comment rõ để tránh
gọi direct API:

- `app/components/CustomMessageInput.tsx:53-67`
- `app/components/AIWelcomeScreen.tsx:99-106`

Do đó đây là rủi ro kiến trúc/chưa enforce single ingress, chưa phải bằng chứng
code hiện tại luôn tạo double reply.

Đề xuất: giữ webhook làm production ingress; direct endpoint chỉ cho test/debug
và phải tắt hoặc feature-flag trong production.

### 5.2 “Provider abstraction SLA còn thiếu”

**Verdict: ĐÚNG MỘT PHẦN.**

Code đã có:

- `AIProvider` abstraction;
- model router;
- timeout;
- một lần retry cho non-stream provider call và bridge call.

Bằng chứng:

- `AI/app/providers/base.py:29-54`
- `AI/app/providers/gemini_provider.py:185-205`
- `AI/app/tools/be_bridge.py:84-106`

Phần thực sự thiếu:

- circuit breaker runtime;
- fallback policy;
- retry/backoff có jitter;
- streaming retry/cancel semantics;
- SLO và telemetry theo provider.

Không nên mặc định coi fallback model là P0. Trong hệ thống y tế, fail-closed
với maintenance response có thể an toàn hơn tự chuyển sang model chưa qua eval.

### 5.3 “Model ID chưa pin”

**Verdict: ĐÚNG MỘT PHẦN.**

Config dùng ID cụ thể `gemini-2.0-flash`, không dùng chuỗi `latest`:

- `AI/app/config.py:26-36`

Nhưng `AiTurn.model` đang ghi configured model từ `ModelRouter`, không ghi
`modelVersion` thực tế provider trả về. Streaming path cũng không chuyển
provider metadata lên agent.

Nên lưu cả:

```text
requested_model
resolved_model_version
prompt_version
index_version
```

### 5.4 “Frontend/mobile gần như chưa có”

**Verdict: ĐÚNG với tài liệu, SAI nếu áp cho code.**

Code đã có:

- AI welcome screen;
- Stream-only send path;
- confirmation card;
- deterministic confirm/cancel API;
- TTL 10 phút;
- persisted `resolved` state;
- loading/done/error UI.

Bằng chứng:

- `app/components/AIWelcomeScreen.tsx`
- `app/components/CustomMessage.tsx:137-285`
- `app/lib/api/chatbot.ts:22-37`

Phần còn thiếu:

- typed/versioned extra schema;
- nút từ chối rõ ràng trên card;
- error mapping theo `slot_taken`, `draft_expired`, timeout;
- accessibility cho streaming updates;
- product analytics;
- capability copy nói rõ bot không chẩn đoán.

### 5.5 “Không có message size limit”

**Verdict: ĐÚNG MỘT PHẦN.**

Direct `/chatbot/process` giới hạn 2.000 ký tự:

- `Be/src/module/chatbot/dto/process-message.dto.ts:4-14`

Nhưng Stream webhook schema không giới hạn `message.text`, nên ingress chính
chưa enforce cùng policy:

- `Be/src/module/chatbot/dto/process-message.dto.ts:58-86`

### 5.6 “Hit@5 ≥ 90% là threshold ảo”

**Verdict: CẢNH BÁO HỢP LÝ NHƯNG BỊ PHÓNG ĐẠI.**

Plan ghi rõ đây là ngưỡng khởi đầu cần hiệu chỉnh bằng dataset thật. Không nên
xóa metric, nhưng không được tuyên bố đạt chất lượng production chỉ dựa trên
một dataset nhỏ hoặc được thiết kế quá dễ.

## 6. Những nhận định sai hoặc gây hiểu nhầm

### 6.1 “Thiếu structured output cho tool args”

**Verdict: SAI.**

Tool đã dùng:

1. Pydantic input models;
2. JSON schema;
3. Gemini function declarations;
4. runtime validation trước khi execute.

Bằng chứng:

- `AI/app/tools/schemas.py:95-126`
- `AI/app/providers/gemini_provider.py:39-51`
- `AI/app/tools/registry.py:92-100`

Promise-regex và CJK-strip là workaround cho chất lượng natural-language
output, không phải vá JSON tool arguments.

Hai workaround này vẫn nên có metric hit-rate và kế hoạch loại bỏ sau khi đổi
model/eval, nhưng không chứng minh tool calling thiếu structured output.

### 6.2 “Cần test DST cho GMT+7”

**Verdict: GÂY HIỂU NHẦM TRONG SCOPE VIỆT NAM.**

Nếu sản phẩm chỉ chạy theo giờ Việt Nam, cần test:

- ISO datetime bắt buộc có offset;
- chuyển đổi UTC ↔ UTC+7;
- biên ngày/tháng/năm;
- slot gần nửa đêm;
- server chạy ở timezone khác.

Không cần dựng DST test trừ khi sản phẩm mở rộng sang timezone có daylight
saving time.

### 6.3 “Embedding PII là current defect”

**Verdict: SAI NẾU GỌI LÀ LỖI HIỆN HỮU; ĐÚNG NẾU LÀ GUARDRAIL PHÒNG NGỪA.**

Indexer hiện chỉ scan knowledge markdown và không có path embed conversation
vào Chroma:

- `AI/app/rag/indexer.py:85-118`
- `AI/app/rag/retriever.py:22-58`

Vẫn nên ghi invariant “không index transcript/PII”, nhưng không nên báo cáo như
một data leak đang xảy ra.

### 6.4 “Cost ceiling chưa có work item”

**Verdict: SAI VỀ TÀI LIỆU, ĐÚNG VỀ CODE HIỆN TẠI.**

Remediation plan đã có:

- per-user rate limit;
- daily quota;
- token/cost telemetry;
- cost alert.

Code chưa triển khai các mục này, nhưng không thể gọi là plan bỏ sót.

### 6.5 “Warning changeme là chưa đủ nên hai file gốc sai”

**Verdict: SAI VỀ PLAN.**

Code hiện chỉ warning, đúng là chưa đủ production. Nhưng plan đã yêu cầu
fail-fast khi production secret rỗng hoặc bằng `changeme`, nên đây là
implementation gap đã được nhận diện, không phải critique mới.

### 6.6 “Phase 5–7 enterprise-full”

**Verdict: OPTIONAL / SUBJECTIVE.**

Plan gốc đặt mục tiêu production-ready nên Phase 5–7 không sai. Nếu timeline là
2–4 tuần, nên tạo milestone `production-learning v1` nhỏ hơn thay vì loại bỏ
guardrails, evaluation hoặc privacy.

## 7. Gap quan trọng cả ba tài liệu chưa chỉ ra đủ

### 7.1 AI booking bypass domain appointment service

**Mức độ: P0.**

AI bridge gọi `prisma.appointment.create` trực tiếp. Trong khi domain
`AppointmentService.createFromDoctorService` còn thực hiện:

- validate DoctorService;
- validate clinic active;
- validate service hỗ trợ ONLINE/OFFLINE;
- validate target gender;
- validate min/max age;
- conflict check;
- tạo Zoom meeting cho online;
- tạo billing;
- gửi notification cho patient;
- gửi notification cho doctor.

Bằng chứng:

- AI path: `Be/src/module/ai-bridge/ai-bridge.service.ts:488-530`
- Domain path:
  `Be/src/module/patient/appointment/appointment.service.ts:1052-1258`

Nếu tiếp tục vá từng rule vào `AiBridgeService`, hai luồng sẽ tiếp tục drift.
Hướng đúng là tách một domain command dùng chung, ví dụ:

```text
AppointmentBookingDomainService.confirmDraft(...)
```

Command này phải chạy invariant + transaction + billing/outbox một lần cho mọi
consumer, gồm mobile, receptionist và AI.

### 7.2 Webhook ack trước durable handoff

**Mức độ: P0 cho Stream reliability.**

Controller gọi `processMessageAndReply(...).catch(...)` rồi trả `{status:
'ok'}` ngay:

- `Be/src/module/chatbot/chatbot.controller.ts:135-142`

Nếu process/container chết sau response `200`, Stream có thể coi event đã xử lý
trong khi turn chưa được lưu hoặc chạy.

Webhook dedup đơn thuần chỉ chống duplicate; nó không chống mất event. Cần
durable inbox/queue:

```text
verify signature
  → insert StreamInbox(message_id, payload_minimized) atomically
  → return 200
  → worker claim event
  → process AI turn
  → mark completed / retry / dead-letter
```

### 7.3 Idempotency key hiện có collision và confirm key bị bỏ qua

**Mức độ: P0 cùng booking transaction.**

Create-draft key hiện hash:

```text
session_id + start_time + doctor_id
```

Nó bỏ qua patient profile và service. Cùng session/doctor/time nhưng đổi người
khám hoặc dịch vụ có thể tái sử dụng draft cũ:

- `AI/app/tools/registry.py:88-90`
- `AI/app/tools/registry.py:134-139`

Ngoài ra AI gửi confirm idempotency key nhưng Nest controller không chuyển key
vào service:

- `AI/app/tools/be_bridge.py:143-144`
- `Be/src/module/ai-bridge/ai-bridge.controller.ts:153-160`

Nên chuẩn hóa:

```text
sha256(actor_user_id, action, canonical_payload, contract_version)
```

và lưu idempotency record/result ở backend source of truth.

### 7.4 Trace ID chưa bắt đầu từ ingress

**Mức độ: P1.**

Trace hiện được tạo trong AI `_run_turn`, sau webhook và Nest orchestration:

- `AI/app/api/chat.py:123-138`

Vì vậy chưa thể trace đầy đủ thời gian webhook queueing, session lookup,
placeholder creation và Stream update.

Nên tạo correlation ID tại webhook, truyền qua:

```text
Stream event → inbox/job → Nest → AI → bridge → DB/outbox → Stream extra
```

## 8. Cách hợp nhất hợp lý vào remediation plan

Không nên append nguyên văn toàn bộ file Grok. Nên cập nhật plan theo mapping
sau:

### Phase 1.5 — Stream ingress và reply lifecycle

1. Chọn webhook là ingress production duy nhất.
2. Durable inbox + dedup theo `message.id`.
3. Worker retry/dead-letter.
4. Placeholder lifecycle không để message rỗng.
5. Serialize/coalesce partial update.
6. Trace ID tạo từ ingress.
7. Stream Dashboard/runbook.

### Mở rộng Phase 2 — Booking domain truth

1. Không silent fallback patient profile.
2. Chốt offline-only hay online.
3. Tái sử dụng domain appointment command.
4. Bao gồm clinical validation, billing và notification.
5. Sửa idempotency scope và confirm key.
6. Transaction + database constraint + outbox.

### Mở rộng Phase 3 — Contract

1. Versioned tool contract.
2. Python ↔ Nest schema parity test.
3. Versioned Stream `extra` schema.
4. Error catalog dùng chung AI/BE/mobile.

### Mở rộng Phase 6–7 — Operations

1. Provider/model/prompt/index resolved versions.
2. Threat model.
3. Incident runbook.
4. Env matrix và release gate matrix.
5. Accessibility và funnel analytics.

ADR/learning pack nên là deliverable song song, không chặn các P0 booking và
Stream reliability.

## 9. Thứ tự ưu tiên đề xuất

| Thứ tự | Công việc | Lý do |
|---:|---|---|
| 1 | Khôi phục build/test baseline | Không có verification thì mọi sửa đổi đều khó tin cậy |
| 2 | Domain command dùng chung cho confirm booking | Chặn lịch sai, thiếu billing và side-effect drift |
| 3 | Transaction + DB double-booking protection | Chặn duplicate appointment |
| 4 | Sửa patient-profile fallback và idempotency | Chặn đặt sai người/tái dùng draft sai |
| 5 | Durable Stream inbox + dedup | Chặn cả duplicate lẫn mất message |
| 6 | Sửa Stream message lifecycle | Chặn bubble rỗng/race update |
| 7 | Single ingress + session serialization | Chặn double turn và side effect sau conflict |
| 8 | Production container/secrets/readiness/RAG index | Đưa hệ thống lên staging lặp lại được |
| 9 | Golden eval + E2E smoke + telemetry | Đo được đúng/sai và định vị lỗi |
| 10 | Runbook/threat model/ADR/mobile refinement | Hoàn thiện production-learning vòng 1 |

## 10. Kết luận cuối

1. Giữ file Grok như một checklist bổ sung là hợp lý.
2. Không merge nguyên văn toàn bộ backlog vì nhiều mục đã tồn tại trong plan.
3. Những bổ sung có giá trị nhất là Stream reply lifecycle, patient-profile
   fallback, appointment type, domain notification/billing, mobile schema,
   runbook và threat model.
4. Những mục cần sửa nhãn là provider abstraction, model pinning, frontend
   completeness, message limit và Hit@5 threshold.
5. Những claim nên loại hoặc viết lại là “thiếu structured output”, DST cho
   scope Việt Nam, embedding PII như current defect, và “cost ceiling chưa có
   work item”.
6. Trước khi triển khai Phase 5–7, phải làm xanh E2E booking với domain
   invariant và Stream durable ingress; nhưng không được bỏ evaluation,
   guardrails hoặc privacy nếu mục tiêu cuối vẫn là production.

## 11. Trạng thái kiểm chứng

- Đã đọc và đối chiếu ba tài liệu với code hiện tại.
- Đã kiểm tra Stream webhook, AI streaming, session store, bridge booking,
  appointment domain service, notification service, RAG và mobile UI.
- `python3 -m pytest -q` trong `AI/` chưa chạy được vì môi trường hiện tại chưa
  cài `pytest`, phù hợp với kết quả đã ghi trong status report.
- Tài liệu này là phản biện/định hướng; chưa thay đổi code hoặc xác nhận E2E với
  Vertex, Stream Dashboard hay credential thật.
