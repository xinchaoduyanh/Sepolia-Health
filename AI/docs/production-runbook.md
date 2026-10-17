# AI production runbook

## Required deployment order

1. Back up PostgreSQL and check for existing overlapping active appointments.
2. Apply Prisma migrations, including the GiST overlap constraint and open-session index.
3. Build the RAG index in a release job; mount the versioned Chroma directory in the AI component.
4. Deploy AI and wait for `/ready` to return `200`.
5. Deploy backend, verify BullMQ/Redis connectivity, then configure the signed Stream webhook.
6. Run one booking smoke test and one duplicate-webhook test before enabling traffic.
7. Run `python -m eval.run_retrieval --fail-under 0.90` against the release index.

## Required environment

- Backend: `AI_BASE_URL`, strong `AI_INTERNAL_TOKEN`,
  `CHATBOT_USE_AI_PLATFORM=true`, `CHATBOT_ALLOW_DIRECT_PROCESS=false`,
  `AI_SESSION_CACHE_TTL_SECONDS`.
- AI: `AI_ENV=production`, matching `AI_INTERNAL_SHARED_SECRET`,
  `AI_DATABASE_URL`, `AI_BE_BRIDGE_BASE_URL`, Vertex configuration,
  `AI_RAG_REQUIRE_INDEX=true`.

## Incident actions

- Double reply: pause the `stream-ai-message` queue and inspect duplicate job IDs.
- Queue backlog: keep webhook enabled, scale BullMQ workers, and inspect failed jobs.
- Double booking migration failure: stop rollout and resolve existing overlaps; do not drop the constraint.
- Vertex quota/circuit open: disable AI traffic and return the maintenance response; do not switch to an unevaluated model.
- RAG not ready: rebuild the index from the deployed knowledge revision and verify the manifest hash.

## Rollback

Rollback backend and AI images independently. Do not roll back the database migration
that enforces booking/session invariants. Keep API contracts backward-compatible for
one release and retain failed BullMQ jobs for seven days.
