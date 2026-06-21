# Glass Reminder Extension — Claude Code Instructions
> Version 2.2 | 2026-06-21 (Progressive Disclosure)

## ⚡ Đọc ngay khi bắt đầu session

Đọc theo thứ tự, CHỈ đọc file liên quan khi task yêu cầu:

1. **`memory/MEMORY.md`** — index, đọc đầu tiên
2. **`INSTRUCTIONS.md`** — coding standards + security rules
3. **`.claude/docs/`** — progressive disclosure (xem "Additional Documentation" bên dưới)

> **Môi trường đặc biệt:** Laptop domain cty xóa dữ liệu local khi tắt máy.
> Memory lưu trong repo GitHub tại `memory/` — đây là source of truth duy nhất.
> Sau mỗi task, hook tự động commit & push `memory/` + `.agents/` lên GitHub.

## 🧠 Skill selection

Trước BẤT KỲ task nào: dùng skill `using-superpowers` (nó sẽ hướng dẫn chọn skill phù hợp từ `.agents/skills/`).

**Bắt buộc cho task phổ biến:**

| Loại task | Skill |
|---|---|
| Có bug / lỗi runtime | `systematic-debugging` |
| Implement feature mới | `test-driven-development` + `brainstorming` |
| Lên plan cho checkpoint | `writing-plans` |
| Sắp claim "done" | `verification-before-completion` |
| Thiết kế UI glassmorphism | `glassmorphism` |
| Google Calendar API | `google-calendar` |
| Vitest tests | `vitest-testing` |
| SonarQube scan / fix | `sonarqube:sonar-analyze` + `sonarqube:sonar-fix-issue` |
| Log mistake agent mắc | `harness-mistake-log` |

## 🎯 Project

Browser extension cho **Microsoft Edge** (primary), Chrome, Firefox.
Stack: **WXT 0.20** + **React 19** + **TypeScript 5.9** + CSS Modules (`App.css`/`style.css`, không Tailwind).
Auth: Google OAuth 2.0 PKCE. Calendar: Google Calendar API v3.
Secrets: `VITE_GOOGLE_CLIENT_ID` trong Cursor Cloud Secrets.

## 🚀 Commands

```bash
npm install              # wxt prepare chạy tự động qua postinstall
npm run dev              # Edge dev (hot reload) — mở Edge tự động
npm run dev:firefox      # Firefox dev
npm test                 # Vitest single run (--run mặc định)
npm run type-check       # tsc --noEmit
npm run lint             # ESLint
npm run build            # Production build Edge/Chrome
npm run build:firefox    # Production build Firefox

# SonarCloud (chạy CUỐI CÙNG trước git push):
$env:SONAR_TOKEN="<token>"; npm run sonar -- -Dsonar.token=$env:SONAR_TOKEN
```

> **Thứ tự quality gate:** tests → type-check → lint → SonarLint (VS Code) → sonar CLI → git push.

### 🔧 Config change quality gate (BẮT BUỘC khi sửa tsconfig/wxt.config/vite plugin)

```bash
bash .harness/scripts/verify-config-change.sh
```

Chạy 3 bước: `wxt prepare` → `type-check` → `tests`. Nếu bất kỳ bước nào fail → KHÔNG announce "done".
**Tại sao:** WXT/ViteNodeRunner load plugin context riêng — `tsc --noEmit` pass KHÔNG đảm bảo `wxt prepare` pass.
Xem `memory/wxt-vite-prepare-gotcha.md` để biết root cause.

## 📋 Output format khi nhận task

```
## Task: [Tên feature]
## Checkpoint: [1/2/3...]

### 🔴 Tests cần viết TRƯỚC
- [ ] test case 1 — giải thích test này kiểm tra gì
- [ ] test case 2

### 🟢 Implementation plan
- [ ] file cần tạo — làm gì
- [ ] logic cần implement

### ✅ Done khi
- [ ] npm test → xanh
- [ ] npm run type-check → pass
- [ ] Extension load Edge → tính năng hoạt động
```

## 📚 Additional Documentation

Đọc các file sau CHỈ KHI task liên quan (progressive disclosure — tránh load không cần thiết):

| Domain | File |
|---|---|
| Directory structure, entry points, cross-cutting concerns | [`.claude/docs/architecture.md`](.claude/docs/architecture.md) |
| Comment rules, no-any, webextension-polyfill, TDD | [`.claude/docs/code_style.md`](.claude/docs/code_style.md) |
| 8 SonarQube rules hay gặp + cách fix | [`.claude/docs/sonarqube_rules.md`](.claude/docs/sonarqube_rules.md) |
| Full technical spec (kiến trúc, features, data model) | `files/EXTENSION_SPEC.md` |
| Harness Engineering framework (mistake loop, 7 layers) | `HARNESS.md` |
| Universal agent instructions | `AGENTS.md` |
| Audit findings 21/06/2026 (version drift history) | `memory/audit_2026-06-21.md` |
| WXT/Vite prepare gotcha (lesson từ mistake 21/06) | `memory/wxt-vite-prepare-gotcha.md` |
