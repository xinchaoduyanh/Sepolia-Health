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


## Guardrail status vs code (Phase 7 review)

| Control | Where | Status |
|---|---|---|
| Self-harm / emergency block before LLM | `app/policies/pre_filter.py` (+ `rag/emergency.py` red flags) | Done; VN diacritic/telex tests in `tests/test_policies_coverage.py`. `tu tu`/`tu sat` only match when the whole message is unaccented (avoids "từ từ"); unaccented "tu tu" is intentionally blocked (safety over recall). |
| Violence / abuse | `pre_filter` reason `violence_abuse` → `refusal-safety-abuse` (113/111/115), before the LLM; self-harm and emergency take priority | Done; false positives like "giết muỗi", "đánh trống ngực" tested. |
| Injection | `pre_filter` flags only (`injection_suspected`), never hard-blocks; tools pinned to session user, no confirm tool exposed | Done. Patterns include EN/VN override phrases, role tags, internal header names. |
| Output medical policy | `app/policies/post_validator.py` | Diagnosis assertions (questions/conditionals exempt), medication/dosage, code fence, secret/prompt leak (token patterns, DB URLs). |
| Guard telemetry | `app/observability/guards.py` → `guard_triggered` log event + in-process counters (`guards.snapshot()`) | Rule labels only, no user text. Not yet exported to a metrics backend. |
| PII redaction | `app/observability/redact.py`: phone, CCCD/CMND, email | Applied to all `log_event` fields and to `AiTurn` message/tool audit before `record_turn`. Side effect: conversation history reloaded from `AiTurn` contains placeholders, not raw numbers. |
| Rate limit | `app/api/rate_limit.py`, per `user_id`, per minute and day, 429 + `Retry-After`, emits `guard_triggered` (`rate_limit`) | Done, in-process (single worker). |
| Max message length / circuit breakers | `max_message_chars`; provider and bridge breakers | Done (pre-existing). |

### Known gaps
- **Per-IP limit** (`AI_IP_RATE_LIMIT_PER_MINUTE`=120, `AI_IP_RATE_LIMIT_PER_DAY`=0, `AI_TRUST_PROXY_HEADERS`=false) is on the AI turn routes and returns 429 `ip_rate_limit_*`. Behind the Backend every request shares the Backend's IP, so it is only a coarse flood cap unless the Backend forwards the end-user IP in `X-Forwarded-For` and `AI_TRUST_PROXY_HEADERS=true`. Chat reaches the Backend via the signed Stream webhook (IP = Stream), and `Be/` has no throttler; nothing was added there.
- Rate-limit counters are per process; multi-instance needs Redis.
- Violence/abuse guard is phrase-based (victim reports and intent to harm others); indirect wording is only covered by the prompt.
- Free-text names/addresses are not redacted (only structured identifiers); `redact_text` is regex based and can miss spaced-out digits.
- Guard counters are not persisted; the log line is the audit trail.
