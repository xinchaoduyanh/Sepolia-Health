# AI evaluation

| Suite | Lệnh | Cần credential | Đo gì |
|---|---|---|---|
| Offline (hermetic) | `python -m eval.run_offline` | Không | pre_filter/safety, confirm intent, post_validator — gate 100% |
| Retrieval | `python -m eval.run_retrieval --mode all --compare` | `bm25`: không; `dense`/`hybrid`: embedding (Vertex/Gemini/Ollama) + index | Hit@1/3/5, Recall@5, MRR, empty, wrong-type, false-positive của câu ngoài phạm vi, quét ngưỡng `min_score` |
| E2E hội thoại | `python -m eval.e2e.run_e2e [--rag]` | Gemini (Vertex) thật; `--rag` thêm index | tool selection, an toàn xác nhận, rò rỉ id nội bộ, groundedness (LLM judge), latency, độ chập chờn |
| Unit | `python -m pytest -q` | Không | toàn bộ logic, kể cả toán chỉ số retrieval |

## Quy trình thay đổi knowledge / model / prompt

1. `python -m scripts.validate_knowledge` (schema + governance).
2. `python -m app.rag.indexer --ensure` rồi `python -m eval.run_retrieval --mode all --compare`.
   `--compare` fail nếu Hit@5/MRR tụt > 0.02 hoặc false-positive tăng so với `reports/retrieval-baseline.json`.
3. Thêm/sửa case trong `datasets/retrieval.jsonl` **trước** khi thêm nội dung mới (mỗi tài liệu mới cần ≥ 2 case).
4. Cải thiện được thì chạy lại với `--save-baseline` và commit baseline cùng thay đổi.

## Golden dataset (`datasets/retrieval.jsonl`)

Mỗi dòng: `id`, `category`, `input`, `expected_documents` (≥1 tài liệu đúng; Hit tính nếu có bất kỳ cái nào),
`types` (tuỳ chọn — bộ lọc mà tool `search_knowledge` truyền vào), `expect_empty` (câu ngoài phạm vi: lý tưởng là
không trả gì). Không chứa PII. Loại: `symptom`, `alias`, `no_diacritics`, `faq`, `policy`, `multi_doc`,
`type_filter`, `negative` (không liên quan y tế), `negative_near` (gần y khoa nhưng KB không có).

Giới hạn đã biết: dataset do một người soạn, ~60 case dương — đủ để bắt regression, chưa đủ để kết luận
chênh lệch < 3 điểm. Cần bổ sung câu hỏi thật từ log (đã ẩn danh) khi có.

## Báo cáo

`reports/retrieval-latest.{json,md}`, `reports/e2e-latest.{json,md}` là bản chạy cục bộ (git bỏ qua).
`reports/retrieval-baseline.*` và `reports/benchmark-*.md` là bản đã duyệt, được commit.
