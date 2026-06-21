# Glass Reminder Extension — Claude Code Instructions
> Version 2.1 | 2026-06-21

## ⚡ ĐỌC NGAY KHI BẮT ĐẦU SESSION

Đọc các file này trước khi nhận bất kỳ task nào:
- `memory/MEMORY.md` (index) — **đọc đầu tiên**
- Sau đó đọc **từng file trong `memory/` chỉ khi task liên quan** (xem cột "description" trong MEMORY.md)
- `INSTRUCTIONS.md` — coding standards, security rules, workflow
- `files/EXTENSION_SPEC.md` — full technical spec

> **Môi trường đặc biệt:** Laptop domain cty xóa dữ liệu local khi tắt máy.
> Memory được lưu trong repo GitHub tại `memory/`. Đây là source of truth duy nhất.
> Sau mỗi task, hook tự động commit & push `memory/` + `.agents/` lên GitHub.

---

## 🧠 SKILL SELECTION — Tự động chọn skill trước khi làm task

Trước khi bắt đầu BẤT KỲ task nào, kiểm tra skills có sẵn trong `.agents/skills/` và chọn skill phù hợp:

| Loại task | Skill nên dùng |
|---|---|
| Có bug / lỗi runtime | `systematic-debugging` |
| Implement feature mới | `test-driven-development` + `brainstorming` |
| Lên plan cho checkpoint | `writing-plans` |
| Sắp claim "done" / tạo PR | `verification-before-completion` + `requesting-code-review` |
| Thiết kế UI glassmorphism | `glassmorphism` |
| Làm việc với Google Calendar API | `google-calendar` |
| Viết / sửa Vitest tests | `vitest-testing` |
| Tìm skill mới cho task | `find-skills` |
| Không biết dùng skill nào | `using-superpowers` |
| Khởi tạo project mới từ Harness Framework | `harness-bootstrap` |
| Log mistake agent mắc phải | `harness-mistake-log` |
| SonarQube scan / fix issues | `sonarqube:sonar-analyze` + `sonarqube:sonar-fix-issue` |

**Quy tắc:** Đọc SKILL.md của skill được chọn trước khi bắt đầu implement.

---

## 🎯 Project

Browser extension cho **Microsoft Edge** (primary), Chrome, Firefox.  
Stack: WXT + React 19 + TypeScript + CSS Modules (App.css / style.css)  
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

## 🔍 POST-TASK BẮT BUỘC — Query SonarQube và fix sạch

> **KHÔNG được báo "xong" trước khi bước này hoàn tất.**

Sau khi implement xong bất kỳ task nào có chỉnh sửa code, Claude PHẢI:

### Bước 1 — Gọi SonarQube MCP analyze các file vừa sửa

Nếu SonarQube MCP tool `analyze_file_list` có sẵn:
```
analyze_file_list([<danh sách file đã sửa trong task>])
```

Nếu MCP không available (Docker chưa chạy / chưa kết nối):
- Đọc lại từng file vừa sửa
- Tự check theo các rule phổ biến nhất của project (xem bảng bên dưới)

### Bước 2 — Fix TẤT CẢ issues trả về

Không bỏ qua issue nào. Thứ tự ưu tiên:
1. **Security** (S6702, S2068, ...) — fix ngay, không NOSONAR
2. **Bug** (S7764, S1874, ...) — fix code
3. **Code smell** (S6759, S6772, S3516, ...) — fix code
4. **Contrast/CSS** (S7924) — fix màu nếu thật sự sai; NOSONAR nếu false-positive do dark theme

### Bước 3 — Re-analyze đến khi 0 issues

Lặp lại Bước 1 → Bước 2 cho đến khi `analyze_file_list` trả về **0 issues mới** trên các file vừa sửa.

### Rules hay gặp trong project này

| Rule | Mô tả | Cách fix |
|------|--------|----------|
| S6759 | Props không dùng `Readonly<>` | Bọc interface trong `Readonly<Props>` |
| S6772 | JSX text literal mơ hồ | Bọc trong `{"text"}` |
| S7764 | Dùng `window.*` trong extension | Đổi sang `globalThis.*` |
| S1874 | API deprecated (FormEvent...) | Dùng `SyntheticEvent<HTMLFormElement>` |
| S3516 | Function luôn return cùng 1 giá trị | Bỏ return thừa |
| S7924 | CSS contrast thấp | Fix màu hoặc thêm `/* NOSONAR */` nếu dark theme |
| S6702 | Secret/token hardcode | KHÔNG bao giờ NOSONAR — phải xóa token |
| S1128 | Import không dùng | Xóa import |

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
npm run dev:firefox   # Firefox dev (hot reload)
npm test              # Vitest single run (--run mặc định trong package.json)
npm run type-check    # tsc --noEmit
npm run lint          # ESLint
npm run build         # Production build cho Edge/Chrome
npm run build:firefox # Production build cho Firefox

# SonarCloud scan — chạy CUỐI CÙNG trước git push (sau khi tất cả checks pass)
# PowerShell:
$env:SONAR_TOKEN="<token>"; npm run sonar -- -Dsonar.token=$env:SONAR_TOKEN
```

> **Thứ tự quality gate:** tests → type-check → lint → SonarLint (VS Code) → sonar CLI → git push
