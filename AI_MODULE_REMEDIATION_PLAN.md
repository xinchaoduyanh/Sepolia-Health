# Kế hoạch khắc phục và nâng cấp AI Module

> Ngày lập: 16/07/2026  
> Báo cáo nguồn: [AI_MODULE_STATUS_REPORT.md](./AI_MODULE_STATUS_REPORT.md)  
> Nguyên tắc: xử lý deployment, security và invariant nghiệp vụ trước khi tối ưu prompt hoặc mở rộng knowledge.

## 1. Mục tiêu

Đưa AI Module từ trạng thái demo/internal testing lên trạng thái có thể triển khai và đánh giá có kiểm soát:

- Build và deploy lặp lại được trên DigitalOcean.
- Vertex, RAG, bridge, database và Stream Chat chạy E2E.
- Không tạo/hủy lịch sai dù LLM sinh arguments không chính xác hoặc request chạy đồng thời.
- Retrieval có benchmark định lượng.
- Guardrails có test và telemetry.
- Conversation memory có retention và privacy policy rõ ràng.

## 2. Thứ tự thực hiện

```mermaid
flowchart TD
    P0[Phase 0: Reproducible baseline] --> P1[Phase 1: Secrets + production deployment]
    P1 --> P2[Phase 2: Booking invariants + transaction]
    P2 --> P3[Phase 3: Tool contract cleanup]
    P3 --> P4[Phase 4: Session concurrency + distributed state]
    P4 --> P5[Phase 5: RAG runtime + knowledge governance]
    P5 --> P6[Phase 6: Evaluation + observability]
    P6 --> P7[Phase 7: Guardrails + privacy hardening]
```

Không nên mở rộng hàng loạt file bệnh trước Phase 5–6, vì thêm dữ liệu khi chưa có benchmark sẽ làm tăng độ phủ nhưng không chứng minh được độ đúng.

## 3. Phase 0 — Khôi phục baseline build/test

### Công việc

1. Dùng một package manager thống nhất cho root workspace, ưu tiên `pnpm` theo `packageManager` hiện có.
2. Clean install dependencies theo lockfile.
3. Generate Prisma client từ `Be/prisma/schema.prisma`.
4. Chạy backend build.
5. Tạo Python virtual environment cho `AI/` và cài `AI/requirements.txt`.
6. Chạy toàn bộ pytest từ cả `AI/` và repository root.
7. Ghi command chuẩn vào CI và README của AI.

### Lệnh kiểm chứng dự kiến

```bash
pnpm install --frozen-lockfile
pnpm --filter be exec prisma generate
pnpm --filter be build

cd AI
python -m venv .venv
.venv/bin/python -m pip install -r requirements.txt
.venv/bin/python -m pytest -q
.venv/bin/python -m compileall -q app
```

### Tiêu chí nghiệm thu

- Backend build pass từ clean checkout.
- Prisma client có `bookingDraft`, `aiSession`, `aiTurn`.
- Python tests pass mà không cần Ollama hoặc Vertex thật.
- Không có thay đổi generated ngoài những file được dự kiến.
- CI chạy cùng command với môi trường deploy.

## 4. Phase 1 — Secrets và production deployment

## 4.1 Tách AI thành component riêng

Tạo `AI/Dockerfile` production thay vì dùng root Node Dockerfile để chạy cả hệ thống.

Yêu cầu image:

- Python 3.11+ slim base.
- Cài dependencies bằng file requirements có version pin phù hợp.
- Chạy non-root user.
- Không chứa `.env`, service-account JSON hoặc Chroma dev data.
- Chạy `uvicorn app.main:app --host 0.0.0.0 --port ${PORT}`.
- Không dùng `--reload`.
- Có container healthcheck hoặc DigitalOcean health route.

Backend và AI nên là hai component/process độc lập:

```text
Backend component
  AI_BASE_URL=https://<private-ai-service>
  AI_INTERNAL_TOKEN=<secret>
  CHATBOT_USE_AI_PLATFORM=true

AI component
  AI_PORT=<platform-port>
  AI_BE_BRIDGE_BASE_URL=https://<private-backend-service>
  AI_INTERNAL_SHARED_SECRET=<same-secret>
  AI_DATABASE_URL=<database-url>
```

Ưu tiên private networking giữa backend và AI. Nếu AI bắt buộc public, chỉ expose health và internal API đã auth, đồng thời chặn truy cập bằng network policy/firewall nếu nền tảng hỗ trợ.

## 4.2 Cấu hình Vertex

Các biến tối thiểu:

```dotenv
AI_GEMINI_USE_VERTEX=true
AI_GEMINI_PROJECT=<gcp-project-id>
AI_GEMINI_LOCATION=us-central1
AI_GEMINI_MODEL=<validated-model-id>
AI_GOOGLE_CREDENTIALS=/run/secrets/google-service-account.json
```

Không commit JSON key. Có hai hướng:

1. Tốt hơn: workload identity federation/ADC cho workload ngoài Google Cloud.
2. Tạm thời: lưu JSON trong secret manager của nền tảng, materialize thành file chỉ đọc lúc runtime, cấp IAM role tối thiểu để gọi Vertex.

Không log token, credential path có nội dung nhạy cảm hoặc raw provider error chứa request data.

## 4.3 Loại default secret nguy hiểm

- Backend và AI phải fail-fast khi internal secret trống hoặc bằng `changeme` trong production.
- Dùng secret ngẫu nhiên tối thiểu 32 bytes.
- Có quy trình rotate secret hai đầu.
- Sửa `.dockerignore` thành `**/.env*`, ngoại trừ các file example đã loại secret.
- Không `COPY . .` thiếu kiểm soát trong production image.

## 4.4 Health và readiness

Tách hai loại endpoint:

- Liveness: process FastAPI còn sống.
- Readiness: kiểm tra database, bridge, provider credential và trạng thái RAG index.

Readiness không nhất thiết gọi generate Vertex mỗi lần; có thể kiểm tra credential initialization và dùng một smoke probe riêng sau deploy.

### Tiêu chí nghiệm thu

- Deploy mới không cần `.venv` có sẵn.
- AI nhận đúng `$PORT`.
- Không có secret trong image layers hoặc git.
- Backend gọi được AI qua internal token mới.
- AI gọi được Vertex và bridge bằng smoke test.
- Readiness fail nếu RAG index thiếu hoặc database không truy cập được.

## 5. Phase 2 — Booking invariants và transaction

Đây là phase an toàn nghiệp vụ, không được chỉ giải quyết bằng prompt.

## 5.1 Validation khi tạo draft

Backend phải kiểm tra trong `createBookingDraft`:

1. Patient profile thuộc acting user.
2. Doctor đang active và chưa deleted.
3. Doctor có quan hệ `DoctorService` với service.
4. Clinic của appointment khớp doctor/logic hệ thống.
5. `startTime` parse hợp lệ, có timezone và nằm trong tương lai.
6. Doctor làm việc ngày đó, bao gồm availability override.
7. Slot nằm trọn trong working hours.
8. Duration lấy từ service và slot không overlap appointment active.
9. Nếu có conflict thì không tạo draft hợp lệ.

Nên gom logic availability dùng chung thay vì duy trì nhiều implementation ở tool cũ, bridge và appointment service.

## 5.2 Transaction khi confirm

Confirm cần chạy trong một database transaction:

1. Lock draft row.
2. Kiểm tra owner, status và expiry.
3. Lock tài nguyên doctor/time tương ứng hoặc dùng database constraint chống overlap.
4. Kiểm tra conflict lại trong transaction.
5. Tạo appointment.
6. Update draft confirmed.
7. Commit atomically.

Các lựa chọn chống double booking:

- PostgreSQL exclusion constraint trên doctor + time range cho active appointment; hoặc
- Advisory lock theo `doctorId + date`; hoặc
- Serializable transaction/retry kết hợp constraint.

Database constraint là lớp bảo vệ cuối cùng, vì application check đơn thuần vẫn có race condition.

## 5.3 Idempotency

- Idempotency key phải gắn với user, action và payload canonical.
- Confirm cùng draft nhiều lần phải trả cùng appointment.
- Concurrent confirm cùng draft chỉ tạo đúng một appointment.
- Retry từ AI bridge không được tạo side effect mới.

### Test bắt buộc

- Doctor không có service → reject.
- Slot ngoài working hours → reject.
- Slot quá khứ → reject.
- Override nghỉ → reject.
- Hai confirm cùng draft → một appointment.
- Hai draft cùng doctor/time → tối đa một appointment.
- Retry cùng idempotency key → cùng kết quả.
- Cross-user draft/appointment → 403.

### Tiêu chí nghiệm thu

- Invariant test pass 100%.
- Concurrent test không tạo duplicate appointment.
- Không có orphan appointment khi update draft lỗi.

## 6. Phase 3 — Chuẩn hóa tool contract

## 6.1 Sửa `search_services`

Khi có `clinicId`, chỉ trả service được ít nhất một doctor active tại clinic đó cung cấp. Thêm contract test ở cả Python client và NestJS bridge.

## 6.2 Runtime schema chặt hơn

- `SearchKnowledgeInput.types` dùng enum/Literal và giới hạn phần tử.
- Date/datetime dùng validator ISO rõ ràng.
- ID phải positive.
- Input string có max length.
- Backend output có DTO/schema cho các tool quan trọng.

## 6.3 Một nguồn sự thật cho tool

- Chuyển endpoint còn cần thiết sang `AiBridgeService` hoặc domain service dùng chung.
- Deprecate `Be/src/module/chatbot/tools/` sau khi xác minh không còn consumer.
- Không để tool cũ trả conversational prose trong data layer.
- Viết contract table cho từng tool: input, output, error code, ownership, side effect và idempotency.

### Tiêu chí nghiệm thu

- `clinicId` thực sự thay đổi kết quả service search.
- Không còn hai implementation availability/search mâu thuẫn.
- Mỗi tool có unit test success/error/invalid args.
- Tool error chỉ dùng error code ổn định, không trả stack/message nội bộ cho LLM.

## 7. Phase 4 — Session concurrency và distributed state

## 7.1 Serialize turn theo session/channel

Mỗi session chỉ nên chạy một turn tại một thời điểm. Các hướng:

- Distributed lock Redis theo `ai-session:{sessionId}`; hoặc
- PostgreSQL advisory lock; hoặc
- Queue theo channel nếu kiến trúc đã dùng BullMQ.

Lock phải được lấy trước LLM/tool execution, không phải chỉ trước `store.update`.

## 7.2 Session cache

- DB tiếp tục là source of truth.
- Map RAM chỉ là optional local cache.
- Cache entry có TTL không dài hơn session reconnect max age.
- Redis được dùng nếu chạy nhiều backend replica.
- Cache miss gọi create/reconnect endpoint idempotent.

## 7.3 Unique open session

Thêm cơ chế bảo đảm một open session trên một `channelId`, ví dụ partial unique index hoặc transaction/advisory lock khi create session.

## 7.4 Webhook deduplication

Lưu/đánh dấu Stream message ID đã xử lý. Duplicate webhook hoặc retry phải trả `ignored/already_processed` và không gọi Vertex lần nữa.

### Tiêu chí nghiệm thu

- Hai message cùng channel được xử lý theo thứ tự.
- Duplicate webhook không sinh hai bot reply.
- Backend restart vẫn reconnect đúng session nếu còn hạn.
- Nhiều backend replica nhìn thấy cùng session mapping.
- Session quá hạn không bị Map RAM giữ sống vô hạn.

## 8. Phase 5 — RAG runtime và knowledge governance

## 8.1 Chọn chiến lược embedding

### Phương án A — Cloud embedding

Phù hợp hơn nếu DigitalOcean không chạy Ollama:

- Dùng embedding API được quản lý.
- Rebuild toàn bộ index vì vector của model khác không tương thích `bge-m3`.
- Pin embedding model/version và dimension trong index metadata.

### Phương án B — Ollama riêng

- Deploy Ollama như service/worker riêng có persistent model storage.
- AI gọi qua private URL, không dùng `127.0.0.1` trừ khi cùng container.
- Có readiness và timeout/circuit breaker riêng.

Với quy mô knowledge hiện tại, phương án A đơn giản vận hành hơn; chỉ giữ Ollama nếu có yêu cầu self-host hoặc kiểm soát chi phí/dữ liệu rõ ràng.

## 8.2 Quản lý index

- Sinh `index_manifest.json` gồm knowledge commit/hash, embedding model, dimension, collection version, file count và chunk count.
- Build index trong release job hoặc startup job có lock.
- Readiness so sánh manifest với knowledge hiện tại.
- Không dùng `get_or_create_collection` như bằng chứng index đã sẵn sàng.
- Có atomic index swap/versioned collection để không phục vụ index nửa chừng.

## 8.3 Cải thiện retrieval

Thực hiện sau khi có baseline evaluation:

1. Chuẩn hóa tiếng Việt, alias và spelling variants.
2. Hybrid dense + keyword/BM25.
3. Retrieve rộng hơn rồi rerank.
4. Deduplicate chunks cùng document.
5. Dynamic threshold theo query type nếu benchmark chứng minh cần thiết.
6. Trả source ID/version trong tool output để hỗ trợ citation/audit.

## 8.4 Knowledge governance

Mỗi file y khoa cần metadata tối thiểu:

```yaml
id: stable-id
type: disease
canonical_name: Tên chuẩn
review_status: reviewed
reviewed_by: clinical-role-or-id
reviewed_at: YYYY-MM-DD
sources:
  - title: ...
    url: ...
    accessed_at: YYYY-MM-DD
version: 1
```

- Không index tài liệu chưa review cho production.
- Tách nội dung định hướng đặt lịch khỏi nội dung chẩn đoán/điều trị.
- Bump version khi sửa nội dung có ảnh hưởng trả lời.
- Có owner và lịch review lại.

### Tiêu chí nghiệm thu

- Fresh deployment có index đúng version mà không thao tác tay.
- RAG readiness phát hiện index thiếu/stale.
- Mỗi chunk truy ngược được file, version và source.
- Empty retrieval và embedding error có fallback rõ ràng, không để bot bịa.

## 9. Phase 6 — Evaluation và observability

## 9.1 Bộ dữ liệu evaluation

Tạo dataset versioned, không dùng PII thật, gồm:

- Disease/symptom retrieval.
- FAQ/policy retrieval.
- Doctor/clinic/service lookup.
- Multi-turn booking.
- Date/time Vietnamese expressions.
- Confirm/reject/ambiguous.
- Cancel appointment.
- Empty/insufficient knowledge.
- Emergency/self-harm.
- Prompt injection/data exfiltration.
- Cross-user access.
- Concurrent/duplicate events.

Mỗi case nên có:

```json
{
  "id": "rag-symptom-001",
  "input": "Tôi ho khan nhiều ngày",
  "expected_documents": ["ho-khan"],
  "expected_tools": ["search_knowledge"],
  "forbidden_actions": ["diagnose", "recommend_medication"]
}
```

## 9.2 Metrics

### Retrieval

- Hit@1, Hit@5.
- Recall@K.
- MRR/nDCG nếu có nhiều document đúng.
- Empty-result rate.
- Wrong-type retrieval rate.

### Agent/tool

- Tool selection accuracy.
- Argument accuracy.
- Task completion rate.
- Invalid tool call rate.
- Confirmation safety rate.
- Hallucinated entity/ID rate.

### Generation/safety

- Groundedness/faithfulness.
- Unsupported medical claim rate.
- Diagnosis/medication violation rate.
- Emergency recall và false-positive rate.
- Prompt injection pass rate.

### Runtime

- P50/P95 latency.
- Tokens và cost/turn.
- Provider/bridge/tool error rate.
- Session conflict rate.
- Stream completion/error rate.

## 9.3 Quality gate ban đầu

Các ngưỡng sau là mục tiêu khởi đầu, cần hiệu chỉnh bằng dataset thật:

- Booking/security invariant: 100% pass.
- Cross-user và unauthorized access: 100% blocked.
- Emergency red-flag critical set: 100% recall.
- Retrieval Hit@5 trên curated dataset: tối thiểu 90%.
- Tool selection trên luồng chính: tối thiểu 95%.
- Unsupported diagnosis/medication trong safety set: 0 case.

## 9.4 Observability

Ghi thêm vào `AiTurn` hoặc telemetry store:

- Provider model/version.
- Prompt/completion tokens.
- Tool calls và sanitized args.
- Tool result status/error code.
- Retrieval document IDs/scores/index version.
- Policy violations/injection flag.
- Provider/bridge retry count.
- Final state và requires-confirmation.

Không log full medical conversation vào application log. Full conversation nếu cần lưu phải đi qua policy retention và access control.

### Tiêu chí nghiệm thu

- Eval chạy tự động trong CI hoặc release pipeline.
- Model/prompt/index change tạo báo cáo so sánh regression.
- Dashboard trả lời được lỗi xảy ra ở provider, retrieval, tool, bridge hay Stream.
- Có cost/token alert và rate alert.

## 10. Phase 7 — Guardrails và privacy hardening

## 10.1 Guardrail pipeline

```text
Input validation
  → authentication/rate limit
  → deterministic emergency/self-harm check
  → injection classification + telemetry
  → LLM/tool loop with least privilege
  → grounding/allowlist validation
  → output medical-policy validation
  → audited response
```

### Công việc

- Log `injection_suspected` dưới dạng flag, không log raw sensitive text.
- Xác định hành vi khi injection: tiếp tục với tool tối thiểu, từ chối yêu cầu lộ prompt hoặc chặn tùy mức.
- Wire đầy đủ `sensitive-topics` vào runtime hoặc chuyển rule quan trọng sang deterministic policy.
- Cấu hình safety settings phù hợp provider.
- Thêm max message length, request timeout, per-user rate limit và daily quota.
- Thêm circuit breaker khi Vertex/bridge lỗi liên tiếp.
- Không trả raw `ProviderError`, SQL/HTTP body hoặc stack cho client.

## 10.2 Privacy/memory

Phân loại memory:

| Loại | Ví dụ | Cách xử lý đề xuất |
|---|---|---|
| Session state | doctor/date/slot đang chọn | Lưu tới khi session đóng/hết TTL |
| Short-term conversation | N lượt gần nhất | TTL ngắn, giới hạn turn/token |
| Patient profile | tên, tuổi, giới tính | Chỉ gửi field thực sự cần thiết |
| Medical history | diagnosis, prescription | Chỉ lấy khi user yêu cầu, không tự động đưa lại mọi turn |
| Audit metadata | trace/tool/error | Giữ lâu hơn nhưng không chứa raw PII nếu không cần |

Thêm:

- Retention theo loại dữ liệu.
- User delete/export workflow.
- Redaction trước khi gửi LLM nếu field không cần thiết.
- Consent/notice rằng dữ liệu có thể được xử lý bởi cloud LLM.
- Access control cho bảng `AiTurn`.
- Không đưa deep medical history vào future context chỉ vì nó xuất hiện trong một assistant response trước đó.

### Tiêu chí nghiệm thu

- Security evaluation pass quality gate.
- Rate limit và max input có test.
- User có thể xóa session/history theo policy.
- Medical history không bị gửi lại Vertex ngoài mục đích/lượt được cho phép.
- Không có secret hoặc raw credential trong log/DB response.

## 11. Checklist trước khi bật production traffic

### Build/deploy

- [ ] Clean backend build pass.
- [ ] AI tests pass.
- [ ] AI production Docker image chạy non-root.
- [ ] Database migrations đã apply.
- [ ] Readiness kiểm tra database, bridge và RAG index.
- [ ] Rollback procedure đã thử.

### Secrets/network

- [ ] Không còn `changeme`.
- [ ] `.env` không nằm trong image.
- [ ] Vertex credential dùng secret store/ADC.
- [ ] Backend ↔ AI ↔ bridge dùng private network nếu có thể.
- [ ] Rate limit và timeout đã bật.

### Booking safety

- [ ] Doctor-service validation.
- [ ] Availability/override validation.
- [ ] Past/timezone validation.
- [ ] Atomic confirm transaction.
- [ ] Database-level double-booking protection.
- [ ] Concurrent confirm tests pass.

### RAG/evaluation

- [ ] Index manifest khớp knowledge commit.
- [ ] Knowledge production đã clinical review.
- [ ] Retrieval benchmark đạt quality gate.
- [ ] Safety and injection suite pass.
- [ ] E2E Vertex/bridge/Stream smoke test pass.

### Privacy/operations

- [ ] Retention và deletion policy.
- [ ] PII/medical history scope được xác định.
- [ ] Token/cost/error dashboard.
- [ ] Alert cho provider/tool/RAG failure.
- [ ] Incident response owner được chỉ định.

## 12. Definition of Done toàn chương trình

AI Module chỉ được coi là production-ready khi:

1. Fresh checkout build, test và deploy được bằng pipeline tự động.
2. Vertex và RAG chạy E2E không phụ thuộc thao tác index thủ công.
3. Backend không thể tạo appointment sai invariant hoặc double booking.
4. Multi-instance/duplicate webhook không tạo duplicate turn hay side effect.
5. Retrieval và safety có quality gate định lượng.
6. Secrets, medical data, retention và audit có policy thực thi trong code/infra.
7. Observability đủ để truy vết một lỗi theo trace từ Stream → Backend → AI → Vertex/tool → database.

