# Quy trình governance cho `AI/knowledge/`

Kiến thức này được bot trích dẫn cho bệnh nhân, nên mọi thay đổi đi qua quy trình dưới đây.
Kiểm tra tự động: `python -m scripts.validate_knowledge` (CI/release chạy; `--strict` là gate go-live).

## Frontmatter bắt buộc

```yaml
id: stable-id              # không đổi sau khi phát hành; trùng tên file
type: disease|symptom|faq|policy
canonical_name: Tên chuẩn
version: 1                 # tăng khi sửa nội dung ảnh hưởng câu trả lời
review_status: unreviewed  # unreviewed (mặc định nếu thiếu) | reviewed | deprecated
# Chỉ điền khi review_status = reviewed (validator bắt buộc):
reviewed_by: vai-trò-hoặc-ID-bác-sĩ-duyệt
reviewed_at: 2026-01-31
sources:                   # bắt buộc với disease/symptom
  - title: Tên tài liệu / hướng dẫn
    url: https://...
    accessed_at: 2026-01-30
owner: người-chịu-trách-nhiệm
next_review_at: 2027-01-31 # quá hạn => cảnh báo; --strict => lỗi
```

`review_status` thiếu được hiểu là `unreviewed`. **Không** tự điền `reviewed*` nếu chưa có
người duyệt thật: trạng thái này là cam kết y khoa, không phải thủ tục hình thức.

## Vòng đời một thay đổi

1. **Soạn/sửa**: tác giả sửa file, tăng `version`, đặt `review_status: unreviewed`, ghi `sources`.
2. **Review y khoa**: người có chuyên môn đọc đối chiếu nguồn, kiểm tra (a) không chẩn đoán/kê đơn,
   (b) triệu chứng cảnh báo (`red_flags`) đủ, (c) chuyên khoa khuyến nghị khớp danh mục của phòng khám.
   Đạt thì điền `reviewed_by`, `reviewed_at`, `owner`, `next_review_at`, đổi `review_status: reviewed`.
3. **CI**: `validate_knowledge` + `pytest` + benchmark retrieval (`python -m eval.run_retrieval`)
   không được tụt so với `eval/reports/retrieval-baseline.json` (xem `eval/README.md`).
4. **Release**: deploy chạy `python -m app.rag.indexer --ensure` (hoặc `AI_RAG_AUTO_BUILD=true`).
   Index mới được build thành collection riêng rồi swap qua `index_manifest.json`; `/ready` trả 503
   cho tới khi manifest khớp hash knowledge + embedding provider/model + policy review.

## Cổng production

- `AI_RAG_REQUIRE_REVIEWED=true`: indexer chỉ nhận tài liệu `reviewed`, bỏ `unreviewed`/`deprecated`.
  Bật cờ này khi go-live thật. Hiện toàn bộ seed V1 còn `unreviewed` (xem `_meta/sources.md`),
  nên bật cờ ngay sẽ cho index rỗng và build thất bại — đó là hành vi đúng, cần bác sĩ duyệt trước.
- Nội dung định hướng đặt lịch (`faq`, `policy`) tách khỏi nội dung bệnh/triệu chứng; không thêm
  chẩn đoán hay điều trị vào `faq`/`policy`.
- Bệnh chỉ được bot nhắc tên khi vừa `allowed_for_ai_mention: true` vừa nằm trong
  `_meta/allowed-diagnoses.md`.

## Truy vết

Mỗi chunk trong Chroma mang `file_id`, `version`, `source_path`, `review_status`, `reviewed_at`,
`sources`; tool `search_knowledge` trả `file_id`, `version`, `review_status`, `sources` cho audit.
`index_manifest.json` ghi `knowledge_hash`, embedding provider/model/dimension, số file/chunk.

## Lịch review

Mỗi tài liệu có `owner` và `next_review_at` (khuyến nghị 12 tháng; 6 tháng với bệnh có guideline
thay đổi nhanh). `scripts.validate_knowledge` liệt kê tài liệu quá hạn.
