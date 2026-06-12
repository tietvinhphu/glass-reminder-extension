---
name: project-status
description: Trạng thái hiện tại của glass-reminder-extension — checkpoint đã xong, việc tiếp theo
metadata:
  type: project
---

Browser extension Microsoft Edge — Glass Calendar UI + Google Calendar sync + Smart reminders.

**Stack:** WXT + React 19 + TypeScript + Tailwind CSS v4 | Auth: Google OAuth 2.0 PKCE | Storage: AES-GCM encrypted tokens

**Đã hoàn thành (tính đến 2026-06-12):**
- Checkpoint 1-2: Google OAuth 2.0 PKCE flow hoàn chỉnh (PR #11 merged)
- AES-GCM token encryption, Zustand auth store, AuthGate, LoginScreen
- 11 unit tests xanh

**Việc tiếp theo — Checkpoint 3:**
- `entrypoints/popup/App.tsx` có TODO: thay placeholder bằng `CalendarView`
- Implement Google Calendar API v3 integration
- Skills đã cài hỗ trợ: `google-calendar`, `vitest-testing`

**Why:** Solo founder đang học, mỗi feature phải có comment tiếng Việt và theo TDD Red→Green→Refactor.
