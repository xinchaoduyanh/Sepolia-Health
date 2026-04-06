# Implementation Plan: Python AI Platform Service for Sepolia Health

> Created: 2026-04-06 11:18:32
> Status: Draft

## Objective

- Tách AI ra thành service riêng `AI/` đặt ngang hàng `Be/`, `app/`, `web/` để Sepolia Health không còn phụ thuộc vào DigitalOcean Agent.
- Giữ `Be/` làm business control plane, còn `AI/` chịu trách nhiệm inference gateway, agent runtime, session memory, tool orchestration, policy enforcement và observability.
- V1 chỉ tập trung vào `Scheduling Copilot` cho bệnh nhân: tìm dịch vụ, tìm bác sĩ, kiểm tra lịch, tạo booking draft, yêu cầu xác nhận, rồi gọi `Be/` để commit lịch hẹn.

## Scope

- In scope
  - Tạo service mới `AI/` bằng Python cho AI runtime và provider abstraction.
  - Chuẩn hóa contract giữa `Be/` và `AI/`.
  - Di chuyển logic AI khỏi module chatbot gắn cứng với DigitalOcean.
  - Xây `SchedulingAgent` với state machine và session state lưu server-side.
  - Thêm guardrails cho xưng hô, chủ đề nhạy cảm, dữ liệu PHI, tool permission, audit trace.
  - Chuẩn bị kiến trúc để sau này chạy OpenAI/Gemini và self-host `vLLM`.
- Out of scope
  - Fine-tune model, training pipeline, GPU autoscaling production-grade.
  - General medical diagnosis assistant.
  - Voice assistant hoàn chỉnh.
  - OCR/medical imaging.

## Architecture & Approach

- Root structure mục tiêu:
  - `AI/` là Python service độc lập.
  - `Be/` tiếp tục giữ auth, booking, patient profile, doctor schedule, notifications.
  - `app/` và `web/` chỉ gọi `Be/`; không gọi trực tiếp `AI/`.
- Request flow mục tiêu:
  1. Client gửi message vào `Be/`.
  2. `Be/` tạo hoặc lấy AI session, chuyển request sang `AI/`.
  3. `AI/` đọc session state, quyết định intent và next action.
  4. `AI/` gọi tool bridge sang `Be/` để tra cứu hoặc tạo booking draft.
  5. Nếu cần xác nhận, `AI/` trả `requiresConfirmation = true`.
  6. `Be/` chỉ commit booking khi người dùng confirm qua endpoint riêng.
- Chọn Python cho `AI/` vì:
  - thuận lợi nếu sau này thêm `vLLM`, eval pipeline, prompt tooling, RAG, embeddings, batch jobs.
  - tách rõ khỏi business logic NestJS.
- Không chuyển business workflow sang Python:
  - `AI/` không ghi trực tiếp DB nghiệp vụ.
  - `AI/` chỉ dùng tool/API contract để gọi `Be/`.
- Voice/STT:
  - không xem là lõi LLM.
  - thiết kế như capability phụ của `AI/` hoặc service phụ trợ sau này.
  - V1 chỉ cần chuẩn bị extension point, không làm core dependency của scheduling copilot.

## Phases

- [ ] **Phase 1: Service Boundary & Contracts** — Goal: chốt kiến trúc `AI/` riêng, API contract, session schema, trách nhiệm giữa `AI/` và `Be/`.
- [ ] **Phase 2: AI Gateway & Session Runtime** — Goal: dựng Python service skeleton, provider adapters, routing policy, session persistence, observability cơ bản.
- [ ] **Phase 3: Scheduling Agent & Tool Bridge** — Goal: hiện thực `SchedulingAgent`, state machine, tool registry và booking draft flow.
- [ ] **Phase 4: Backend Integration & Compatibility** — Goal: nối `Be/` với `AI/`, giữ compatibility cho chat hiện tại, tách dần khỏi module chatbot cũ.
- [ ] **Phase 5: Governance, RAG Readiness & Voice Extension Points** — Goal: bổ sung policy, moderation, prompt registry, knowledge retrieval readiness, và capability hooks cho STT/TTS.

## Key Changes

- Thêm service mới:
  - `/AI`
- Thêm các nhóm module trong `AI/`:
  - `app/api`
  - `app/agents`
  - `app/gateway`
  - `app/policies`
  - `app/session`
  - `app/tools`
  - `app/observability`
- `Be/` sẽ thêm module integration:
  - AI client adapter gọi sang `AI/`
  - endpoints chat session/confirm/cancel
  - tool bridge endpoints nội bộ cho `AI/`
- Data/API impacts:
  - Thêm AI session schema riêng.
  - Thêm response shape chuẩn cho mỗi chat turn:
    - `message`
    - `sessionState`
    - `proposedAction`
    - `requiresConfirmation`
    - `toolResultsSummary`
    - `traceId`
  - Thêm booking draft payload chuẩn hóa giữa `AI/` và `Be/`.

## Verification Strategy

- Python service
  - service boots locally
  - provider adapters pass contract tests
  - state machine tests cover all transitions
  - prompt/policy tests cover sensitive-response blocking
- Backend
  - `Be/` talks to `AI/` over internal HTTP without leaking business writes to Python
  - booking confirm still uses existing appointment service validations
- Integration
  - vague booking request
  - named doctor flow
  - no slot available
  - confirm then slot conflict
  - user resume existing session

## Dependencies

- New runtime in `AI/`
  - `FastAPI` or `Litestar` for HTTP API
  - `Pydantic` for contracts
  - `SQLAlchemy` or equivalent if session store is in SQL
  - `Redis` for transient session/cache if needed
  - OpenAI-compatible SDK for GPT/vLLM
  - optional Google client for Gemini adapter
- Existing platform dependencies reused
  - `Be/` Prisma-backed business data
  - Redis if chọn session cache / queues
  - existing chat clients in mobile/web via backend

## Risks & Mitigations

- Risk: duplicate business logic giữa `AI/` và `Be/`
  - Mitigation: `AI/` không tự validate booking domain; mọi domain rule đi qua tool/API của `Be/`.
- Risk: latency tăng vì thêm network hop `Be -> AI`
  - Mitigation: chỉ tách inference/orchestration; tool calls giữ gọn, session state có cache, model routing theo workload.
- Risk: contract drift giữa 2 service
  - Mitigation: dùng shared OpenAPI/JSON schema snapshots và contract tests trong CI.
- Risk: AI trả lời vượt scope hoặc sai persona
  - Mitigation: policy middleware, output validation, allowlist tool execution, prompt/version registry.
- Risk: self-host quá sớm làm đội chi phí vận hành
  - Mitigation: giai đoạn đầu vẫn chạy managed model qua abstraction layer.

## Open Questions

- Session state sẽ lưu chính ở DB nào: Postgres riêng cho `AI/` hay Redis + snapshot về Postgres.
- `AI/` có cần queue riêng cho summarization/evals ngay từ đầu hay chỉ cần synchronous runtime.
- Chọn `FastAPI` làm chuẩn hay framework Python khác; mặc định plan này dùng `FastAPI`.

