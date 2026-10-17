# Environment matrix

| Setting | Local | CI | Staging | Production |
|---|---|---|---|---|
| AI provider | Ollama/fake | fake | pinned Vertex model | pinned evaluated Vertex model |
| Database | local Postgres | ephemeral Postgres | managed staging | managed production |
| RAG | optional local index | unit manifest checks | required release index | required release index |
| Stream | optional | mocked | staging app/webhook | production app/signed webhook |
| Direct ingress | explicit opt-in | off | off | off |
| Rate limit/circuit | low test values | deterministic | enabled | enabled + alerting |
| Secrets | `.env` | CI secret | secret manager | secret manager/rotation |

Promotion requires backend build, Python tests, offline evaluation, mobile typecheck,
database migration rehearsal, RAG readiness and a signed Stream smoke test.

