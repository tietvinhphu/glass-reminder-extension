# Glass Reminder Extension — Claude Code Instructions

## ⚡ TỰ ĐỌC KHI BẮT ĐẦU SESSION

Claude Code phải đọc 2 file này trước khi nhận bất kỳ task nào:
- `INSTRUCTIONS.md` — coding standards, security rules
- `files/EXTENSION_SPEC.md` — full technical spec

---

## 🎯 Project

Browser extension cho **Microsoft Edge** (primary), Chrome, Firefox.  
Stack: WXT + React 18 + TypeScript + Tailwind CSS v4  
Auth: Google OAuth 2.0 PKCE | Calendar: Google Calendar API v3  
Storage: chrome.storage.sync (events) + chrome.storage.local (tokens encrypted)

---

## 🔴🟢🔵 TDD — RED GREEN REFACTOR

**Quy trình bắt buộc cho mọi feature:**

### 🔴 Red — Viết test thất bại trước
```bash
# Tạo test file
touch tests/unit/[feature].test.ts
# hoặc
touch tests/components/[Component].test.tsx

# Viết test mô tả behavior mong muốn
# Chạy để confirm ĐỎ
npm test -- --reporter=verbose
```

### 🟢 Green — Viết code tối thiểu để pass
```bash
# Implement feature trong src/
# Chạy để confirm XANH
npm test
```

### 🔵 Refactor — Clean code, giữ test xanh
```bash
npm test && npm run lint && npm run type-check
```

**Test structure:**
```
tests/
├── unit/                    ← Pure functions, utils, hooks
│   ├── crypto.test.ts
│   ├── dateHelpers.test.ts
│   └── storage.test.ts
├── components/              ← React components với @testing-library
│   ├── EventCard.test.tsx
│   ├── CalendarGrid.test.tsx
│   └── EventModal.test.tsx
└── mocks/                   ← Browser API mocks
    ├── chrome.ts            ← Mock chrome.storage, alarms, notifications
    └── webextension-polyfill.ts
```

**Mock browser APIs trong test:**
```typescript
// tests/mocks/chrome.ts
global.chrome = {
  storage: {
    local: { get: vi.fn(), set: vi.fn(), remove: vi.fn() },
    sync: { get: vi.fn(), set: vi.fn() }
  },
  alarms: { create: vi.fn(), clear: vi.fn(), onAlarm: { addListener: vi.fn() } },
  notifications: { create: vi.fn(), clear: vi.fn() },
  identity: { launchWebAuthFlow: vi.fn(), getRedirectURL: vi.fn() }
} as any;
```

---

## 🌿 Branch Strategy — GitHub Flow

```
main (protected)
  └── feat/phase1-project-setup    ← setup WXT, ESLint, Vitest
  └── feat/phase1-google-auth      ← OAuth PKCE flow + token storage
  └── feat/phase1-calendar-grid    ← UI: MonthGrid + EventList
  └── feat/phase1-event-crud       ← Add/Edit/Delete events
  └── feat/phase1-notifications    ← Alarms + notifications
  └── feat/phase2-animations       ← Framer Motion
  └── feat/phase2-options-page     ← Settings UI
```

**Flow mỗi feature:**
1. `git checkout -b feat/[phase]-[feature]`
2. 🔴 Viết failing tests
3. 🟢 Implement để pass tests
4. 🔵 Refactor + lint + type-check
5. `git push origin feat/[phase]-[feature]`
6. Chờ owner review → merge vào main

---

## 🔒 Security Checklist (check mỗi task)

- [ ] Tokens chỉ trong `chrome.storage.local` với AES-GCM encrypt
- [ ] Dùng `webextension-polyfill`, không `chrome.*` trực tiếp
- [ ] Không `innerHTML` với external data
- [ ] Không hardcode client ID, secrets
- [ ] Không log tokens, email, personal data

---

## 📋 Task Prompt Template

Khi nhận task từ owner, output phải có format:

```
## Task: [Tên feature]
## Branch: feat/[phase]-[feature]
## Phase: [1/2/3]

### 🔴 Tests cần viết (TRƯỚC)
- [ ] test case 1
- [ ] test case 2

### 🟢 Implementation plan
- [ ] file cần tạo/sửa
- [ ] logic cần implement

### ✅ Definition of Done
- [ ] All tests pass (npm test)
- [ ] No lint errors (npm run lint)  
- [ ] No type errors (npm run type-check)
- [ ] Edge load unpacked test pass
```

---

## 🚀 Quick Commands

```bash
npm run dev           # Edge dev (hot reload)
npm run dev:firefox   # Firefox dev
npm test              # Vitest (watch mode)
npm test -- --run     # Vitest (single run, CI mode)
npm run lint          # ESLint
npm run type-check    # tsc --noEmit
npm run build         # Production build
npm run zip           # Package for store
```
