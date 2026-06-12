# Glass Reminder Extension — Claude Code Instructions
> Version 2.0 | 2026-06-12

## ⚡ ĐỌC NGAY KHI BẮT ĐẦU SESSION

Đọc các file này trước khi nhận bất kỳ task nào:
- `memory/MEMORY.md` + tất cả files trong `memory/` — **bộ nhớ xuyên session**, đọc đầu tiên
- `INSTRUCTIONS.md` — coding standards, security rules, workflow
- `files/EXTENSION_SPEC.md` — full technical spec

> **Môi trường đặc biệt:** Laptop domain cty xóa dữ liệu local khi tắt máy.
> Memory được lưu trong repo GitHub tại `memory/`. Đây là source of truth duy nhất.
> Sau mỗi task, hook tự động commit & push `memory/` + `.agents/` lên GitHub.

---

## 🎯 Project

Browser extension cho **Microsoft Edge** (primary), Chrome, Firefox.  
Stack: WXT + React 18 + TypeScript + Tailwind CSS v4  
Auth: Google OAuth 2.0 PKCE | Calendar: Google Calendar API v3  
Secrets: VITE_GOOGLE_CLIENT_ID lưu trong Cursor Cloud Secrets (Environment Variable)

---

## 🗺️ Vai trò trong team

```
CLAUDE       → Điều phối, lên plan, dạy concept, viết prompt
CURSOR AGENT → Nhận prompt, viết code + test, giải thích từng dòng
OWNER        → Học, review, copy code về local VSCode kiểm tra
LOCAL VSCODE → Quality gate cuối: ESLint, SonarLint, Vitest, Coverage
GITHUB MAIN  → Source of truth sau khi owner confirm
AUTOMATIONS  → Background: vulnerabilities, bugs, CI failures
```

**CURSOR AGENT không tự tạo PR** — owner quyết định push lên main.

---

## 💬 Quy tắc bắt buộc khi viết code

### 1. Comment giải thích — LUÔN CÓ

Mọi function, block logic phức tạp PHẢI có comment tiếng Việt giải thích:
- Mục đích làm gì
- Tại sao làm vậy (nếu không hiển nhiên)
- Param/return có ý nghĩa gì

```typescript
// ✅ Đúng — có comment đầy đủ
// Kiểm tra token có sắp hết hạn không
// bufferSeconds: số giây buffer trước khi hết hạn để refresh sớm
const isExpiringSoon = (expiresAt: number, bufferSeconds: number): boolean => {
  // So sánh thời điểm hết hạn với thời điểm hiện tại + buffer
  return expiresAt - Date.now() / 1000 < bufferSeconds;
};

// ❌ Sai — không có comment
const isExpiringSoon = (expiresAt: number, bufferSeconds: number): boolean => {
  return expiresAt - Date.now() / 1000 < bufferSeconds;
};
```

### 2. TypeScript strict — no any

### 3. Dùng webextension-polyfill, không chrome.* trực tiếp

### 4. Token chỉ lưu chrome.storage.local với AES-GCM encrypt

### 5. Không log sensitive data

---

## 🔴🟢🔵 TDD — RED GREEN REFACTOR

```
🔴 RED    → Viết test → chạy → FAIL (đúng rồi)
🟢 GREEN  → Implement → chạy → PASS
🔵 REFACTOR → Clean + comment → tests vẫn PASS
```

Mock browser APIs:
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

---

## 🚀 Commands

```bash
npm run dev           # Edge dev (hot reload)
npm test              # Vitest watch mode
npm test -- --run     # Vitest single run
npm run type-check    # tsc --noEmit
npm run lint          # ESLint
npm run build         # Production build
```
