# Phase 01: Service Boundary and Contracts

## Objective

- Chốt ranh giới rõ ràng giữa `AI/` và `Be/` để implementer không vô tình nhét business logic booking sang Python service.

## Preconditions

- Hiểu current state:
  - chatbot logic đang nằm trong `Be/src/module/chatbot`
  - booking domain nằm trong `Be/src/module/patient/appointment`
  - client chỉ giao tiếp với backend

## Tasks

1. Context
   - Review current chatbot request flow, appointment booking flow, and Stream Chat integration points.
2. Define service ownership
   - `AI/` owns provider routing, session state, policy, agent decisions, prompt/versioning, traces.
   - `Be/` owns users, patient profiles, doctor schedules, booking validation, appointment writes, notifications.
3. Define internal API contracts
   - `POST /internal/ai/chat/sessions`
   - `POST /internal/ai/chat/sessions/{id}/messages`
   - `GET /internal/ai/chat/sessions/{id}`
   - `POST /internal/ai/chat/sessions/{id}/confirm`
   - `POST /internal/ai/chat/sessions/{id}/cancel`
4. Define tool bridge contracts from `AI/` to `Be/`
   - search clinics/services/doctors
   - get doctor availability
   - resolve doctor service
   - resolve patient profile
   - create booking draft
   - confirm booking
   - list upcoming appointments
5. Define schemas
   - `ConversationSession`
   - `AgentDecision`
   - `ToolCall`
   - `ToolResult`
   - `BookingDraft`
   - `PendingConfirmation`
   - `AITrace`
6. Decide error model
   - distinguish `policy_block`, `tool_error`, `provider_unavailable`, `state_conflict`, `confirmation_expired`.

## Verification

- Commands:
  - `rg -n "chatbot|appointment|doctor-availability|createFromDoctorService" Be/src`
  - review generated contract doc artifacts
- Expected results:
  - every mutating business action is still owned by `Be/`
  - every `AI/` action has a typed input/output contract
  - no contract requires raw Stream Chat history as the only source of truth

## Exit Criteria

- Service boundary document is decision-complete.
- Internal chat response shape is fixed.
- Tool bridge list is fixed for V1.
- No ambiguous ownership remains between `AI/` and `Be/`.

