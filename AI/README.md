# Sepolia AI Service

Service AI tự host (Ollama) cho hệ thống đặt lịch Sepolia Health.
Kế hoạch chi tiết: `../260609-2358-ollama-migration-and-code-cleanup/`.

## Trạng thái hiện tại

Phần offline đã làm + test (`88 passed`, không cần Ollama thật cho pytest):

- `app/nlu/` — 4 resolver "LLM trích tham số → code tính giá trị" (Phase 06 mục 2b/2c):
  - `vn_date.py` — ngày tiếng Việt ("thứ 3 tuần sau" → ISO). Fix bug luận sai ngày của path DO cũ.
  - `timeofday.py` — giờ trong ngày (sáng/chiều/sau 5h/tầm 9-10h) + lọc slot.
  - `confirm_intent.py` — phân loại xác nhận/phủ định/mơ hồ (chốt an toàn không tạo lịch nhầm).
  - `reference.py` — trỏ kết quả trước ("BS thứ 2", "rẻ nhất").
- **Phase 03 (skeleton):** `app/main.py` (FastAPI + lifespan dispose engine), `app/providers/` (`AIProvider` + `OllamaProvider` qua httpx, OpenAI/Gemini stub), `app/session/` (models + InMemory store + **PostgresSessionStore đã hoàn thiện**), `app/routing/`, `app/observability/`, `app/api/` (health + chat stub, auth `X-Internal-Token`).
- **Phase 05:** `app/prompts/loader.py` (PromptRegistry) + `prompts/*.md` (system/policy/refusal/few-shot, versioned) + `app/policies/` (pre_filter self-harm/emergency/injection, post_validator chẩn đoán/leak/allowlist).
- **Phase 06:** `SchedulingAgent` state machine, DATA-only `ToolRegistry`, booking draft + confirm 2 bước, guard xác nhận an toàn.
- **Phase 07 bridge:** `HttpBridgeClient` gọi `Be/` `/api/internal/bridge/*`, clone per-session để gửi đúng `X-Acting-User-Id`.
- **Phase 04 foundation:** `AI/knowledge/` seed markdown, `app/rag/indexer.py`, `retriever.py`, `policy.py`, `emergency.py`; emergency/RAG đã wire optional vào `SchedulingAgent`. ChromaDB đã cài và index thật `knowledge_v1` đã build 7 files/25 chunks.

- **Session store bền (mới):** `app/session/postgres_store.py` — `PostgresSessionStore` (asyncpg/SQLAlchemy) ghi `AiSession` (JSONB) + optimistic lock có `with_for_update()` chống TOCTOU; `record_turn()` ghi `AiTurn` (observability, nuốt lỗi không hỏng lượt chat); TLS tự bật cho host non-localhost (Neon) + tự strip query libpq. Wired qua `deps.get_store`; engine dispose ở FastAPI lifespan. `AI_DATABASE_URL` trỏ cùng DB Neon với `Be/` (driver `+asyncpg`, endpoint direct không pooler).

Chưa làm xong: E2E thật với `Be/` + Stream webhook + DB (chặn bởi Redis local + Stream Dashboard, không phải code), deprecation/xoá code DO cũ ở `Be/`, prompt-tuning thêm cho Qwen 3B khi trích tham số ngày. Chi tiết: `../260609-2358-ollama-migration-and-code-cleanup/PROGRESS.md`.

## Chạy dev server

```powershell
.venv\Scripts\python.exe -m uvicorn app.main:app --reload --port 8088
# GET http://127.0.0.1:8088/health -> {"status":"ok"}
```

## Chạy test (không cần model)

```powershell
# Tạo venv + cài pytest (1 lần)
C:\Users\Admin\AppData\Local\Programs\Python\Python311\python.exe -m venv .venv
.venv\Scripts\python.exe -m pip install pytest pytest-asyncio

# Chạy test
.venv\Scripts\python.exe -m pytest -q
```

Test offline cố định `now=2026-06-16` (thứ Ba) ở các resolver/agent để assert ngày tuyệt đối.

## RAG local

Seed knowledge nằm ở `AI/knowledge/`. Ollama server đang dùng được trên `http://127.0.0.1:11435` với model store `D:\ollama-models`; server mặc định `11434` hiện list rỗng trên máy này.

```powershell
cd AI
$env:AI_OLLAMA_BASE_URL="http://127.0.0.1:11435"
.venv\Scripts\python.exe -m app.rag.indexer --rebuild
```

Kết quả đã chạy: collection `knowledge_v1`, 7 files, 25 chunks. Index sinh ra ở `AI/data/chroma/` và đã được ignore khỏi git.

## Yêu cầu phần cứng / cài đặt đầy đủ

Xem `../260609-2358-ollama-migration-and-code-cleanup/phase-02-local-stack-setup.md`.
Tóm tắt: chỉ pull `qwen2.5:3b-instruct-q4_K_M` + `bge-m3` (~3.2GB) cho dev; đặt
`OLLAMA_MODELS=D:\ollama-models`; 7B để sau khi demo.
