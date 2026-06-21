# 📋 Browser Extension — Technical Spec
> Glass Calendar & Smart Reminder Extension  
> **Primary target: Microsoft Edge** | Secondary: Chrome, Firefox  
> Author: Solo Founder | Stack: WXT + React + TypeScript  
> Version: 1.1.0 | Date: 2026-06-21

---

## 1. Tổng quan thế giới đang làm Extension như thế nào (2025-2026)

### 1.1 Manifest V3 — Chuẩn hiện tại

**Microsoft Edge là Chromium-based** → dùng cùng Manifest V3 với Chrome, không cần viết code riêng. Một codebase, build ra dùng được ngay trên Edge và Chrome.

| Browser | Engine | MV3 Support | Store |
|---------|--------|-------------|-------|
| **Edge** ✅ Primary | Chromium | ✅ Full | Microsoft Edge Add-ons |
| Chrome | Chromium | ✅ Full | Chrome Web Store |
| Firefox | Gecko | ✅ MV3 (v109+) | Firefox Add-ons |

| Thay đổi so với MV2 | MV2 (cũ) | MV3 (hiện tại) |
|---------------------|----------|----------------|
| Background page | Persistent background page | **Service Worker** (ephemeral) |
| Remote code | Cho phép | **Bị chặn** (CSP strict) |
| Web request | `webRequestBlocking` | `declarativeNetRequest` |
| Action API | `browser_action` / `page_action` | **`action`** (gộp lại) |
| Script injection | `chrome.tabs.executeScript` | `chrome.scripting.executeScript` |

> ⚠️ **Service Worker quan trọng:** SW có thể bị terminate bất kỳ lúc nào khi không có task. Không được lưu state trong memory — phải dùng `chrome.storage` làm source of truth.

### 1.2 Framework phổ biến nhất 2025

| Framework | Stars | Pro | Con | Verdict |
|-----------|-------|-----|-----|---------|
| **WXT** | 7k+ | Hot reload, TypeScript native, HMR popup, auto MV3 | Ít tài liệu hơn | ✅ **CHỌN** |
| Plasmo | 10k+ | Đẹp, nhiều tính năng | Heavy, opinionated | ⚠️ Có thể |
| CRXJS + Vite | Manual | Nhẹ, kiểm soát tốt | Nhiều config | Cho advanced |
| Vanilla JS | — | Zero deps | Dev experience tệ | ❌ Không |

**→ Chọn WXT vì:** TypeScript first, React support, **Edge/Chrome/Firefox out of the box** (cùng 1 codebase, build ra 3 target), tương thích tốt với Cursor AI coding.

### 1.3 Xu hướng UI Extension 2025

- **Glassmorphism** + Dark mode là chuẩn hiện đại cho extensions
- **380–420px popup width** — chuẩn UX cho extensions
- **Framer Motion** hoặc **CSS @keyframes** cho animation (tránh heavy animation libs)
- **Lucide Icons** — lightweight, consistent SVG icons
- **Tailwind CSS** — utility-first, nhỏ gọn sau purge

### 1.4 Calendar Sync — Cách thế giới làm

```
OAuth 2.0 PKCE Flow (recommended cho extensions)
    └── Google Calendar API v3

Token storage: chrome.storage.local (encrypted, không sync)
Refresh token: Background service worker tự refresh

Event sync strategy:
    - Pull on popup open (with cache 5 min)
    - Push write operations immediately
    - Background periodic sync mỗi 15 phút
```

---

## 2. Kiến trúc kỹ thuật

### 2.1 Tech Stack

```
┌─────────────────────────────────────────────────┐
│              BROWSER EXTENSION                   │
├─────────────────────────────────────────────────┤
│  Framework:    WXT (v0.20+)                     │
│  Language:     TypeScript 5.x                   │
│  UI:           React 19 + CSS Modules           │
│  Animation:    Framer Motion 12 (light mode)    │
│  Icons:        Lucide React                     │
│  Date lib:     date-fns v4                      │
│  HTTP:         axios (typed interceptors)       │
│  State:        Zustand (lightweight)            │
│  Form:         React Hook Form + Zod            │
├─────────────────────────────────────────────────┤
│  Auth:         OAuth 2.0 PKCE                   │
│    - Google:   chrome.identity API              │
│  Calendar:     Google Calendar API v3           │
│  Storage:      chrome.storage.sync (events)     │
│                chrome.storage.local (tokens)    │
│  Notify:       chrome.notifications API         │
│  Alarms:       chrome.alarms API               │
│  Polyfill:     webextension-polyfill (Mozilla)  │
├─────────────────────────────────────────────────┤
│  Build:        Vite (via WXT)                   │
│  Lint:         ESLint + Prettier                │
│  Test:         Vitest + @testing-library/react  │
│  CI/CD:        GitHub Actions                   │
│  Security:     npm audit, PKCE, CSP strict      │
└─────────────────────────────────────────────────┘
```

### 2.2 Extension Components (MV3 Architecture)

```
extension/
├── background/
│   └── index.ts          ← Service Worker (auth refresh, alarms, notifications)
│
├── popup/
│   └── index.tsx         ← Main UI (380x600px, glassmorphism calendar)
│
├── options/
│   └── index.tsx         ← Settings page (account, preferences)
│
├── offscreen/            ← Chrome only: OAuth popup handler
│   └── index.ts
│
└── manifest.config.ts    ← WXT manifest configuration
```

### 2.3 Component Tree (Popup)

```
<App>
  ├── <AuthGate>             ← Check login state
  │   ├── <LoginScreen>      ← Google login button (Sign in with Google)
  │   └── <MainApp>
  │       ├── <GlassHeader>  ← Date, account avatar, sync status
  │       ├── <CalendarView>
  │       │   ├── <MonthGrid>        ← Mini calendar
  │       │   ├── <EventList>        ← Events of selected day
  │       │   └── <EventCard>        ← Single event (click to edit)
  │       ├── <QuickAddBar>          ← Fast event creation
  │       ├── <EventModal>           ← Add/Edit/Delete modal
  │       └── <NotificationBadge>    ← Upcoming alerts counter
```

### 2.4 Service Worker Flow

```
On Install / Update:
  → setupAlarms() — schedule next check
  → refreshTokens() — ensure auth valid

Every 15 minutes (chrome.alarms):
  → syncCalendars() — fetch new events from Google Calendar
  → scheduleReminders() — create chrome.alarms for upcoming events

On Alarm fires (event reminder):
  → chrome.notifications.create({
      type: "basic",
      title: event.title,
      message: "Bắt đầu trong 15 phút",
      iconUrl: "icons/icon-128.png",
      buttons: [{ title: "Xem chi tiết" }, { title: "Bỏ qua" }]
    })

On Notification click:
  → chrome.action.openPopup() — mở popup
```

---

## 3. Authentication Flow (OAuth 2.0 PKCE)

### 3.1 Google OAuth

```
Bước 1: User click "Login with Google"
Bước 2: chrome.identity.launchWebAuthFlow({
    url: buildGoogleAuthURL({ 
        client_id: GOOGLE_CLIENT_ID,
        redirect_uri: chrome.identity.getRedirectURL(),
        scope: "https://www.googleapis.com/auth/calendar",
        response_type: "code",
        code_challenge: PKCE_challenge,
        code_challenge_method: "S256"
    }),
    interactive: true
})
Bước 3: Extract authorization code từ redirect URL
Bước 4: Exchange code → access_token + refresh_token
Bước 5: Store tokens encrypted trong chrome.storage.local
```

### 3.2 Token Security

```typescript
// Không dùng chrome.storage.sync cho tokens (sync qua cloud = security risk)
// Chỉ dùng chrome.storage.local với custom encryption

const encryptToken = async (token: string): Promise<string> => {
  const key = await crypto.subtle.generateKey(
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
  // ... AES-GCM encrypt
};
```

---

## 4. Data Schema

### 4.1 Event Object

```typescript
interface CalendarEvent {
  id: string;                    // Unique ID (Google Calendar event ID)
  title: string;                 // Tên sự kiện
  description?: string;          // Mô tả
  startTime: string;             // ISO 8601
  endTime: string;               // ISO 8601
  allDay: boolean;
  source: "google" | "local";    // google = sync từ GCal, local = tạo trong extension
  reminders: ReminderConfig[];   // Cấu hình nhắc nhở
  color?: string;                // Màu sự kiện
  location?: string;
  updatedAt: string;             // ISO 8601
}

interface ReminderConfig {
  method: "notification" | "alarm";
  minutesBefore: number;         // 5, 10, 15, 30, 60, 1440
}
```

### 4.2 Storage Schema

```typescript
// chrome.storage.sync (max 100KB, sync across browser accounts)
interface SyncStorage {
  events: CalendarEvent[];       // Local events + cached external
  preferences: UserPreferences;
  lastSyncAt: string;
}

// chrome.storage.local (not synced — for sensitive data)
interface LocalStorage {
  googleToken: EncryptedToken;
  googleRefreshToken: EncryptedToken;
}

interface UserPreferences {
  theme: "glass-dark" | "glass-light" | "glass-auto";
  defaultReminderMinutes: number;
  enabledCalendars: string[];    // Calendar IDs
  language: "vi" | "en";
  startOfWeek: 0 | 1;           // 0 = Sunday, 1 = Monday
}
```

---

## 5. UI/UX Design System — Glassmorphism

### 5.1 Design Token

```css
:root {
  /* Glass effect */
  --glass-bg: rgba(255, 255, 255, 0.08);
  --glass-border: rgba(255, 255, 255, 0.15);
  --glass-blur: blur(20px);
  --glass-shadow: 0 8px 32px rgba(0, 0, 0, 0.37);

  /* Color palette */
  --color-bg: #0a0a1a;           /* Deep space background */
  --color-surface: rgba(255,255,255,0.06);
  --color-primary: #6366f1;      /* Indigo — brand accent */
  --color-primary-glow: rgba(99, 102, 241, 0.4);
  --color-success: #10b981;      /* Emerald */
  --color-warning: #f59e0b;      /* Amber */
  --color-danger: #ef4444;       /* Red */
  --color-text: #f1f5f9;
  --color-text-muted: rgba(241,245,249,0.6);

  /* Sizing */
  --popup-width: 380px;
  --popup-height: 580px;
  --radius-sm: 8px;
  --radius-md: 12px;
  --radius-lg: 16px;
  --radius-xl: 20px;

  /* Animation */
  --transition-fast: 150ms ease;
  --transition-base: 250ms ease;
  --transition-slow: 400ms cubic-bezier(0.4, 0, 0.2, 1);
}
```

### 5.2 Glass Component Pattern

```css
.glass-card {
  background: var(--glass-bg);
  backdrop-filter: var(--glass-blur);
  -webkit-backdrop-filter: var(--glass-blur);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-lg);
  box-shadow: var(--glass-shadow);
}

.glass-button {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  transition: all var(--transition-fast);
}

.glass-button:hover {
  background: rgba(255, 255, 255, 0.18);
  box-shadow: 0 4px 16px rgba(99, 102, 241, 0.3);
  transform: translateY(-1px);
}
```

### 5.3 Animation Principles

```
Popup open:    scale(0.95) → scale(1) + opacity 0→1 | 250ms ease-out
Event card:    slideUp 8px → 0 | 200ms ease | stagger 40ms each
Modal open:    scale(0.92) → scale(1) + fade | 300ms cubic-bezier
Notification:  slideIn từ phải 20px | 250ms spring
Hover:         translateY(-1px) + glow shadow | 150ms ease
Reminder bell: ring shake 3x | 600ms ease | CSS @keyframes
Calendar day:  ripple effect khi click | 200ms ease
```

### 5.4 Typography

```
Font:     Inter (Google Fonts) — clean, modern, readable nhỏ
Display:  Inter 600 20px — tên tháng, event title chính
Body:     Inter 400 13px — nội dung event, description
Caption:  Inter 400 11px — timestamp, metadata
Mono:     JetBrains Mono 12px — date numbers trong calendar grid
```

---

## 6. Cấu trúc thư mục dự án

> ⚠ **Cập nhật 2026-06-21:** Directory tree dưới đây là **TARGET structure** (mục tiêu cuối cùng).  
> Codebase hiện tại đã có: `entrypoints/{alarm,popup}/`, `src/{alarm,background,popup,shared}/`, `tests/{unit,mocks,setup}/`, `tests/utils/`.  
> **CHƯA có:** `src/options/`, `src/offscreen/`, `tailwind.config.ts`, `.eslintrc.json`, `.prettierrc`, `tests/e2e/`.  
> Khi thêm mới, cập nhật lại section này cho khớp thực tế.

```
glass-reminder-extension/
├── .github/
│   └── workflows/
│       ├── ci.yml              ← lint + test + build
│       └── release.yml         ← build + zip + release draft
│
├── src/
│   ├── background/
│   │   ├── index.ts            ← SW entry
│   │   ├── auth.ts             ← Token management
│   │   ├── calendar-sync.ts    ← Google + Outlook sync
│   │   ├── alarms.ts           ← Alarm scheduler
│   │   └── notifications.ts    ← Notification builder
│   │
│   ├── popup/
│   │   ├── index.html
│   │   ├── main.tsx
│   │   ├── App.tsx
│   │   ├── components/
│   │   │   ├── AuthGate.tsx
│   │   │   ├── LoginScreen.tsx
│   │   │   ├── CalendarGrid.tsx
│   │   │   ├── EventList.tsx
│   │   │   ├── EventCard.tsx
│   │   │   ├── EventModal.tsx
│   │   │   ├── QuickAddBar.tsx
│   │   │   ├── GlassHeader.tsx
│   │   │   └── ui/             ← Reusable UI atoms
│   │   ├── hooks/
│   │   │   ├── useCalendar.ts
│   │   │   ├── useAuth.ts
│   │   │   └── useStorage.ts
│   │   └── stores/
│   │       ├── authStore.ts    ← Zustand auth state
│   │       └── calendarStore.ts
│   │
│   ├── options/
│   │   ├── index.html
│   │   └── main.tsx
│   │
│   ├── offscreen/              ← Chrome OAuth helper
│   │   └── index.ts
│   │
│   ├── shared/
│   │   ├── types/
│   │   │   ├── event.ts
│   │   │   ├── auth.ts
│   │   │   └── storage.ts
│   │   ├── constants/
│   │   │   ├── api.ts
│   │   │   └── config.ts
│   │   ├── utils/
│   │   │   ├── crypto.ts       ← Token encryption
│   │   │   ├── date.ts         ← date-fns helpers
│   │   │   └── storage.ts      ← chrome.storage wrapper
│   │   └── api/
│   │       └── google-calendar.ts
│   │
│   └── assets/
│       ├── icons/              ← 16, 32, 48, 128px PNG
│       └── styles/
│           └── globals.css     ← CSS variables, glass tokens
│
├── public/
│   └── manifest.json           ← WXT generates this
│
├── tests/
│   ├── unit/
│   └── e2e/
│
├── .env.example                ← GOOGLE_CLIENT_ID
├── .eslintrc.json
├── .prettierrc
├── wxt.config.ts               ← WXT configuration
├── tsconfig.json
├── tailwind.config.ts
├── package.json
└── README.md
```

---

## 7. Permissions (Manifest)

```json
{
  "permissions": [
    "storage",       // chrome.storage.sync + local
    "alarms",        // Scheduled reminders
    "notifications", // Browser notifications
    "identity",      // OAuth flow
    "offscreen"      // Chrome: OAuth popup (Chrome only)
  ],
  "host_permissions": [
    "https://www.googleapis.com/*"        // Google Calendar API
  ]
}
```

> ⚠️ **Principle of Least Privilege:** Không request `tabs`, `activeTab`, `history`, `bookmarks` — không cần thiết. Chrome Web Store review sẽ từ chối nếu permissions không có lý do.

---

## 8. Security Checklist

```
✅ OAuth 2.0 PKCE — không dùng implicit flow
✅ Tokens stored AES-GCM encrypted trong chrome.storage.local
✅ Refresh tokens KHÔNG bao giờ sync lên chrome.storage.sync
✅ CSP strict trong manifest:
    content_security_policy: {
      extension_pages: "script-src 'self'; object-src 'none'"
    }
✅ Không dùng eval(), new Function(), innerHTML với data ngoài
✅ Input sanitization trước khi write vào storage
✅ API calls qua HTTPS only (host_permissions chỉ https://)
✅ npm audit trong CI pipeline
✅ Không log sensitive data (tokens, personal info)
✅ Token expiry check trước mọi API call
```

---

## 9. Cross-browser Compatibility

```typescript
// Dùng webextension-polyfill của Mozilla
import browser from "webextension-polyfill";

// Thay vì chrome.storage.sync.get(...)
// Dùng:
const data = await browser.storage.sync.get("events");

// Thay vì chrome.alarms.create(...)
await browser.alarms.create("sync", { periodInMinutes: 15 });
```

| API | Chrome MV3 | Firefox MV3 | Note |
|-----|-----------|-------------|------|
| `storage.sync` | ✅ | ✅ | Cần polyfill |
| `alarms` | ✅ | ✅ | Cần polyfill |
| `notifications` | ✅ | ✅ | Cần polyfill |
| `identity` | ✅ | ✅ | Firefox khác một chút |
| `offscreen` | ✅ | ❌ | Chrome only — có fallback |
| `action.openPopup()` | ✅ | ✅ MV3 | Cần user gesture |

---

## 10. CI/CD Pipeline (GitHub Actions)

```yaml
# .github/workflows/ci.yml
name: CI

on: [push, pull_request]

jobs:
  quality:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20' }
      - run: npm ci
      - run: npm run lint
      - run: npm run type-check
      - run: npm audit --audit-level moderate
      - run: npm test
      - run: npm run build

  release:
    if: startsWith(github.ref, 'refs/tags/v')
    needs: quality
    runs-on: ubuntu-latest
    steps:
      - run: npm run build
      # Edge và Chrome dùng chung 1 build (đều Chromium MV3)
      - run: zip -r extension-edge-chrome.zip dist/chrome/
      - run: zip -r extension-firefox.zip dist/firefox/
      - uses: softprops/action-gh-release@v1
        with:
          files: |
            extension-edge-chrome.zip
            extension-firefox.zip
```

---

## 11. Development Setup

```bash
# Clone và setup
git clone https://github.com/{username}/glass-reminder-extension
cd glass-reminder-extension
npm install

# Copy env
cp .env.example .env.local
# Điền GOOGLE_CLIENT_ID

# Dev mode — Edge (PRIMARY)
npm run dev          # Build Chrome MV3 → load vào Edge

# Load vào Edge:
# edge://extensions/ → Developer mode ON → Load unpacked → chọn .output/chrome-mv3/

# Dev mode — Firefox (secondary)
npm run dev:firefox

# Build production
npm run build        # Output: .output/chrome-mv3/ (dùng cho cả Edge + Chrome)

# Zip cho store submission
npm run zip
# → .output/extension-edge-chrome.zip  (submit lên Edge Add-ons)
# → .output/extension-firefox.zip
```

### Edge Add-ons Store submission
```
URL: https://partner.microsoft.com/dashboard/microsoftedge/
Đăng ký: Tài khoản Microsoft (cá nhân hoặc doanh nghiệp)
Phí: MIỄN PHÍ (không như Chrome Web Store $5)
Review time: 3-7 ngày làm việc
```

---

## 12. Roadmap

### Phase 1 — MVP trên Edge (4-6 tuần)
- [ ] Setup WXT project + TypeScript + React
- [ ] Google Calendar OAuth + basic event list
- [ ] Calendar UI (month view, day events)
- [ ] Add/Edit/Delete event (local + push to Google)
- [ ] Basic reminder notifications
- [ ] Glassmorphism UI dark theme
- [ ] **Submit lên Microsoft Edge Add-ons Store**

### Phase 2 — Polish (2-3 tuần)
- [ ] Animation system (Framer Motion)
- [ ] Light/Auto theme toggle
- [ ] Reminder snooze feature
- [ ] Options page (preferences)
- [ ] Multiple Google Calendar support (work, personal)

### Phase 3 — Mở rộng cross-browser (2-3 tuần)
- [ ] Test + fix trên Chrome
- [ ] Test + fix trên Firefox
- [ ] Event color coding
- [ ] Quick natural language input ("họp lúc 3pm ngày mai")
- [ ] Chrome Web Store submission
- [ ] Firefox Add-ons submission

---

*Spec này được generate từ nghiên cứu các repo: WXT, Plasmo, webextension-polyfill, và best practices từ Chrome Extension Developer Guide 2025.*
