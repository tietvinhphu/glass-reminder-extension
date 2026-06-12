---
name: reference-skills
description: Skills đã cài qua npx skills CLI — lưu trong .agents/skills/ trong repo
metadata:
  type: reference
---

Skills được lưu trong `.agents/skills/` (committed vào GitHub, không cần cài lại sau mỗi lần xóa máy):

**Ecosystem skills (skills.sh):**
- `find-skills` — vercel-labs/skills: tìm kiếm skills mới
- `google-calendar` — odyssey4me/agent-skills: Google Calendar API v3 patterns
- `vitest-testing` — secondsky/claude-skills: Vitest testing patterns
- `glassmorphism` — ainergiz/design-inspirations: glassmorphism UI patterns (Low Risk)

**obra/superpowers workflow skills:**
- `systematic-debugging` — debug có quy trình trước khi fix
- `test-driven-development` — TDD workflow (Red→Green→Refactor)
- `verification-before-completion` — verify thực sự trước khi claim done
- `writing-plans` — lên plan cho multi-step tasks
- `using-superpowers` — meta-skill: chọn đúng skill cho task
- `brainstorming` — design trước khi implement
- `requesting-code-review` — trước khi merge PR

**Nếu cần cài thêm:** `npx skills find <query> --yes` (chạy từ C:\ path, không phải UNC path)
