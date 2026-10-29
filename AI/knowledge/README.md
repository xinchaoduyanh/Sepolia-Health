# Knowledge Base

Nguồn markdown cho RAG. Sửa file ở đây rồi chạy:

```powershell
cd AI
.venv\Scripts\python.exe -m scripts.validate_knowledge   # schema + governance
.venv\Scripts\python.exe -m app.rag.indexer --ensure     # build nếu thiếu/stale (idempotent)
```

Embedding mặc định theo chat provider (Vertex/Gemini; Ollama chỉ khi không có cloud hoặc
`AI_EMBEDDING_PROVIDER=ollama`). Quy trình review/nguồn/phiên bản: [GOVERNANCE.md](GOVERNANCE.md).

Quy tắc:
- Mỗi file phải có frontmatter `id`, `type`, `canonical_name`, `version`.
- Disease muốn AI được nhắc tên phải có `allowed_for_ai_mention: true` và nằm trong `_meta/allowed-diagnoses.md`.
- Tăng `version` khi sửa nội dung y khoa hoặc policy.
- `review_status` thiếu = `unreviewed`; chỉ đặt `reviewed` khi có người duyệt y khoa thật.
- Không commit `AI/data/chroma/`.
