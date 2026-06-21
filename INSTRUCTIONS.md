# Glass Reminder Extension — Project Instructions
> Version 2.1 | Cập nhật: 2026-06-21 | Solo Founder Project

---

## 🎯 Project Context

Browser extension **primary target: Microsoft Edge** (secondary: Chrome, Firefox):
- Glass calendar UI với glassmorphism design
- Sync với Google Calendar
- Smart reminders qua browser notifications
- Add/Edit/Delete events

**Key fact:** Edge là Chromium-based → cùng MV3 với Chrome → 1 codebase chạy cả Edge + Chrome.

**Stack:** WXT + React 19 + TypeScript + CSS Modules (App.css / style.css)  
**Auth:** OAuth 2.0 PKCE (Google)  
**Storage:** chrome.storage.local (reminders + tokens encrypted)  
**Deploy:** Microsoft Edge Add-ons Store → Chrome Web Store → Firefox Add-ons

---

## 🗺️ Workflow làm việc

```
CLAUDE (điều phối + lên plan + dạy concept)
        ↓ viết prompt
CURSOR CLOUD AGENT
  - Có Secrets (VITE_GOOGLE_CLIENT_ID) từ Cursor Settings
  - Có GitHub access
  - Viết code + test + giải thích từng dòng cho owner
  - KHÔNG tự tạo PR — owner quyết định
        ↓ owner học, hiểu, copy code
LOCAL VSCODE (quality gate cuối cùng)
  - ESLint + Prettier   → code clean
  - SonarLint           → security check real-time (trong lúc code)
  - Vitest + Coverage   → test xanh
  - Error Lens          → lỗi inline
  - Edge DevTools       → debug extension
  - npm run sonar       → upload kết quả lên SonarCloud (cuối cùng, trước push)
        ↓ owner confirm ổn
GIT PUSH lên main
        ↓ tự động trigger
CURSOR CLOUD AUTOMATIONS (background)
  - Find vulnerabilities (có thể query SonarCloud qua MCP)
  - Find critical bugs
  - Fix CI failures
  - Scan codebase
  - Remediate dependencies
```

> **Tại sao sonar-scanner ở CUỐI, không phải đầu?**
> SonarLint VS Code đã chạy real-time trong lúc code → bắt issue ngay khi gõ.
> sonar-scanner CLI dùng để "đóng dấu" snapshot sạch lên SonarCloud trước khi push,
> tạo lịch sử theo thời gian và cho phép Cursor Automations query qua MCP.

---

## 💬 Quy tắc viết code — BẮT BUỘC

### Comment giải thích — LUÔN LUÔN CÓ

```typescript
// ✅ BẮT BUỘC: Comment giải thích MỤC ĐÍCH của function/block
// Hàm này mã hóa token trước khi lưu vào storage
// Dùng AES-GCM 256-bit — chuẩn mã hóa đối xứng mạnh nhất hiện tại
const encryptToken = async (plainText: string): Promise<string> => {
  // Tạo key ngẫu nhiên 256-bit cho mỗi lần mã hóa
  const key = await crypto.subtle.generateKey(
    { name: "AES-GCM", length: 256 },
    false,        // key không thể export ra ngoài — bảo mật hơn
    ["encrypt", "decrypt"]
  );
  // ...
};

// ❌ KHÔNG được viết code không có comment
const encryptToken = async (plainText: string): Promise<string> => {
  const key = await crypto.subtle.generateKey(...);
};
```

### TypeScript — Strict, no any

```typescript
// ✅ Explicit types, rõ ràng
const fetchEvents = async (calendarId: string): Promise<CalendarEvent[]> => { }

// ❌ Không dùng any, không assertion không có guard
const data: any = await fetch(...);
```

### React Components — Named export, rõ props

```typescript
// ✅ Named export + interface rõ ràng
interface EventCardProps {
  event: CalendarEvent;      // Sự kiện cần hiển thị
  onEdit: (event: CalendarEvent) => void;   // Callback khi user bấm Edit
  onDelete: (id: string) => void;           // Callback khi user bấm Delete
}
export const EventCard = ({ event, onEdit, onDelete }: EventCardProps) => { }

// ❌ Không dùng default export anonymous
export default ({ ...props }) => { }
```

### File naming

```
components/  → PascalCase.tsx   (EventCard.tsx)
hooks/       → camelCase.ts     (useCalendar.ts)
utils/       → camelCase.ts     (dateHelpers.ts)
types/       → camelCase.ts     (event.ts)
tests/       → [tên file].test.ts
```

### Import ordering

```typescript
// 1. React core
import { useState, useEffect } from "react";
// 2. Third-party libs
import { motion } from "framer-motion";
import { format } from "date-fns";
import { Calendar, Bell } from "lucide-react";
// 3. Internal absolute path
import { useAuth } from "@/hooks/useAuth";
import { CalendarEvent } from "@/shared/types/event";
// 4. Relative path
import { GlassCard } from "./ui/GlassCard";
```

---

## 🔴🟢 TDD — Red Green Refactor

Mọi feature PHẢI theo thứ tự:

```
🔴 RED    → Viết test mô tả behavior → chạy → thấy FAIL
🟢 GREEN  → Viết code tối thiểu để pass → chạy → thấy PASS
🔵 REFACTOR → Clean code + thêm comment → tests vẫn PASS
```

Test structure:
```
tests/
├── unit/          ← Pure functions, utils, hooks
├── components/    ← React components với @testing-library
└── mocks/         ← Mock chrome.storage, alarms, identity
```

---

## 🔒 Security Rules — KHÔNG BAO GIỜ VI PHẠM

```typescript
// ❌ KHÔNG lưu token vào storage.sync (sync lên cloud = nguy hiểm)
chrome.storage.sync.set({ accessToken: token });

// ✅ Token chỉ trong storage.local với AES-GCM encrypt
const encrypted = await encryptToken(token);
chrome.storage.local.set({ googleToken: encrypted });

// ❌ KHÔNG dùng innerHTML với data từ ngoài (XSS risk)
element.innerHTML = event.description;

// ✅ Dùng React JSX — React tự escape
<p>{event.description}</p>

// ❌ KHÔNG hardcode credentials
const CLIENT_ID = "abc123.apps.googleusercontent.com";

// ✅ Lấy từ environment variable
const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

// ❌ KHÔNG log sensitive data
console.log("Token:", accessToken);

// ✅ Chỉ log metadata
console.log("Token refreshed, expires in:", expiresIn, "seconds");
```

---

## 🌐 Cross-browser Rules

```typescript
// ❌ KHÔNG dùng chrome.* trực tiếp
chrome.storage.sync.get("events");

// ✅ LUÔN dùng webextension-polyfill
import browser from "webextension-polyfill";
browser.storage.sync.get("events");

// ❌ KHÔNG dùng Chrome-only API mà không có fallback
chrome.offscreen.createDocument(...);

// ✅ Feature detect trước
if (chrome.offscreen) {
  await chrome.offscreen.createDocument(...);
} else {
  // Firefox fallback
  await browser.identity.launchWebAuthFlow(...);
}
```

---

## 🎨 UI/UX Rules

```css
/* ✅ Glass card chuẩn */
backdrop-filter: blur(20px);        /* max 20px — blur > 30px gây lag GPU */
background: rgba(255, 255, 255, 0.08);
border: 1px solid rgba(255, 255, 255, 0.15);

/* ❌ Không stack > 2 glass layers chồng nhau */
```

```
Animation:
✅ duration: 150-400ms
✅ Chỉ animate transform, opacity (không animate width/height)
✅ Tôn trọng prefers-reduced-motion
❌ Không animate > 3 elements cùng lúc
❌ Không dùng setTimeout cho animation

Popup sizing:
Width: 380px (fixed)
Height: max 600px
Padding: 16px

Component rules:
- Màu từ CSS variables, không hardcode hex
- Spacing theo 8px grid
- Icons: Lucide React (không dùng emoji)
- Loading: skeleton placeholder
- Error: message rõ + retry button
- Empty: icon + text hướng dẫn
```

---

## 📦 Storage Rules

```typescript
// chrome.storage.sync limits:
// Tổng: 100KB | Per key: 8KB | Max keys: 512 | Writes: 1800/hour

// ✅ Batch writes — 1 lần ghi nhiều key
await browser.storage.sync.set({
  events: serializedEvents,     // Danh sách events đã serialize
  preferences: prefs,           // Preferences của user
  lastSyncAt: new Date().toISOString()  // Timestamp sync cuối
});

// ❌ Không write từng key trong loop — dễ hit rate limit
for (const event of events) {
  await browser.storage.sync.set({ [`event_${event.id}`]: event });
}
```

---

## 🔄 API Rules

```typescript
// ✅ Retry logic có type — tự động retry khi lỗi network
const fetchWithRetry = async <T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  delay = 1000
): Promise<T> => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (err) {
      if (i === maxRetries - 1) throw err;
      // Nếu lỗi auth → refresh token rồi thử lại
      if (isAuthError(err)) { await refreshToken(); continue; }
      // Nếu rate limit → chờ lâu hơn mỗi lần (exponential backoff)
      if (isRateLimitError(err)) { await sleep(delay * (i + 1)); continue; }
      throw err;
    }
  }
};

// ✅ Luôn check token expiry trước khi gọi API
const getValidGoogleToken = async (): Promise<string> => {
  const stored = await getStoredToken();
  // Refresh nếu token còn < 5 phút — tránh expired giữa chừng
  if (!stored || isExpiringSoon(stored, 5 * 60)) {
    return await refreshGoogleToken();
  }
  return decryptToken(stored.encryptedToken);
};
```

---

## 📁 Files quan trọng

```
.cursorrules              ← Cursor Cloud đọc tự động
CLAUDE.md                 ← Claude Code CLI đọc tự động
INSTRUCTIONS.md           ← File này — đọc trước khi làm task
files/EXTENSION_SPEC.md   ← Technical spec đầy đủ
files/TDD_WORKFLOW.md     ← Prompt templates cho từng checkpoint
.cursor/environment.json  ← Config môi trường Cursor Cloud
```

---

## ✅ Pre-push Checklist (Local VSCode)

Trước khi `git push origin main`, tự kiểm tra **theo thứ tự**:

```
□ Vitest sidebar → tất cả tests XANH
□ Coverage Gutters → không có dòng đỏ quan trọng
□ Problems panel (Ctrl+Shift+M) → 0 ESLint errors
□ SonarLint panel → không có security/bug warning còn lại
□ npm run type-check → pass
□ npm audit → không có critical/high
□ Không có console.log token/email/sensitive data
□ Không có hardcoded credentials
□ Tất cả code mới có comment giải thích
□ Load extension vào Edge → test tính năng vừa làm
□ npm run sonar (bước cuối) → upload snapshot lên SonarCloud
    PowerShell: $env:SONAR_TOKEN="<token>"; npm run sonar -- -Dsonar.token=$env:SONAR_TOKEN
    ⚠ Chỉ chạy khi tất cả ô trên đã tích — tránh upload code còn lỗi
```

---

*Version 2.1 | 2026-06-21*
