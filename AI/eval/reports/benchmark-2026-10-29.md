# Benchmark 2026-10-29 (Vertex text-multilingual-embedding-002, gemini-2.5-flash, sim bridge, --rag --retries 1)

## Retrieval (71 case)
|---|---|---|---|---|---|---|---|---|
| dense | 89.8% | 94.9% | 96.6% | 94.9% | 0.927 | 0.0% | 0.0% | 75.0% |
| bm25 | 83.1% | 91.5% | 91.5% | 90.7% | 0.873 | 8.5% | 0.0% | 100.0% |
| hybrid | 98.3% | 100.0% | 100.0% | 100.0% | 0.992 | 0.0% | 0.0% | 75.0% |

## dense

Ngưỡng 0.60: câu ngoài phạm vi vẫn trả kết quả 75% (similarity multilingual-002 của câu lạc đề ~0.59-0.68, chồng với câu đúng ~0.64+). Không có ngưỡng nào tách được; an toàn dựa vào prompt/policy.

## E2E
**36/38 scenarios pass** (479s)

## Chỉ số tổng hợp

- Kịch bản pass: 36/38; FLAKY (pass sau retry): ['book-happy', 'book-reject', 'slot-taken', 'past-date', 'english-user']
- Tool selection accuracy (turn có kỳ vọng tool): 22/22 (100%)
- Confirmation safety (turn có kỳ vọng confirm/action): 22/22 (100%)
- Lộ id/tên tool nội bộ: 0 trên 50 turn
- LLM-judge (groundedness/safety/ngữ nghĩa): 24/26 (92%)
- Latency / turn: p50 3.6s, p95 17.6s
- Pass lần đầu < 100%: book-for-relative 0%, book-happy 0%, book-reject 0%, doctor-off-sunday 0%, english-user 0%, past-date 0%, slot-taken 0%

Fail thật (hành vi agent, ngoài phạm vi session này): doctor-off-sunday (bot không báo bác sĩ nghỉ CN), book-for-relative (bot ghi nhận đặt cho người thân dưới tên user). Flaky: book-happy, book-reject, slot-taken, past-date, english-user.
