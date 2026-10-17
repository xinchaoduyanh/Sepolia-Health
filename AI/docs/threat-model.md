# AI trust boundaries and threat model

## Boundaries

`Mobile (untrusted) → Stream (signed external transport) → Backend (business truth)
→ AI service (probabilistic orchestrator) → Vertex/Ollama and DATA-only bridge`.

## Main threats and controls

| Threat | Control |
|---|---|
| Forged webhook | Verify Stream signature over raw bytes before queueing |
| Duplicate/lost webhook | Durable BullMQ job; deterministic job ID; retry/backoff |
| Cross-user access | Channel ownership and `X-Acting-User-Id` pinned from authenticated session |
| LLM-created invalid booking | Backend clinical/service/clinic checks plus DB overlap constraint |
| Prompt injection | Deterministic detection, least-privilege tools, no confirm tool exposed to model |
| Secret/PII leakage | Redacted tool audit, no raw payload logging, retention/delete workflow |
| Provider outage/cost storm | Timeout, retry, circuit breaker, rate limit and maintenance response |
| Stale/empty RAG | Manifest hash/model/count readiness gate |

Full transcripts are medical data. Application logs must contain identifiers and
sanitized status fields only, not raw message text.

