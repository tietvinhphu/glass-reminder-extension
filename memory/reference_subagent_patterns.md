---
name: reference-subagent-patterns
description: "3 patterns tổ chức subagent trong Claude Code (chaining, parallel, context collector) + warning KHONG dung subagent cho implementation"
metadata: 
  node_type: memory
  type: reference
  originSessionId: e55d3fc1-f245-4849-937e-a193e93672bd
---

3 patterns tổ chức subagent từ goonnguyen (VB-04) + mrgoonie/claude-code-setup:

## Pattern 1: Chaining (tuần tự)
Dùng khi mỗi step cần output của step trước. VD: `planner-researcher → code-reviewer → docs-manager`.

## Pattern 2: Parallel Execution
Dùng khi so sánh N approaches. VD: 2 subagents propose 2 migration strategies → main agent pick winner. **CHỈ dùng cho research/read-only** — implementation phải sequential.

## Pattern 3: Context Collector
Dùng khi cần thu thập info mà không muốn pollute main context. VD: main agent summon Explore + tester → nhận 2 summary ngắn. **Đây là pattern nên dùng 80% thời gian.**

## ⚠️ Cảnh báo: KHÔNG dùng subagent cho Implementation
- Mỗi subagent chỉ thấy task của nó, không thấy full project context
- mrgoonie setup (7 agents) KHÔNG có "implementation agent"
- Implementation = main agent làm, subagent chỉ collect info + verify

## 6 subagents adapt từ mrgoonie cho solo workflow
- `planner-researcher` (opus) — research + plan → `.harness/plans/YYYYMMDD-feature.md`
- `code-reviewer` (inherit) — review code quality
- `tester` (sonnet) — run tests, coverage report
- `debugger` (sonnet) — investigate CI logs, runtime errors
- `docs-manager` (sonnet) — sync code ↔ docs
- `git-manager` (haiku) — stage, conventional commit, scan secrets

Templates có sẵn trong `harness-framework-skill/harness-framework/templates/agents/`.

**Why:** Đã research + adapt 16/06/2026 sau khi đọc bài goonnguyen + clone mrgoonie repo. Integrate vào harness framework để solo founder có thể dùng ngay.

**How to apply:** Khi user nói "summon agent X" hoặc "dùng subagent để làm Y" → check pattern phù hợp:
- Cần N perspectives cùng lúc → Pattern 2
- Cần info mà không pollute context → Pattern 3
- Step nối tiếp nhau → Pattern 1
- Implement feature → main agent (KHÔNG subagent)

Liên quan: [[reference-harness-framework]] (harness framework tổng thể), [[feedback-code-style]] (Vietnamese comments required)
