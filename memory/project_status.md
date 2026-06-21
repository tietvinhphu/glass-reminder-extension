---
name: project-status
description: "Trạng thái hiện tại của glass-reminder-extension — checkpoints, việc tiếp theo, branch state"
metadata: 
  node_type: memory
  type: project
  originSessionId: e55d3fc1-f245-4849-937e-a193e93672bd
---

Browser extension Microsoft Edge — Glass Calendar UI + Google Calendar sync + Smart reminders.

**Stack:** WXT + React 19 + TypeScript + CSS Modules | Auth: Google OAuth 2.0 PKCE | Storage: AES-GCM encrypted tokens

**Đã hoàn thành (tính đến 2026-06-16):**
- Checkpoint 1-2: Google OAuth 2.0 PKCE flow hoàn chỉnh (PR #11 merged)
- AES-GCM token encryption, Zustand auth store, AuthGate, LoginScreen
- 11 unit tests đang xanh
- **Harness Engineering framework v1.0** đã bootstrap (commit `69c638e` trên main)
  - `.harness/` (templates, scripts, docs, examples, mistakes, agents)
  - `.claude/` (skills, hooks, settings) với 4 hooks + 10 skills
  - `HARNESS.md` master framework doc
  - `memory/` 3-tier memory system
- **Harness-framework-skill template repo** đã push lên GitHub (commit `526cad5`)
  - URL: https://github.com/tietvinhphu/harness-framework
  - Landing page GitHub Pages đang live
  - 6 subagent templates + 5 hook templates

**Việc tiếp theo — Checkpoint 3 (chưa bắt đầu):**
- `App.tsx` có TODO: thay placeholder bằng `CalendarView`
- Cần implement Google Calendar API v3 integration
- Skills đã cài hỗ trợ: `google-calendar`, `vitest-testing`
- **Pending push** (auto mode block): commit `dc8f4aa` ở glass-reminder-extension (HARNESS.md update với 6 subagents section) cần anh push manually

**Mistakes logged:** 1 example (no-vi-comment) + 1 real verified (stale-memory-index, hook tested 6/6 scenarios pass)

**Why:** Solo founder đang học, mỗi feature phải có comment tiếng Việt giải thích và theo TDD. Framework giúp tái sử dụng quality gates giữa các dự án.

**How to apply:** Luôn đề xuất theo thứ tự Red → Green → Refactor, comment mọi function. Trước mỗi task mới, đọc session_log gần nhất để biết context.
