# TDD Workflow & Cursor Prompt Templates
> Điều phối viên: Claude | Dev: Cursor AI | Review: Owner
> Kỹ thuật: Red-Green-Refactor (Test-Driven Development)

---

## 🧪 TDD là gì và tại sao dùng

**Red-Green-Refactor cycle:**

```
🔴 RED    → Viết test MÔ TẢ behavior mong muốn → chạy → thấy FAIL (đúng rồi)
🟢 GREEN  → Viết code TỐI THIỂU để test pass → chạy → thấy PASS
🔵 REFACTOR → Clean code, tối ưu → tests vẫn PASS
```

**Tại sao cho browser extension:**
- Extension có nhiều async code (storage, API, alarms) → dễ bug ẩn
- Test mock browser APIs → không cần cài Extension mới biết code đúng không
- Mỗi feature có safety net → refactor không sợ break

---

## 🗺️ Toàn bộ luồng làm việc

```
Claude (điều phối)          Cursor (dev)                Owner (review)
─────────────────          ─────────────               ──────────────
Viết Cursor Prompt    →    Tạo branch feat/xxx
                           🔴 Viết failing tests
                           🟢 Implement feature
                           🔵 Refactor + lint
                           Push branch lên GitHub  →   Pull branch về
                                                        Check trong VSCode
                                                        (ESLint, Vitest, SonarLint)
                                                        OK → push lại
                                                        Tạo PR → merge main
```

---

## 📋 PHASE 1 — Cursor Prompts

### Prompt 1.1 — Project Setup

```
CONTEXT: Đọc INSTRUCTIONS.md và files/EXTENSION_SPEC.md trước.

TASK: Setup WXT project với đầy đủ config

BRANCH: feat/phase1-project-setup

🔴 VIẾT FAILING TESTS TRƯỚC:
Tạo tests/unit/config.test.ts với test:
- import.meta.env.VITE_GOOGLE_CLIENT_ID tồn tại và không rỗng
- webextension-polyfill import thành công
- CSS variables --glass-bg, --color-primary được define

🟢 IMPLEMENTATION:
1. npx wxt@latest init glass-reminder-extension (React + TypeScript template)
2. Cài dependencies:
   npm install webextension-polyfill framer-motion date-fns lucide-react zustand react-hook-form zod axios
   npm install -D vitest @testing-library/react @testing-library/jest-dom @vitest/coverage-v8
3. Tạo .env.example với VITE_GOOGLE_CLIENT_ID=
4. Tạo src/assets/styles/globals.css với CSS variables từ EXTENSION_SPEC.md section 5.1
5. Config vitest.config.ts với jsdom environment và chrome API mocks
6. Config tailwind.config.ts với custom glass tokens

DEFINITION OF DONE:
- npm test → xanh (config tests pass)
- npm run lint → zero warnings
- npm run type-check → zero errors
- npm run dev → WXT builds thành công
```

---

### Prompt 1.2 — Google OAuth

```
CONTEXT: Đọc INSTRUCTIONS.md và files/EXTENSION_SPEC.md section 3.
Branch phase1-project-setup đã merge vào main.

TASK: Implement Google OAuth 2.0 PKCE flow

BRANCH: feat/phase1-google-auth

🔴 VIẾT FAILING TESTS TRƯỚC:
Tạo tests/unit/auth.test.ts:
- generatePKCE() → trả về { codeVerifier: string, codeChallenge: string }
- codeChallenge phải là SHA-256 hash của codeVerifier (base64url)
- buildGoogleAuthURL({ clientId, redirectUri, challenge }) → URL hợp lệ có đủ params
- isExpiringSoon(token, bufferSeconds) → true nếu < bufferSeconds còn lại
- encryptToken(plaintext) → trả về string khác plaintext
- decryptToken(encryptToken(plaintext)) → bằng plaintext ban đầu

Tạo tests/unit/tokenStorage.test.ts:
- storeToken() phải gọi chrome.storage.local.set (không phải .sync)
- getToken() → null nếu chưa có
- getToken() sau storeToken() → trả về token đúng

🟢 IMPLEMENTATION:
1. src/shared/utils/crypto.ts — generatePKCE, encryptToken, decryptToken (Web Crypto API)
2. src/shared/utils/auth.ts — buildGoogleAuthURL, isExpiringSoon
3. src/shared/utils/tokenStorage.ts — storeToken, getToken, clearToken
4. src/background/auth.ts — launchGoogleOAuth, refreshGoogleToken, getValidGoogleToken
5. src/popup/stores/authStore.ts — Zustand store: isLoggedIn, user, login(), logout()
6. src/popup/hooks/useAuth.ts — hook wrapper cho authStore
7. src/popup/components/AuthGate.tsx — check auth, render LoginScreen hoặc children
8. src/popup/components/LoginScreen.tsx — "Sign in with Google" button, glass style

SECURITY CHECK (bắt buộc trong code review):
- [ ] chrome.storage.local ONLY cho tokens (không .sync)
- [ ] AES-GCM encrypt trước khi store
- [ ] Không console.log token

DEFINITION OF DONE:
- npm test → tất cả auth tests xanh
- Load extension trong edge://extensions/ → click icon → thấy Login screen
- Click Sign in → Google OAuth popup mở → login thành công → thấy main app
```

---

### Prompt 1.3 — Calendar Grid UI

```
CONTEXT: Đọc INSTRUCTIONS.md section UI/UX Rules.
feat/phase1-google-auth đã merge.

TASK: Build Calendar UI — MonthGrid + EventList + EventCard

BRANCH: feat/phase1-calendar-grid

🔴 VIẾT FAILING TESTS TRƯỚC:
Tạo tests/unit/dateHelpers.test.ts:
- getDaysInMonth(2026, 5) → 30
- getFirstDayOfMonth(2026, 6) → 1 (Monday)
- formatEventTime("2026-06-15T09:00:00") → "9:00 AM"
- isToday(new Date()) → true
- isToday(new Date("2020-01-01")) → false

Tạo tests/components/CalendarGrid.test.tsx:
- Render đúng số ngày của tháng
- Highlight ngày hôm nay
- Click vào ngày → onDaySelect được gọi với đúng date
- Có navigation prev/next month

Tạo tests/components/EventCard.test.tsx:
- Render event title, time
- Click → onEdit được gọi
- Render reminder badge nếu có reminders
- Không render description nếu undefined

🟢 IMPLEMENTATION:
1. src/shared/utils/date.ts — getDaysInMonth, formatEventTime, isToday, v.v.
2. src/popup/components/CalendarGrid.tsx — MonthGrid với prev/next navigation
3. src/popup/components/EventList.tsx — list events của ngày được chọn
4. src/popup/components/EventCard.tsx — single event card (glass style)
5. src/popup/components/GlassHeader.tsx — date display + account avatar + sync indicator
6. src/popup/hooks/useCalendar.ts — state: selectedDate, currentMonth, navigation

UI REQUIREMENTS (từ spec):
- Popup: exactly 380px wide
- Glass card: backdrop-filter blur(20px), bg rgba(255,255,255,0.08)
- No emoji — Lucide icons only
- Skeleton loading khi fetch events

DEFINITION OF DONE:
- npm test → calendar + date helper tests xanh
- UI render đúng month grid
- Click ngày → event list update
- Prev/Next month navigation hoạt động
```

---

### Prompt 1.4 — Event CRUD

```
CONTEXT: feat/phase1-calendar-grid đã merge.
Đọc files/EXTENSION_SPEC.md section 4 cho data schema.

TASK: Add / Edit / Delete events (local + Google Calendar sync)

BRANCH: feat/phase1-event-crud

🔴 VIẾT FAILING TESTS TRƯỚC:
Tạo tests/unit/eventStorage.test.ts:
- saveEvent(event) → chrome.storage.sync.set được gọi
- getEvents() → trả về array
- getEvents() sau saveEvent(event) → chứa event đó
- deleteEvent(id) → event bị xóa khỏi list
- getEventsForDay(date) → chỉ trả về events của ngày đó

Tạo tests/unit/googleCalendarApi.test.ts:
- createGoogleEvent(event) → gọi đúng endpoint POST
- updateGoogleEvent(id, event) → gọi PATCH endpoint
- deleteGoogleEvent(id) → gọi DELETE endpoint
- fetchGoogleEvents(calendarId) → trả về CalendarEvent[]

Tạo tests/components/EventModal.test.tsx:
- Render form với title, date, time, reminder fields
- Submit với title rỗng → validation error hiện
- Submit hợp lệ → onSave được gọi với event data
- Delete button → confirm dialog → onDelete được gọi

🟢 IMPLEMENTATION:
1. src/shared/utils/eventStorage.ts — CRUD wrapper cho chrome.storage.sync
2. src/shared/api/google-calendar.ts — fetchEvents, createEvent, updateEvent, deleteEvent
3. src/popup/components/EventModal.tsx — Add/Edit modal (React Hook Form + Zod validation)
4. src/popup/components/QuickAddBar.tsx — fast inline event creation
5. src/popup/stores/calendarStore.ts — Zustand: events[], addEvent, editEvent, deleteEvent

VALIDATION SCHEMA (Zod):
- title: string min 1, max 100
- startTime: valid ISO 8601
- endTime: sau startTime
- reminderMinutes: 5 | 10 | 15 | 30 | 60 | 1440

DEFINITION OF DONE:
- npm test → tất cả CRUD tests xanh
- Add event → xuất hiện trong calendar
- Edit event → changes saved
- Delete event → confirm → removed
- Events persist sau khi đóng/mở popup lại
```

---

### Prompt 1.5 — Notifications & Alarms

```
CONTEXT: feat/phase1-event-crud đã merge.
Đọc files/EXTENSION_SPEC.md section 2.4 cho service worker flow.

TASK: Background service worker — alarm scheduling + notifications

BRANCH: feat/phase1-notifications

🔴 VIẾT FAILING TESTS TRƯỚC:
Tạo tests/unit/alarms.test.ts:
- scheduleReminder(event) → chrome.alarms.create được gọi đúng tên alarm
- tên alarm format: "reminder-{eventId}-{minutesBefore}"
- clearReminder(eventId) → chrome.alarms.clear được gọi
- getUpcomingEvents(events, withinMinutes) → chỉ events trong khoảng thời gian đó

Tạo tests/unit/notifications.test.ts:
- buildNotification(event) → object có type, title, message, iconUrl
- showNotification(event) → chrome.notifications.create được gọi
- message phải mention số phút còn lại

🟢 IMPLEMENTATION:
1. src/background/alarms.ts — scheduleReminder, clearReminder, clearAllReminders
2. src/background/notifications.ts — buildNotification, showNotification
3. src/background/calendar-sync.ts — periodic sync mỗi 15 phút
4. src/background/index.ts — SW entry: onInstall, onAlarm listener, onNotificationClick

SERVICE WORKER RULES:
- Không store state trong memory — dùng chrome.storage làm source of truth
- onInstall → setupAlarms() → refreshTokens()
- onAlarm "sync" → syncCalendars() → scheduleReminders()
- onAlarm "reminder-*" → showNotification()

DEFINITION OF DONE:
- npm test → alarm + notification tests xanh
- Tạo event với reminder 15 phút → đúng 15 phút trước → browser notification xuất hiện
- Click notification → popup mở
```

---

## 🔍 Review Checklist cho Owner (sau khi pull branch về)

```
Trong VSCode, check theo thứ tự:

1. VITEST PANEL (sidebar)
   → Tất cả tests xanh không?
   → Coverage > 70% cho file được test không?

2. COVERAGE GUTTERS
   → Có dòng đỏ (uncovered) trong logic quan trọng không?

3. ESLINT + SONAR
   → Problems panel (Ctrl+Shift+M) có warning/error không?
   → SonarLint detect security issue không?

4. MANUAL TEST TRONG EDGE
   → edge://extensions/ → Load unpacked → chọn .output/chrome-mv3/
   → Test flow của feature vừa implement

5. Nếu OK → git push → tạo PR → merge main
   Nếu có vấn đề → comment trong VSCode → push lại → Cursor fix
```

---

*Template v1.0 | Cập nhật khi có feature mới trong Phase 2, 3*
