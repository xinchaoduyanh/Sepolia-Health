# AI Module — Gap Analysis bổ sung (chuẩn triển khai LLM, không chỉ demo)

> Ngày lập: 2026-07-17  
> Bổ sung cho:
> - [AI_MODULE_STATUS_REPORT.md](./AI_MODULE_STATUS_REPORT.md) — hiện trạng  
> - [AI_MODULE_REMEDIATION_PLAN.md](./AI_MODULE_REMEDIATION_PLAN.md) — kế hoạch khắc phục  
> Mục tiêu tài liệu: chỉ ra **những gì 2 file trên còn thiếu / chưa đủ sắc** nếu muốn:
> 1. Hoàn thiện **chức năng AI** (Stream Chat ↔ NestJS ↔ AI Python ↔ Bridge ↔ DB)  
> 2. Học và áp dụng **cách triển khai một dự án LLM chuẩn** (production-minded), không dừng ở demo hội đồng  

Tài liệu này **không thay** 2 file gốc. Nó là lớp *gap / critique / standard LLM checklist*.  
Có thể đưa cho Claude Code / Codex phản biện chéo.

---

## 0. Cách đọc tài liệu này

| Ký hiệu | Ý nghĩa |
|--------|---------|
| **Đã có trong 2 file** | Report/Plan đã cover đủ hướng |
| **Thiếu / mỏng** | Có nhắc nhưng chưa đủ depth hoặc chưa thành work item |
| **Chưa có** | Không thấy trong 2 file (hoặc chỉ 1 dòng) |
| **P0 / P1 / P2** | Mức ưu tiên nếu mục tiêu = “LLM deploy chuẩn + học production” |

**Nguyên tắc học triển khai LLM chuẩn:**

```text
Model/prompt ≠ product boundary
Tool result ≠ business truth
Streaming UX ≠ reliability
Unit test ≠ evaluation
Deploy script ≠ platform
Observability ≠ “có log”
Privacy ≠ “có internal token”
```

---

## 1. Tóm tắt verdict về 2 file gốc

### 1.1 Điểm mạnh (giữ nguyên)

- Phân tầng P0–P7 hợp lý; **không** bắt đầu bằng “sửa prompt”.
- Nhấn **booking invariant + race condition** — đúng core an toàn.
- Boundary AI ↔ bridge DATA-only, ownership, webhook signature — nhận diện đúng.
- RAG “có code ≠ có quality”; secret default; dual tool stack — đúng.

### 1.2 Hạn chế chính (lý do cần file này)

| Hạn chế | Hệ quả nếu chỉ follow 2 file |
|---------|------------------------------|
| Nghiêng **backend/AI service**, mỏng **Stream Chat product path** | Chat “chạy” nhưng double-reply, empty bubble, fail messy |
| Nghiêng **platform deploy**, mỏng **contract E2E & ops runbook** | Build được image nhưng on-call không biết fail ở đâu |
| Remediation **enterprise-full** (Phase 5–7) | Dễ plan đẹp / ship chậm; thiếu “minimum standard LLM bar” |
| Ít **learning map** (khái niệm chuẩn ngành ↔ chỗ nào trong repo) | Học được “list bug” hơn là “khung triển khai LLM” |
| Thiếu một số **failure mode LLM agent** đã lộ trong code | Promise-regex, silent profile fallback, hard-code OFFLINE… |
| Chưa có **Definition of Done** theo persona (demo / staging / production-learning) | Không biết lúc nào “đủ chuẩn để học xong vòng 1” |

---

## 2. Bản đồ chức năng AI end-to-end (để thấy chỗ 2 file chưa “chốt”)

```text
[Mobile Stream client]
    │ connectUser + token (Be/chat)
    │ send message → Stream
    ▼
[Stream Chat Cloud]
    │ webhook message.new (signed)
    ▼
[Be ChatbotController]
    │ verify signature, ownership ai-consult-{userId}
    │ (async) processMessageAndReply
    ▼
[Be ChatbotService + AiPlatformClient]
    │ empty bot message → SSE stream AI → updateMessage
    │ final extra: requiresConfirmation / sessionId / traceId
    ▼
[AI FastAPI /internal/ai/...]
    │ session store (Postgres) + agent loop
    │ tools → HttpBridgeClient
    ▼
[Be AiBridge]
    │ DATA-only + acting user
    │ draft / confirm / search / availability
    ▼
[PostgreSQL]
    │
    └── (song song) RAG: embedding + Chroma + knowledge markdown
```

**2 file gốc cover tốt:** AI service, bridge, booking, RAG, eval, privacy (một phần).  
**Còn mỏng:** nửa trên (Stream client ↔ webhook ↔ stream update) và **ops/contract** quanh cả pipeline.

---

## 3. Gap theo lớp — những gì cần bổ sung

### 3.1 Stream Chat product path (THIẾU NHIỀU NHẤT so với 2 file)

Status/Plan có architecture diagram và Phase 4 webhook dedup, nhưng **chưa đủ** để chức năng chat AI “chuẩn”.

| Gap | Hiện trạng code (tóm tắt) | Chuẩn LLM/product cần | Ưu tiên |
|-----|---------------------------|------------------------|---------|
| **Webhook dedup** | Không lưu `message.id` đã xử lý | Idempotent consumer: `processed_stream_message_ids` (Redis/DB TTL) | **P0** |
| **Single ingress** | Vừa webhook public vừa `POST /chatbot/process` | Document + enforce 1 đường chính; path kia chỉ debug hoặc feature-flag | **P0** |
| **Empty/partial message** | `sendMessage({ text: '' })` rồi throttle update 300ms | Typing-only hoặc placeholder rõ; final atomic; handle mid-stream fail | **P0** |
| **Stream rate / error swallow** | Partial `updateMessage` ignore error | Retry/backoff; metric `stream_partial_update_fail`; không để user kẹt bubble | **P1** |
| **Typing heartbeat vs real progress** | Heartbeat 8s + stream text | Phân biệt “đang nghĩ” vs “đang gõ câu trả lời” (UX + debug) | **P2** |
| **Bot upsert mỗi turn** | `upsertUser` bot trong hot path | Setup-once + versioned bot profile | **P2** |
| **Confirmation card resolve** | Có `resolveConfirmationCards` (tốt) | Contract FE–BE–Stream `extra` schema versioned; test multi-device | **P1** |
| **Client reconnect / offline** | App ChatContext connect/disconnect | Spec: mất mạng giữa confirm, token refresh fail, multi-tab | **P1** |
| **Non-AI channels** | Webhook ignore non `ai-consult-*` | Explicit matrix: doctor chat, clinic chat, AI chat — ai được bot join | **P1** |
| **Stream app config** | Nằm ngoài repo (Dashboard) | Runbook: webhook URL, events, secret rotation, bot role | **P0** (ops) |

**Bổ sung vào plan gốc:** tạo **Phase 1.5 — Stream reliability** (hoặc kéo dedup + single ingress lên trước Phase 5 RAG).

---

### 3.2 Business invariants & agent side-effects (CÓ trong plan — cần bổ sung edge case)

Plan Phase 2 đã đúng hướng. Còn **thiếu edge cases** sau (đã lộ trong code review):

| Gap | Vì sao quan trọng với “LLM chuẩn” | Ưu tiên |
|-----|-----------------------------------|---------|
| **Draft vẫn tạo khi đã có `conflicts`** | LLM/user vào confirm rồi fail → mất trust | **P0** |
| **Silent fallback `patientProfileId` → SELF** | Family booking sai người im lặng | **P0** (nếu có multi-profile) / **P1** |
| **Không validate DoctorService** | Tool args schema-ok nhưng nghiệp vụ-sai | **P0** |
| **Confirm hard-code `type: 'OFFLINE'`** | Online/video scope sẽ bug im | **P1** (ghi rõ product decision) |
| **Timezone contract** | Bridge dùng GMT+7 hardcode nhiều chỗ | Spec ISO + offset bắt buộc; test DST/biên ngày | **P1** |
| **Idempotency key scope** | Key có gắn user + payload canonical chưa đủ formal | Spec: hash(user, action, canonical_json) | **P1** |
| **Cancel / reschedule path** | Plan nhắc; depth kém create/confirm | Cùng mức invariant + test concurrent | **P1** |
| **Money/price display** | `estimatedPrice` từ service; promotion? | Rule: AI không tự giảm giá; bridge tính | **P2** |
| **Appointment notification sau AI book** | Không thấy trong 2 file như work item | Sau confirm: notify doctor/patient qua hệ thống hiện có | **P1** |

**Bài học LLM chuẩn:** mọi side-effect (tạo draft, tạo appointment, gửi Stream message) phải:

1. Authorized  
2. Validated ở **source of truth** (DB/BE)  
3. Idempotent  
4. Atomic (hoặc compensating)  
5. Auditable (`trace_id` + actor + payload sanitized)

---

### 3.3 Tool contract & dual stack (CÓ — thiếu “contract table sống”)

Plan Phase 3 đúng. Còn thiếu form **vận hành**:

| Gap | Cần bổ sung |
|-----|-------------|
| **Contract table versioned** | 1 file (OpenAPI hoặc markdown) mỗi tool: input/output/error_code/side_effect/idempotent/owner |
| **Schema parity tests** | Python Pydantic input ↔ Nest DTO ↔ JSON example — CI fail nếu drift |
| **Error code catalog** | Ổn định, documented, FE/AI map được (không raw exception) |
| **Deprecation checklist** | `chatbot/tools/*` xóa khi? endpoint nào còn public? |
| **`search_services(clinicId)`** | Đã nêu; thêm regression test “clinic A ≠ clinic B” |
| **Tool least privilege theo state** | Đã có registry; cần test: state X không được list tool Y |
| **Human-in-the-loop tools** | confirm/cancel không expose cho model — giữ; thêm audit khi button FE bypass text | 

---

### 3.4 Session, concurrency, memory (CÓ — thiếu “agent turn model”)

Plan Phase 4 đúng (lock trước LLM, unique open session, cache TTL). Bổ sung:

| Gap | Chuẩn LLM agent cần |
|-----|---------------------|
| **Turn = unit of work** | 1 user message → tối đa 1 agent turn active / session; queue hoặc 409 |
| **Optimistic lock sau side-effect** | Plan đã nêu; cần **compensate** nếu tool đã chạy rồi 409 | 
| **History window policy** | `ai_history_max_turns=6` — thiếu: token budget, summarization trigger, drop tool dumps |
| **Long-term memory** | Chưa có (và có thể không cần); nếu thêm: explicit, user-visible, deletable |
| **Session end reasons** | booked / handoff / expired / user_reset / admin_purge — enum + metric |
| **Multi-device same user** | 2 phone 1 channel: turn serialize thế nào |
| **Replay / debug a turn** | Load `AiTurn` + tool summary → recreate (không re-run side effect) |

---

### 3.5 Model provider layer (MỎNG trong 2 file)

2 file nói Vertex/Gemini/Ollama nhưng **chưa đủ** cho “standard LLM platform”:

| Gap | Chuẩn cần | Ưu tiên |
|-----|-----------|---------|
| **Provider abstraction SLA** | Timeout, retry, circuit breaker, fallback model | **P0** |
| **Model routing policy** | Decision model vs response model vs cheap classifier — document & config | **P1** |
| **Pinned model IDs** | Không “latest” im lặng; version trong `AiTurn` | **P0** |
| **Prompt + model version coupling** | Đổi model ⇒ chạy eval gate | **P1** |
| **Safety settings Gemini** | Status đã nêu thiếu; cần config + test | **P1** |
| **Cost ceiling / budget per user/day** | Chưa có work item rõ | **P1** |
| **Streaming cancel** | User gửi tin mới giữa stream → abort provider + tool | **P1** |
| **Structured output** | Tool args JSON mode / schema; giảm regex bandaid | **P1** |
| **Bandaid detection** | Promise-regex, CJK strip — document as tech debt, có metric hit rate | **P2** |

**Bài học:** production LLM app quản **model lifecycle** giống dependency: pin, changelog, rollback.

---

### 3.6 RAG & knowledge (CÓ Phase 5 — thiếu “product RAG bar”)

| Gap | Ghi chú |
|-----|---------|
| **Product decision: RAG scope** | Bot là “đặt lịch + FAQ” hay “tư vấn y khoa”? Quyết định này **khóa** knowledge governance |
| **Refusal when empty retrieval** | Plan có fallback; cần UX copy chuẩn + không bịa |
| **Citation trong Stream message** | Source id/version trong `extra` hoặc footer — audit/học |
| **Index build in CI** | Artifact index + checksum; deploy kéo artifact (không build ad-hoc trên prod) |
| **Embedding PII** | Không embed hội thoại user vào Chroma nhầm |
| **Multilingual VN** | Tone dấu, viết tắt, teencode — test set riêng |
| **Eval tối thiểu học được** | 30–50 golden queries Hit@5 **trước** hybrid/rerank (tránh premature optimization) |

---

### 3.7 Evaluation (CÓ Phase 6 — thiếu “pyramid” và gate thực dụng)

Bổ sung kim tự tháp eval (2 file liệt kê metric nhưng chưa xếp tầng vận hành):

```text
L0  Contract / invariant tests (100% — block merge)
L1  Offline agent tests (fake provider) — đã có hướng
L2  Golden set tool+RAG (CI nightly hoặc pre-release)
L3  Shadow / staging E2E với model thật (manual + semi-auto)
L4  Online metrics (prod): empty retrieval, tool error, confirm fail, cost
```

| Gap | Cần |
|-----|-----|
| **Release gate matrix** | Model/prompt/index/tool schema change → gate nào bắt buộc |
| **Regression baselining** | Lưu score theo git SHA + model id |
| **Adversarial set** | Injection, “ignore previous”, exfil other user, force confirm | 
| **Human eval protocol** | Rubric 1–5: helpful / safe / grounded / booking success |
| **Stream E2E harness** | Không chỉ pytest unit: mock Stream webhook → BE → AI → bridge |

---

### 3.8 Guardrails, security, privacy (CÓ — thiếu “threat model” 1 trang)

| Gap | Nội dung nên bổ sung |
|-----|----------------------|
| **Threat model** | Actor: user, attacker webhook forge, SSRF via tool URL?, prompt injection, insider log access |
| **Trust boundaries diagram** | Mobile untrusted → Stream semi-trusted → BE trusted → AI semi-trusted → Vertex external |
| **Rate limit matrix** | Per user / IP / channel / bot reply / Vertex token |
| **Message size limits** | Max chars; reject/truncate policy |
| **PII in prompts** | Patient name/age/history gửi Vertex — consent + minimize fields |
| **Retention** | TTL `AiTurn`, export/delete API, admin access |
| **Audit log vs chat log** | Tách: security audit ≠ full transcript |
| **Secret rotation drill** | Internal token 2 đầu; Stream secret; GCP SA |
| **Dependency supply chain** | Pin Python/Node deps; no silent major upgrades on AI stack |

---

### 3.9 Observability & incident response (MỎNG)

Status/Plan có field telemetry; thiếu **ops playbook**:

| Gap | Cần |
|-----|-----|
| **RED/USE metrics** | Rate, errors, duration cho: webhook, AI turn, each tool, confirm |
| **Trace propagation** | `trace_id` từ webhook → BE → AI → bridge → `AiTurn` → Stream `extra` |
| **Structured log fields** | channelId, userId, sessionId, traceId, model, tool, error_code — **không** full text prod |
| **Alert rules** | confirm_fail_rate, provider_5xx, empty_retrieval spike, secret=changeme boot |
| **Incident runbook** | “Bot double reply”, “slot double book”, “AI 404 session”, “Vertex quota” |
| **Kill switch** | `CHATBOT_USE_AI_PLATFORM=false` + maintenance message; feature flag per % users |
| **Cost dashboard** | tokens/day, cost/successful booking |

---

### 3.10 Deployment & environment (CÓ Phase 0–1 — thiếu multi-env matrix)

| Gap | Cần |
|-----|-----|
| **Env matrix** | local / CI / staging / prod: URL, secrets, models, RAG index, Stream app |
| **AI Dockerfile + compose** | Plan có; thêm health/readiness, resource limits, non-root |
| **Migration order** | Prisma migrate + AI schema tables + index job |
| **Config validation on boot** | Fail-fast: secret, DB, bridge URL, model pin |
| **Backout plan** | Rollback AI image; keep BE compatible (API version) |
| **Data seed staging** | Fake clinics/doctors/slots — không prod data |
| **`.dockerignore` / secret scan** | Plan có; thêm pre-commit gitleaks-class check |

---

### 3.11 Frontend / mobile AI UX (GẦN NHƯ CHƯA CÓ trong 2 file)

Chức năng AI “đủ” không chỉ Python service:

| Gap | Cần |
|-----|-----|
| **`extra` schema** | `requiresConfirmation`, `resolved`, `proposedAction`, `traceId`, TTL |
| **Confirm/Cancel buttons** | Gọi BE deterministically; disable khi resolved/expired; optimistic UI |
| **Error states** | AI down, timeout, slot_taken, draft_expired — copy tiếng Việt |
| **Welcome / capability** | AIWelcomeScreen: bot làm được gì / không làm gì (y khoa) |
| **Accessibility** | Screen reader cho streaming text updates |
| **Analytics** | Funnel: open AI chat → ask → tool → confirm → booked |

---

### 3.12 Documentation & learning curriculum (CHƯA CÓ — quan trọng với mục tiêu học)

2 file = status + remediation. Thiếu **“standard LLM project map”** để học có chủ đích:

| Chủ đề học | Map sang repo | Artifact nên có |
|------------|---------------|-----------------|
| Trust boundaries | webhook, JWT, internal token, acting user | Threat model 1 trang |
| Tool-calling agent | `scheduling_agent`, registry | Sequence diagram 1 turn |
| Deterministic safety | `confirm_intent`, policies | “Why not LLM-confirm” ADR |
| RAG pipeline | knowledge → index → retrieve → prompt | Index manifest |
| Eval harness | tests + future golden | Dataset schema + 1 scorecard |
| Online serving | Stream stream path | Latency budget diagram |
| Config/secrets | `AI_*`, `CHATBOT_*` | Env catalog |
| Change management | prompt/model/index | Release checklist |

Gợi ý ADR tối thiểu (Architecture Decision Records):

1. AI service tách khỏi NestJS  
2. DATA-only bridge  
3. Confirm 2 bước deterministic  
4. Stream là transport, BE là orchestrator  
5. Vertex vs Ollama embedding decision  
6. Không cho model tự `confirm_booking`

---

## 4. Những claim / hướng trong 2 file cần “siết” trước khi coi là xong

| Chủ đề | Rủi ro nếu follow máy móc |
|--------|---------------------------|
| Phase 5–7 full enterprise | Over-engineering trước khi E2E booking xanh |
| Hit@5 ≥ 90% ngay | Threshold ảo nếu dataset chưa có / seed knowledge mỏng |
| “Architecture tốt” Stream path | Dễ chủ quan; reliability chat vẫn yếu |
| Unit test AI pass | Không chứng minh Vertex + Stream + race |
| Idempotency draft | Không thay atomic confirm |
| Warning `changeme` | Cần fail-fast prod, không chỉ log |

---

## 5. Minimum bar — “LLM project chuẩn (vòng học 1)” vs “Demo hội đồng”

Dùng bảng này để **không ảo tưởng** và **không under-build**.

### 5.1 Demo hội đồng (tối thiểu sống sót)

- [ ] 1 luồng: hỏi → tìm bác sĩ/slot → draft → confirm → appointment DB  
- [ ] Ownership không cross-user (demo 2 account)  
- [ ] Webhook ký + AI channel đúng user  
- [ ] Secret không `changeme` trên máy demo public  
- [ ] 5–10 câu y khoa seed có trả lời + refusal chẩn đoán  
- [ ] Slide có architecture + limitation trung thực  

### 5.2 Standard LLM deploy (vòng học 1 — khuyến nghị làm thật)

- [ ] **P0 invariants:** draft validation + confirm transaction + concurrent test  
- [ ] **P0 stream:** webhook dedup + single ingress + không empty-fail messy  
- [ ] **P0 platform:** AI container riêng, readiness, env catalog, fail-fast secrets  
- [ ] **P0 contract:** error_code catalog + `clinicId` đúng + deprecate dual tools path  
- [ ] **P1 eval:** 30–50 golden cases (tool + safety + booking) chạy offline/CI  
- [ ] **P1 obs:** trace_id end-to-end + 5 metric cốt lõi + 3 alert  
- [ ] **P1 privacy:** retention TTL + “gửi Vertex field nào” documented + consent copy  
- [ ] **P1 runbook:** 4 incident (double reply, double book, provider down, empty RAG)  
- [ ] **ADR × 6** (mục 3.12)  
- [ ] **Kill switch** feature flag  

### 5.3 Production healthcare-grade (vòng sau — không bắt buộc để “học xong”)

- Clinical content review, legal, full hybrid RAG, online eval, formal DPIA, SLA multi-region, red-team định kỳ…

---

## 6. Backlog bổ sung đề xuất (ghép vào Remediation Plan)

Có thể append như **Phase 1.5 / 2.5 / 8** hoặc checklist ngang hàng.

### Phase A — Stream Chat reliability (NEW)

1. Bảng/Redis `stream_event_dedup(message_id)`  
2. Chọn 1 ingress chính; lock path kia  
3. Sửa streaming message lifecycle (no empty stuck)  
4. Trace_id vào Stream message `extra`  
5. Runbook Stream Dashboard  

### Phase B — Booking truth (mở rộng Phase 2)

1. Reject draft khi conflict / invalid slot / invalid doctor-service  
2. Explicit error khi `patientProfileId` invalid (không silent SELF — hoặc flag product)  
3. `$transaction` + constraint/lock  
4. Notification hook sau book  
5. Product decision online vs offline  

### Phase C — LLM platform basics (NEW, cắt từ Phase 6–7)

1. Model pin + provider timeout/circuit breaker  
2. Cost/rate limit per user  
3. Abort on new message  
4. Metric bandaid (promise nudge, CJK strip)  
5. Kill switch  

### Phase D — Learning pack (NEW)

1. ADR folder `docs/ai/adr/`  
2. Env catalog `docs/ai/env-catalog.md`  
3. One-turn sequence diagram  
4. Golden dataset v0 (30 cases)  
5. Scorecard template sau mỗi lần đổi prompt/model  

---

## 7. Gợi ý cách dùng Claude / Codex phản biện chéo

Khi đưa 3 file cho model khác review, hỏi theo template:

```text
Bạn là staff engineer review hệ thống LLM đặt lịch + Stream Chat.

Input:
1) AI_MODULE_STATUS_REPORT.md
2) AI_MODULE_REMEDIATION_PLAN.md
3) AI_MODULE_GAPS_FOR_STANDARD_LLM_DEPLOYMENT.md (file này)

Nhiệm vụ:
- Chỉ ra claim sai / overclaim / underclaim so với code (đường dẫn file cụ thể)
- Xếp lại top 10 việc theo ROI nếu mục tiêu = học triển khai LLM chuẩn trong 2–4 tuần
- Tìm gap mà CẢ 3 file đều bỏ sót
- Không propose prompt-only fixes cho business invariant
- Output: bảng disagreement + patch list
```

**Tiêu chí chấm phản biện tốt:**

- Có path file + đoạn logic, không generic  
- Tách demo vs production-learning  
- Có risk nếu không làm  
- Không phình scope healthcare-grade nếu không yêu cầu  

---

## 8. Liên kết nhanh trong repo

| Thành phần | Path gợi ý |
|------------|------------|
| AI service | `AI/app/` |
| Agent | `AI/app/agents/scheduling_agent.py` |
| RAG | `AI/app/rag/` |
| Policies | `AI/app/policies/` |
| Chatbot + Stream webhook | `Be/src/module/chatbot/` |
| AI platform client | `Be/src/module/chatbot/ai-platform-client.service.ts` |
| Bridge DATA-only | `Be/src/module/ai-bridge/` |
| Old tools (dual stack) | `Be/src/module/chatbot/tools/` |
| Mobile chat | `app/contexts/ChatContext.tsx`, `app/components/CustomMessage*.tsx` |
| Status | `AI_MODULE_STATUS_REPORT.md` |
| Plan | `AI_MODULE_REMEDIATION_PLAN.md` |

---

## 9. Kết luận

1. **2 file gốc đủ tốt** làm status + remediation trục backend/AI/RAG/security.  
2. **Chưa đủ** nếu mục tiêu là: chức năng AI chat hoàn chỉnh + **học triển khai LLM chuẩn**.  
3. Gap lớn nhất để bổ sung: **Stream reliability**, **edge-case booking truth**, **provider lifecycle**, **obs/runbook**, **FE contract**, **learning ADRs**, và **minimum bar** tách demo / standard / healthcare-grade.  
4. Làm xong **§5.2** là đã có một vòng học production-minded đàng hoàng — không cần đợi full Phase 7.

---

## Unresolved product questions (cần owner chốt)

1. Family booking (đặt cho người thân) có in-scope chính thức không?  
2. AI chỉ OFFLINE hay cả video/online?  
3. Ingress chính: chỉ Stream webhook hay FE cũng `POST /chatbot/process`?  
4. Knowledge: FAQ đặt lịch hay tư vấn y khoa có review lâm sàng?  
5. Target deploy: single VPS / DigitalOcean App Platform / k8s?  
6. Timeline học: 2 tuần / 1 tháng / song song viết báo cáo?

---

*File này cố ý viết để bị phản biện. Nếu Claude/Codex chỉ ra gap mới, merge vào §3 hoặc §6 với ngày + nguồn review.*
