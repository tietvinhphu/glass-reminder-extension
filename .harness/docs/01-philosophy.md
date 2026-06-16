# 01. Tại sao Harness Engineering > Prompt Engineering

> Tài liệu này giải thích tư duy nền tảng của framework. Nếu anh đã hiểu vì sao cần, có thể bỏ qua.

## Bối cảnh lịch sử

### Prompt Engineering (2022-2024)
**Câu hỏi trung tâm:** "Hỏi AI thế nào cho ra đúng câu trả lời?"

Tập trung vào **câu hỏi**. Kỹ thuật: few-shot, chain-of-thought, role prompting.

**Giới hạn:** Cùng prompt, model có thể cho ra output khác nhau giữa các lần. Không kiểm soát được **cách** model làm việc — chỉ kiểm soát được **câu hỏi**.

### Context Engineering (2025)
**Câu hỏi trung tâm:** "Đưa thông tin gì cho AI để nó làm đúng?"

Tập trung vào **dữ liệu đầu vào**. Kỹ thuật: RAG, memory, file attachment, system prompt chi tiết.

**Giới hạn:** Đưa đúng thông tin vẫn chưa đủ — model có thể:
- Làm quá nhiều 1 lúc, hết context giữa chừng
- Tuyên bố "xong" khi chưa xong
- Tự đánh giá quá cao (đặc biệt task chủ quan như design)

### Harness Engineering (2026 — nay)
**Câu hỏi trung tâm:** "Toàn bộ hệ thống xung quanh AI vận hành ra sao?"

Tập trung vào **cả hệ sinh thái**: tools, permissions, memory, feedback loops, guardrails, context management, multi-agent coordination, verification.

**Khác biệt cốt lõi:** Không chỉ kiểm soát "input" và "output" — kiểm soát **toàn bộ vòng đời** của agent.

## Ẩn dụ

> Prompt engineering = viết email tốt.
> Context engineering = đính kèm đúng file.
> **Harness engineering = thiết kế cả cái văn phòng** (quy trình, con người, công cụ, kiểm soát chất lượng).

Một email tốt + đúng file ≠ văn phòng chạy hiệu quả. Cần:
- Quy trình chuẩn (workflows)
- Người đúng vai (multi-agent roles)
- Công cụ đúng việc (skill selection)
- Kiểm soát chất lượng (quality gates)

## Bằng chứng thực nghiệm

### SWE-agent paper (Princeton NLP, NeurIPS 2024)
> Cùng model, cùng task, cùng compute budget — chỉ thay đổi cách thiết kế môi trường (4 ACI components) → **hiệu suất tăng 64%**.

Đây là sự khác biệt giữa "tool chạy được" và "tool vô dụng", đến hoàn toàn từ environment design.

### Anthropic Claude Code (3/2026)
- Tạo ra **$2.5 tỷ ARR**, phần lớn giá trị đến từ harness, không phải model
- Vụ leak source code (31/3/2026) cho thấy 512.000 dòng TypeScript — **cái bị leak không phải model weights, mà là agentic harness** → harness mới là sản phẩm thực sự

## Mindset shift

| Mindset cũ (Prompt) | Mindset mới (Harness) |
|---|---|
| "Tôi cần viết prompt tốt hơn" | "Tôi cần thiết kế môi trường tốt hơn" |
| "Agent sai vì prompt chưa rõ" | "Agent sai vì thiếu guardrail/memory/skill" |
| "Sửa prompt và thử lại" | "Engineer fix ở layer nào để không bao giờ sai lại" |
| "Mỗi session bắt đầu từ zero" | "State sống sót qua sessions (memory, mistake log, JSON config)" |
| "Tôi là người duy nhất kiểm tra" | "Hooks + scripts + tests tự kiểm tra" |

## Vì sao framework này dành cho solo founder

Solo founder không có team review code, không có QA, không có senior mentor. → **Harness chính là "team" của anh.**

- Hooks = reviewer tự động (24/7)
- Skills = playbook từ best practices
- Mistake log = post-mortem database
- Templates = onboarding kit cho mỗi dự án mới
- Multi-agent roles = cách phân vai khi chỉ có 1 người

→ Quay lại [`HARNESS.md`](../HARNESS.md) hoặc đọc tiếp [`02-seven-layers.md`](02-seven-layers.md).
