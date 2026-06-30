# Knowledge Base

Nguồn markdown cho RAG local. Sửa file ở đây rồi chạy:

```powershell
cd AI
.venv\Scripts\python.exe -m app.rag.indexer --rebuild
```

Quy tắc:
- Mỗi file phải có frontmatter `id`, `type`, `canonical_name`, `version`.
- Disease muốn AI được nhắc tên phải có `allowed_for_ai_mention: true` và nằm trong `_meta/allowed-diagnoses.md`.
- Tăng `version` khi sửa nội dung y khoa hoặc policy.
- Không commit `AI/data/chroma/`.
