# Phase 02: AI Gateway and Session Runtime

## Objective

- Dựng Python service skeleton và runtime foundation để AI có thể hoạt động độc lập với DigitalOcean.

## Preconditions

- Phase 01 contracts đã được chốt.

## Tasks

1. Create service skeleton
   - Add root folder `AI/`.
   - Initialize Python project structure with lockfile, env config, app entrypoint, test layout, and Dockerfile.
2. Implement API layer
   - Expose REST endpoints matching Phase 01 contracts.
   - Add request/response validation with typed schemas.
3. Implement provider abstraction
   - Define `AIProvider` base interface.
   - Implement `OpenAICompatibleProvider` first.
   - Reserve adapter slots for `GeminiProvider` and `VllmProvider`.
4. Implement model routing
   - Add route policy by workload:
     - `decision`
     - `response`
     - `summarization`
   - Add timeout, retry, fallback order, and circuit breaker state.
5. Implement session runtime
   - Persist session state server-side.
   - Store latest structured state plus recent turn summaries.
   - Keep transient cache separate from durable session state if Redis is used.
6. Implement observability foundation
   - `traceId` per turn
   - provider latency
   - model used
   - token/cost counters
   - tool execution timing
7. Add policy middleware hooks
   - preprocess user message
   - validate candidate response
   - block or rewrite disallowed output

## Verification

- Commands:
  - Python service unit tests for providers and schemas
  - local boot check for `AI/`
  - smoke requests against all chat session endpoints
- Expected results:
  - service starts without DigitalOcean config
  - provider fallback works under simulated primary failure
  - session state is created and loaded consistently across turns

## Exit Criteria

- `AI/` can accept chat turns and persist sessions.
- `AI/` can call at least one managed model provider through abstraction.
- Observability emits structured traces for every turn.
- No business booking logic is implemented inside the gateway/runtime layer.

