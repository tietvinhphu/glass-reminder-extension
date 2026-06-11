# Glass Reminder Extension — Project Instructions
> Cursor / Claude Code Rules | Solo Founder Project | 2026

---

## 🎯 Project Context

Đây là browser extension **primary target: Microsoft Edge** (secondary: Chrome, Firefox) cung cấp:
- Glass calendar UI với glassmorphism design
- Sync với Google Calendar
- Smart reminders qua browser notifications
- Add/Edit/Delete events

**Key fact:** Edge là Chromium-based → cùng MV3 với Chrome → **1 codebase chạy được Edge + Chrome luôn**.

**Stack:** WXT + React 18 + TypeScript + Tailwind CSS v4  
**Auth:** OAuth 2.0 PKCE (Google)  
**Storage:** chrome.storage.sync (events) + chrome.storage.local (tokens)  
**Deploy priority:** Microsoft Edge Add-ons Store → Chrome Web Store → Firefox Add-ons

---

## 🧠 Code Philosophy

### Ưu tiên theo thứ tự:
1. **Security first** — Extension có quyền truy cập OAuth tokens, calendar data. Không bao giờ trade security for convenience.
2. **Clean > Clever** — Code phải readable sau 6 tháng. Không viết one-liner khó hiểu.
3. **Performance** — Popup phải mở trong < 200ms. Không làm nặng main thread.
4. **Cross-browser** — Chrome và Firefox phải hoạt động như nhau.

---

## 📐 Code Standards

### TypeScript
```typescript
// ✅ DO: Explicit types, no any
const fetchEvents = async (calendarId: string): Promise<CalendarEvent[]> => { ... }

// ❌ DON'T: implicit any, type assertions without guard
const data: any = await fetch(...);
const event = data as CalendarEvent; // Không có type guard
```

### React Components
```typescript
// ✅ DO: Named export, explicit props interface
interface EventCardProps {
  event: CalendarEvent;
  onEdit: (event: CalendarEvent) => void;
  onDelete: (id: string) => void;
}

export const EventCard = ({ event, onEdit, onDelete }: EventCardProps) => { ... }

// ❌ DON'T: Default export anonymous, props spread
export default ({ ...props }) => { ... }
```

### File naming
```
components/     → PascalCase.tsx     (EventCard.tsx)
hooks/          → camelCase.ts       (useCalendar.ts)
utils/          → camelCase.ts       (dateHelpers.ts)
types/          → camelCase.ts       (event.ts)
constants/      → SCREAMING_SNAKE hoặc camelCase
```

### Import ordering (ESLint enforced)
```typescript
// 1. React
import { useState, useEffect } from "react";

// 2. Third-party
import { motion } from "framer-motion";
import { format } from "date-fns";
import { Calendar, Bell } from "lucide-react";

// 3. Internal (absolute)
import { useAuth } from "@/hooks/useAuth";
import { CalendarEvent } from "@/shared/types/event";

// 4. Relative
import { GlassCard } from "./ui/GlassCard";
```

---

## 🔒 Security Rules — KHÔNG BAO GIỜ VI PHẠM

```typescript
// ❌ NEVER: Store tokens trong chrome.storage.sync
chrome.storage.sync.set({ accessToken: token }); // NGUY HIỂM — sync lên cloud

// ✅ ALWAYS: Tokens chỉ trong chrome.storage.local, phải encrypt
import { encryptToken } from "@/shared/utils/crypto";
const encrypted = await encryptToken(token);
chrome.storage.local.set({ googleToken: encrypted });

// ❌ NEVER: innerHTML với data từ ngoài
element.innerHTML = event.description; // XSS risk

// ✅ ALWAYS: textContent hoặc React JSX
<p>{event.description}</p>

// ❌ NEVER: Hardcode credentials
const CLIENT_ID = "abc123xyz.apps.googleusercontent.com";

// ✅ ALWAYS: Environment variables
const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

// ❌ NEVER: Log sensitive data
console.log("Token:", accessToken);

// ✅ ALWAYS: Log chỉ metadata
console.log("Token refreshed, expires in:", expiresIn);
```

---

## 🌐 Cross-browser Rules

```typescript
// ❌ NEVER: Dùng chrome.* trực tiếp
chrome.storage.sync.get("events");

// ✅ ALWAYS: Dùng webextension-polyfill
import browser from "webextension-polyfill";
browser.storage.sync.get("events");

// ❌ NEVER: chrome.offscreen (Chrome only) mà không có fallback
chrome.offscreen.createDocument(...);

// ✅ ALWAYS: Feature detect trước khi dùng Chrome-only API
if (chrome.offscreen) {
  await chrome.offscreen.createDocument(...);
} else {
  // Firefox fallback path
  await browser.identity.launchWebAuthFlow(...);
}
```

---

## 🎨 UI/UX Rules

### Glassmorphism constraints
```css
/* ✅ Glass card standard */
backdrop-filter: blur(20px);
background: rgba(255, 255, 255, 0.08);
border: 1px solid rgba(255, 255, 255, 0.15);

/* ❌ Không blur quá mạnh (> 30px) — gây lag trên low-end GPU */
/* ❌ Không stack nhiều hơn 2 glass layers chồng nhau */
```

### Animation rules
```
✅ transition duration: 150-400ms
✅ Dùng transform, opacity — không animate width/height (trigger layout reflow)
✅ Tôn trọng prefers-reduced-motion
❌ Không animate cùng lúc > 3 elements
❌ Không dùng setTimeout cho animation — dùng CSS transitions hoặc Framer Motion
```

### Popup sizing
```
Width: 380px (fixed, không responsive)
Height: max 600px (scroll inside nếu cần)
Padding top: 16px
Padding sides: 16px
```

### Component hierarchy khi code UI
1. Màu sắc lấy từ CSS variables (không hardcode hex)
2. Spacing theo 8px grid
3. Icons: Lucide React (không dùng emoji)
4. Loading state: skeleton placeholder (không spinner trống)
5. Error state: message rõ ràng + retry action
6. Empty state: icon + text hướng dẫn

---

## 📦 Storage Rules

```typescript
// storage.sync limits:
// - Tổng: 100KB
// - Per key: 8KB
// - Max keys: 512
// - Writes: 1800 operations/hour

// ✅ Batch writes để tránh rate limit
await browser.storage.sync.set({
  events: serializedEvents,
  preferences: prefs,
  lastSyncAt: new Date().toISOString()
});

// ❌ Không write từng key một trong loop
for (const event of events) {
  await browser.storage.sync.set({ [`event_${event.id}`]: event }); // HIT RATE LIMIT
}

// ✅ Compress nếu cần (events list có thể lớn)
// Chỉ cache 30 ngày events trong storage.sync
// Older events fetch on-demand từ Google Calendar API
```

---

## 🔄 API Integration Rules

### Error handling
```typescript
// ✅ Typed error handling với retry logic
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
      if (isAuthError(err)) { await refreshToken(); continue; }
      if (isRateLimitError(err)) { await sleep(delay * (i + 1)); continue; }
      throw err; // Unrecoverable error
    }
  }
};
```

### Token refresh
```typescript
// ✅ ALWAYS check token expiry trước API call
const getValidGoogleToken = async (): Promise<string> => {
  const stored = await getStoredToken();
  if (!stored || isExpiringSoon(stored, 5 * 60)) { // Refresh nếu < 5 phút
    return await refreshGoogleToken();
  }
  return decryptToken(stored.encryptedToken);
};
```

---

## 📁 File tham chiếu

```
📂 files/
  └── EXTENSION_SPEC.md     ← Technical spec đầy đủ
📄 INSTRUCTIONS.md          ← File này
📄 .env.example             ← Template environment variables
📄 wxt.config.ts            ← WXT config chính
📄 tailwind.config.ts       ← Tailwind config + design tokens
```

---

## 🚀 Development Commands

```bash
npm run dev           # Chrome dev mode (hot reload)
npm run dev:firefox   # Firefox dev mode
npm run build         # Production build cả 2 browsers
npm run lint          # ESLint check
npm run type-check    # TypeScript check (no emit)
npm run test          # Vitest unit tests
npm run zip           # Package cho store submission
```

---

## ✅ Pre-commit Checklist

Trước khi commit, tự check:
- [ ] `npm run lint` pass, không warnings
- [ ] `npm run type-check` không errors
- [ ] `npm audit` không critical vulnerabilities  
- [ ] Không có `console.log` sensitive data
- [ ] Không có hardcoded credentials
- [ ] **Edge build hoạt động** (`edge://extensions/` load unpacked test)
- [ ] Chrome build pass (cùng output với Edge)
- [ ] Không import `chrome.*` trực tiếp (phải qua polyfill)

---

*Cập nhật: 2026-06-11 | Solo founder project*
