# Plan: Sửa lỗi sau code-review + dồn RAG về tool `search_knowledge`

> Nguồn: review folder `AI/` ngày 02/07/2026. Trạng thái trước khi sửa: 103/103 test pass
> (chạy từ thư mục `AI/`). Làm theo thứ tự P0 → P1 → P2; mỗi mục có tiêu chí nghiệm thu.
>
> Nguyên tắc chung khi sửa:
> - Mỗi mục = 1 commit riêng, chạy `pytest tests -q` từ thư mục `AI/` trước khi commit.
> - Không đổi hành vi ngoài phạm vi mô tả; test cũ nào phải đổi thì ghi rõ lý do trong commit.

---

## P0.1 — Dồn RAG hẳn về tool `search_knowledge` (quyết định kiến trúc)

Hiện có **2 đường RAG song song**: (a) keyword-gate `_SYMPTOM_HINTS` nhét chunk thẳng vào
system prompt, (b) tool `search_knowledge` cho LLM tự gọi. Quyết định: **bỏ đường (a),
giữ đường (b)**. Lợi ích: không phải bảo trì tay danh sách hint mỗi khi thêm bệnh, hết
luôn bug substring (`"ho"` khớp `"cho"`), model tự quyết khi nào cần tra cứu.

### Việc cần làm

1. **`app/agents/scheduling_agent.py`** — xoá đường inject:
   - Xoá `_SYMPTOM_HINTS` (dòng ~37–60), `_is_symptom_query()`, `_format_knowledge()`.
   - Xoá tham số `retriever` của `SchedulingAgent.__init__` và Protocol `Retriever`
     (retriever giờ chỉ đi vào qua `ToolRegistry`).
   - Trong `handle_turn`: xoá khối `knowledge_chunks = await self._retriever.retrieve(...)`
     và bỏ key `"KNOWLEDGE"` khỏi context render prompt.
   - GIỮ NGUYÊN: `EmergencyDetector`, `KnowledgePolicy.check_response_mentions` (lớp chặn
     output vẫn là chốt an toàn chính, không phụ thuộc đường retrieve nào).

2. **`app/rag/retriever.py`** — thêm ngưỡng similarity:
   - Thêm tham số `min_score: float = 0.45` vào `retrieve()`; lọc
     `chunk.similarity_score >= min_score` trước khi trả (collection đã dùng cosine —
     `hnsw:space: cosine` trong indexer — nên score 1-distance có nghĩa).
   - Lý do: tool luôn trả top-5 kể cả không liên quan → model dễ bám vào chunk rác.

3. **`app/tools/registry.py`** — tinh chỉnh tool `search_knowledge`:
   - Cắt `text` mỗi chunk còn ~1200 ký tự khi trả cho LLM (như `_format_knowledge` cũ
     từng làm) để không phình context.
   - Nếu sau lọc ngưỡng không còn chunk nào → trả
     `{"chunks": [], "note": "không có tài liệu liên quan, hãy hỏi thêm triệu chứng"}`
     thay vì mảng rỗng trần (giúp model không bịa).

4. **`prompts/system/scheduling-copilot`** — bump lên **v2**:
   - Tạo `prompts/system/scheduling-copilot.v2.md`, copy từ v1 rồi:
     - Xoá section `# Knowledge base` + placeholder `{{KNOWLEDGE}}`.
     - Tăng cường mục "Chọn đúng công cụ theo ngữ nghĩa": khi user **nhắc triệu chứng /
       bệnh / hỏi sức khỏe** → BẮT BUỘC gọi `search_knowledge(types=["disease","symptom"])`
       trước khi gợi ý chuyên khoa; nếu tool trả rỗng → hỏi thêm triệu chứng, KHÔNG bịa.
   - Frontmatter v2: `status: active`; sửa v1 thành `status: deprecated`
     (loader validate: mỗi id chỉ 1 version active — `prompts/loader.py:_validate`).
   - Ghi vào `prompts/_version-log.md`.

5. **Tests**:
   - `tests/test_agent.py::test_symptom_query_adds_knowledge_to_prompt` (dòng ~134) —
     viết lại thành: agent KHÔNG tự retrieve; thay bằng test `ToolRegistry.execute("search_knowledge", ...)`
     trả chunk đã lọc ngưỡng + cắt 1200 ký tự.
   - Thêm test: retriever với `min_score` lọc đúng (chunk score 0.2 bị loại).
   - `tests/fakes.py::FakeRetriever` cập nhật theo chữ ký mới.

### Nghiệm thu
- Grep `_SYMPTOM_HINTS|_is_symptom_query|_format_knowledge` trong `app/` → 0 kết quả.
- Chat hỏi "em bị đau vai gáy" (smoke thật với Ollama/Gemini): model gọi `search_knowledge`,
  trả lời gợi ý chuyên khoa, không chẩn đoán.
- `pytest tests -q` pass toàn bộ.

---

## P0.2 — Sửa false-positive NLU tiếng Việt (pre_filter + confirm_intent)

### a) `"tu tu"` khớp cả "từ từ" — `app/policies/pre_filter.py:14`

`strip_diacritics` làm "tự tử" và "từ từ" cùng thành `tu tu` → user nói "anh cứ từ từ"
bị chặn như self-harm và session bị FAILED. Cách sửa:

- Với các pattern **nhạy cảm dễ va chạm** (`tu tu`, `tu sat`): so khớp **bản CÓ DẤU
  trước** ("tự tử", "tự sát" trong `text.lower()`); bản không dấu chỉ dùng khi chính
  input **không chứa dấu tiếng Việt nào** (heuristic: `strip_diacritics(text) == text.lower().replace("đ","d")`
  → user gõ telex/không dấu).
- Các pattern ít va chạm ("khong muon song", "ket lieu doi") giữ nguyên logic cũ.
- Dùng word-boundary thay vì substring: tách từ như `contains_phrase` trong
  `app/rag/text.py` (đã có sẵn, dùng lại — đừng viết regex mới).

Test thêm vào `tests/test_policies.py`:
- "anh cứ từ từ tìm giúp em" → KHÔNG block.
- "tôi muốn tự tử" → block, reason `self_harm`.
- "toi muon tu tu" (không dấu toàn câu) → block.

### b) `_REJECT` chứa `"thoi"`, `"khong"` thắng CONFIRM — `app/nlu/confirm_intent.py:25`

"Thôi được rồi, đặt đi" / "không vấn đề gì, xác nhận giúp em" → REJECT dù user đồng ý.
Cách sửa (giữ nguyên tắc phủ định thắng khẳng định, chỉ vá 2 ca va chạm):

- Trước khi check REJECT, check các **cụm đồng ý mạnh** dạng cụm từ (substring):
  `"thoi duoc"`, `"khong van de"`, `"khong sao"`, `"dat di"`, `"chot di"`, `"xac nhan"` → CONFIRM.
- Thứ tự mới: AMBIGUOUS → CONFIRM-mạnh (cụm) → REJECT → CONFIRM (từ đơn).

Test thêm vào `tests/test_confirm_intent.py`:
- "thôi được rồi, đặt đi" → CONFIRM.
- "không vấn đề gì, xác nhận giúp em" → CONFIRM.
- "thôi khỏi" → REJECT. / "thôi" (một mình) → REJECT. / "không" → REJECT.
- "cũng được" → vẫn AMBIGUOUS (không được hồi quy).

### Nghiệm thu
- Toàn bộ test cũ + mới pass; đặc biệt không hồi quy nhóm AMBIGUOUS.

---

## P0.3 — Emergency: cảnh báo nhưng KHÔNG giết session

Hiện tại "em hơi khó thở khi leo cầu thang, muốn đặt khám tim mạch" → refusal khẩn cấp
+ `FAILED` + Postgres set `closedAt` (session chết vĩnh viễn). Người có triệu chứng là
đúng tệp khách cần đặt lịch nhất.

**`app/agents/scheduling_agent.py::handle_turn`** (khối pre-filter + emergency detector):

- `reason == "self_harm"` → giữ nguyên: refusal + `FAILED`.
- `reason == "emergency"` và `EmergencyDetector` match → trả message dạng
  **cảnh báo + tiếp tục**: render `refusal-emergency` (khuyên gọi 115/đến cấp cứu) nhưng
  nối thêm 1 câu "Nếu triệu chứng nhẹ/kéo dài, em có thể hỗ trợ anh/chị đặt lịch khám
  chuyên khoa phù hợp ạ." và **transition về COLLECTING** (không FAILED).
- Cân nhắc tách prompt mới `refusal-emergency-soft` trong `prompts/refusals/` thay vì
  hardcode câu nối trong Python (nhất quán với triết lý "đổi cách AI nói = sửa MD").

**`app/session/postgres_store.py`**: `closedAt` chỉ set khi `BOOKED`; với `FAILED`
vẫn set (self-harm chủ đích đóng session) — nhưng thêm: khi update mà state đã
rời BOOKED/FAILED (FAILED → COLLECTING hợp lệ theo state machine) thì **clear
`closedAt = None`** để hết mâu thuẫn "session closed nhưng vẫn nhận message".

Test: `tests/test_agent.py` — turn có "khó thở" → response chứa cảnh báo, `agent_state`
là COLLECTING (không FAILED), turn tiếp theo vẫn hoạt động.

---

## P0.4 — SSE stream: protocol có type, không leak lỗi, cancel khi client rời

**`app/api/chat.py::stream_message`** (dòng ~152–190):

1. Sự kiện có `type` thay vì mọi thứ đi qua key `chunk`:
   ```
   data: {"type": "chunk", "text": "..."}
   data: {"type": "final", "response": {...MessageResponse...}}
   data: {"type": "error", "message": "Có lỗi xảy ra, anh/chị thử lại giúp em nhé."}
   ```
   (FE đang đọc key `chunk` — sửa FE cùng lúc, tìm chỗ consume SSE trong `app/` hoặc `web/`.)
2. Đường lỗi: KHÔNG đưa `str(e)` xuống client (leak URL nội bộ/chi tiết DB). Log đầy đủ
   bằng `_LOG.exception`, client chỉ nhận message chung chung.
3. `sse_generator`: bọc `try/finally`, khi generator bị đóng (client disconnect) →
   `task.cancel()` để turn không chạy mồ côi.
4. Nhân tiện xoá import trùng `time`/`uuid` (dòng 10–13).

Test: cập nhật test API stream (nếu có) theo format mới; thêm test error path trả
`type: error` và không chứa nội dung exception.

---

## P0.5 — Bắt `SessionConflictError` → HTTP 409

**`app/api/chat.py::_run_turn`**: bọc `await store.update(state)`:

```python
try:
    await store.update(state)
except SessionConflictError:
    raise HTTPException(status_code=409, detail="session busy, retry")
```

FE nhận 409 → retry nhẹ hoặc báo "em đang xử lý tin nhắn trước, chờ chút ạ".
Test: `tests/test_api.py` — mock store raise SessionConflictError → response 409.

---

## P0.6 — Lưu state cả khi turn lỗi giữa chừng (chống draft mồ côi)

**`app/api/chat.py::_run_turn`**: nếu `agent.handle_turn` raise SAU khi
`create_booking_draft` đã chạy thành công, `store.update` không được gọi →
Be/ có draft nhưng session không nhớ `pending_confirmation`.

Sửa: bọc `handle_turn` trong `try/finally` — `finally: await store.update(state)`
(nuốt `SessionConflictError` trong nhánh lỗi để không che exception gốc). State object
được agent mutate tại chỗ nên những gì đã xảy ra (pending_confirmation, last_offered,
booking_requirement) vẫn được persist.

Test: fake provider raise ở iteration 2 sau khi iteration 1 đã tạo draft → session
trong store có `pending_confirmation`.

---

## P1 — Vệ sinh & bảo mật (làm sau P0, mỗi mục rất nhỏ)

| # | Việc | File | Ghi chú |
|---|------|------|---------|
| 1 | Xoá `ai_history_max_turns` khai báo trùng (giữ bản có comment, dòng 46–48) | `app/config.py:22` | |
| 2 | Anchor path theo file thay vì CWD: `_BASE = Path(__file__).resolve().parents[2]`; default `prompts_dir = str(_BASE / "prompts")`, tương tự `knowledge_dir`, `chroma_dir` | `app/config.py:50-52` | Sửa xong thì `pytest` chạy từ repo root cũng phải pass (hiện fail `test_api::test_session_flow`) |
| 3 | `hmac.compare_digest` thay `!=`; nếu `internal_shared_secret == "changeme"` → log CẢNH BÁO to lúc startup (main.py) | `app/deps.py:112` | |
| 4 | Guard `cancel_None`: nếu `cancel_result.get("appointment_id")` là None → đừng tạo PendingConfirmation, trả lời hỏi lại | `app/agents/scheduling_agent.py:500-505` và `:527` (bọc try/ValueError) | |
| 5 | Xoá 2 biến `code = result["error_code"]` không dùng | `app/agents/scheduling_agent.py:531,541` | |
| 6 | Cap `session.trace_ids` (giữ 50 cái cuối: `self.trace_ids = self.trace_ids[-50:]` sau append) | `app/agents/scheduling_agent.py:258` | JSONB phình dần theo lượt chat |
| 7 | `_calendar_strip`: ngày > monday+14 đang gắn nhãn "tuần sau" sai → thêm nhãn "tuần sau nữa" hoặc giới hạn `days` không vượt 2 tuần | `app/agents/scheduling_agent.py:90-98` | Ảnh hưởng resolve "thứ 3 tuần sau" khi hôm nay là CN |

---

## P2 — Ghi nhận, không bắt buộc sửa ngay

1. **Pseudo-streaming là chủ đích**: agent gom đủ câu trả lời → post-validate → mới phát
   chunk 80 ký tự. Đây là trade-off an toàn (không phát nội dung chưa qua kiểm duyệt).
   Ghi 1 đoạn vào `docs/plan-info-rag-and-streaming.md` để sau này không ai "tối ưu nhầm"
   thành stream thô.
2. **PII y tế trong `AiTurn`**: userMessage/aiMessage lưu plaintext (triệu chứng, lịch sử
   khám). Với đồ án chấp nhận được; nếu lên production cần chính sách retention (xoá sau
   N ngày) hoặc mã hoá cột.
3. **Confirm-gate cứng**: đang ở AWAITING_CONFIRMATION, user nói "đổi sang 3h chiều" →
   OTHER → bị hỏi lại vâng/không mãi. Hướng mở rộng: intent OTHER thì huỷ pending
   confirmation về COLLECTING và cho câu đó đi qua LLM như tin nhắn thường.
4. **`_strip_cjk`**: dải Hangul `가-힯` hơi lệch (chuẩn kết thúc ở `힣` U+D7A3) — vô hại,
   sửa khi tiện.

---

## Checklist tổng khi hoàn thành

- [ ] `pytest tests -q` pass từ **cả** thư mục `AI/` lẫn repo root.
- [ ] Grep `{{KNOWLEDGE}}`, `_SYMPTOM_HINTS` → 0 kết quả trong `app/` + prompt active.
- [ ] Smoke thật (Ollama hoặc Gemini): hỏi triệu chứng → model gọi `search_knowledge`;
      "từ từ" không bị chặn; "thôi được rồi, đặt đi" ra CONFIRM; "khó thở nhẹ" vẫn đặt
      lịch tiếp được sau cảnh báo.
- [ ] FE cập nhật theo SSE format mới (`type: chunk|final|error`).
- [ ] `prompts/_version-log.md` ghi nhận scheduling-copilot v2.
