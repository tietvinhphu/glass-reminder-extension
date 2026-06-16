# 04. Multi-agent Patterns cho Solo Workflow

> Map từ Anthropic 3-agent pattern (Planner → Generator → Evaluator) sang solo founder workflow.

---

## Tại sao cần multi-agent

### Bài học từ Anthropic (2/2026)

> Prompt: *"Create a 2D retro game maker"*
> - **Solo agent:** 20 phút, $9 → game **không chạy được**
> - **Full harness (3 agents):** 6 giờ, $200 → game chạy được, có AI features

> Prompt: *"Build a fully featured DAW in the browser"* (Opus 4.6)
> - **Full harness:** 4 giờ, $124.70 → DAW hoàn chỉnh

Sự khác biệt đến từ **separation of concerns** — mỗi agent giỏi 1 việc thay vì 1 agent cố làm tất cả.

### Failure modes khi không tách vai

Anthropic đã identify 2 failure modes phổ biến khi solo agent cố làm mọi thứ:

1. **"Làm quá nhiều một lúc"** — agent implement 10 features cùng lúc, hết context giữa chừng, output 1 nửa bị corrupt
2. **"Tuyên bố chiến thắng quá sớm"** — agent mới thấy file có sẵn, kết luận "xong rồi!" vì không hiểu "xong" nghĩa là gì

Ngoài ra: **self-evaluation kém** — agent gần như luôn khen chính mình, đặc biệt task chủ quan (design, UX).

---

## 3 vai (adapt cho solo)

### Vai 1 — PLANNER (🧠 Think)

**Khi nào dùng:** Đầu mỗi task/checkpoint, hoặc khi task phức tạp (>3 files, >100 dòng code).

**Tools/skills dùng:**
- `brainstorming` skill — clarify intent
- `writing-plans` skill — viết plan
- Skill `superpowers:test-driven-development` — xác định tests cần viết

**Output:**
- `files/PLAN.md` — plan chi tiết với checklist
- Danh sách tests cần viết (RED)
- Acceptance criteria rõ ràng

**Mindset:**
- KHÔNG viết code
- KHÔNG sửa file
- CÂU HỎI: "Acceptance criteria là gì? Có test nào để verify done?"

**Thời lượng:** 10-20% tổng effort

---

### Vai 2 — GENERATOR (⚙️ Build)

**Khi nào dùng:** Sau khi plan xong, bắt đầu implement.

**Tools/skills dùng:**
- `test-driven-development` skill — RED → GREEN → REFACTOR
- Domain-specific skills (vd: `google-calendar`, `glassmorphism`)
- Tất cả custom skills đã engineer

**Output:**
- Code + tests (mỗi session 1 feature)
- Commits nhỏ, có message rõ ràng
- Update progress file nếu có

**Mindset:**
- Theo plan, KHÔNG deviate
- Mỗi commit = 1 feature pass test
- KHÔNG tự đánh giá "xong rồi" — để Evaluator verify

**Thời lượng:** 60-70% tổng effort

---

### Vai 3 — EVALUATOR (✅ Verify)

**Khi nào dùng:** Trước khi claim "task xong", hoặc trước khi tạo PR.

**Tools/skills dùng:**
- `verification-before-completion` skill — checklist
- `requesting-code-review` skill — review
- Chạy quality gates: `npm test`, `npm run type-check`, `npm run lint`, `npm run sonar`
- Có thể dùng Playwright MCP để click thật vào app (Anthropic pattern)

**Output:**
- Pass/fail cho từng acceptance criteria
- Bằng chứng: test output, screenshot, log
- KHÔNG claim "done" nếu có 1 tiêu chí fail

**Mindset:**
- Giả định agent sai → tìm bằng chứng agent sai
- "Working" ≠ "Done" — phải check acceptance criteria
- Dùng tool rẻ nhất: regex/bash trước, LLM sau

**Thời lượng:** 15-25% tổng effort

---

## Workflow thực tế

```
┌─────────────────────────────────────────────────────────────┐
│                  1 session = 1 vòng                         │
│                                                             │
│  🧠 PLANNER (5-10 phút)                                     │
│    - Đọc task từ owner                                     │
│    - Brainstorm intent                                      │
│    - Viết/đọc plan                                         │
│    - Xác định acceptance criteria                           │
│    ↓                                                        │
│  ⚙️ GENERATOR (30-60 phút)                                  │
│    - Viết tests trước (RED)                                │
│    - Implement (GREEN)                                      │
│    - Refactor + comment (REFACTOR)                          │
│    - Commit nhỏ                                             │
│    ↓                                                        │
│  ✅ EVALUATOR (5-15 phút)                                   │
│    - Chạy quality gates                                     │
│    - Check acceptance criteria                              │
│    - Log mistake nếu có                                     │
│    - Báo "done" hoặc quay lại Generator                     │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Lưu ý:** Với solo founder, 3 vai này là **3 mindset** trong cùng 1 session, không phải 3 người. Chuyển vai bằng cách dùng skill tương ứng.

---

## Subagent pattern (khi context quá lớn)

Khi task quá lớn (vd: scaffold toàn bộ CalendarView), parent thread sẽ hết context. → Tách thành subagent.

**3 loại subagent (theo Anthropic leak):**

| Type | Use case | Cost | Isolation |
|---|---|---|---|
| **Fork** | Parallel research, không thay đổi file | Free (share KV cache) | Thấp |
| **Teammate** | Communicate qua mailbox, có thể edit | Trung bình | Trung bình |
| **Worktree** | Git branch riêng, edit độc lập | Cao (clone disk) | Cao |

**Solo founder pattern:**
- Dùng **Fork** để parallel research (vd: tìm 3 patterns cho OAuth, vote chọn)
- Dùng **Worktree** khi cần experiment mà không muốn ảnh hưởng main branch
- Tránh **Teammate** nếu không có team thật

**Ví dụ cụ thể:** Khi implement CalendarView, có thể fork 3 subagent:
- Subagent A: research Google Calendar API v3 best practices
- Subagent B: research react-aria-components patterns cho date picker
- Subagent C: research glassmorphism date picker UI
- Parent thread: tổng hợp → viết plan → switch sang Generator

→ Quay lại [`HARNESS.md`](../HARNESS.md) hoặc đọc tiếp [`05-context-hygiene.md`](05-context-hygiene.md).
