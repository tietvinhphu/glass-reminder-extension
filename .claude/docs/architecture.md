# Architecture — Glass Reminder Extension

> File này là **progressive disclosure** cho CLAUDE.md.
> Chỉ đọc khi task liên quan đến architecture, file structure, hoặc entry points.

## Directory layout

```
glass-reminder-extension/
├── entrypoints/              ← WXT entry points (auto-loaded by framework)
│   ├── background.ts         ← background script (alarm + message handler)
│   ├── popup/                ← browser toolbar popup
│   │   ├── main.tsx          ← React root
│   │   └── App.tsx           ← popup shell
│   └── alarm/main.tsx        ← fullscreen alarm overlay window
│
├── src/                      ← shared source code
│   ├── background/           ← background-only logic (auth, alarms)
│   ├── popup/                ← popup-only React components/hooks/stores
│   │   ├── components/       ← ReminderApp, ReminderList, CalendarPicker, ...
│   │   ├── hooks/            ← useAuth (auth state subscription)
│   │   └── stores/           ← Zustand stores (authStore, ...)
│   ├── alarm/                ← alarm overlay components
│   └── shared/               ← code shared giữa background + popup + alarm
│       ├── constants/        ← api.ts, manifest.ts, contentScript.ts
│       ├── types/            ← auth.ts, reminder.ts, authMessages.ts
│       └── utils/            ← auth, crypto (AES-GCM), tokenStorage, reminderStorage
│
├── tests/                    ← Vitest
│   ├── setup.ts              ← global chrome mock setup
│   ├── mocks/                ← chrome.ts, webextension-polyfill.ts
│   ├── utils/                ← test-only helpers (matchPatterns.ts)
│   └── unit/                 ← unit tests (mirror src/ structure)
│
├── .claude/                  ← Claude Code config
│   ├── docs/                 ← progressive disclosure docs (file này ở đây)
│   ├── hooks/                ← PostToolUse hooks (skill-drift detection, ...)
│   └── skills/               ← mirror .agents/skills/ cho Claude auto-load
│
├── .agents/skills/           ← Skills (canonical source)
├── .harness/                 ← Harness Engineering framework
│   ├── mistakes/             ← JSON mistake logs (Hashimoto loop)
│   ├── scripts/              ← Quality gate scripts (verify-config-change.sh)
│   └── templates/            ← mistake-log.template.json, ...
│
├── memory/                   ← Persistent memory (GitHub source of truth)
│   └── MEMORY.md             ← Index — đọc file này trước
│
├── wxt.config.ts             ← WXT framework config (manifest + Edge binary)
├── tsconfig.json             ← extends .wxt/tsconfig.json (WXT-generated)
├── vitest.config.ts          ← Vitest config
├── package.json              ← scripts + dependencies
│
├── CLAUDE.md                 ← Claude Code instructions (entry point)
├── INSTRUCTIONS.md           ← Coding standards + security rules
├── HARNESS.md                ← Harness Engineering framework reference
├── AGENTS.md                 ← Universal agent instructions
└── README.md                 ← Project README
```

## Key files (entry points)

| Concern | File |
|---|---|
| Background lifecycle | [entrypoints/background.ts](../entrypoints/background.ts) |
| Popup UI root | [entrypoints/popup/App.tsx](../entrypoints/popup/App.tsx) |
| Alarm overlay | [entrypoints/alarm/main.tsx](../entrypoints/alarm/main.tsx) |
| Manifest config | [wxt.config.ts](../wxt.config.ts) |
| Type definitions | [src/shared/types/](../src/shared/types/) |
| Constants (manifest perms, API endpoints) | [src/shared/constants/manifest.ts](../src/shared/constants/manifest.ts) |
| Auth flow | [src/background/auth.ts](../src/background/auth.ts) |
| Token storage (AES-GCM encrypted) | [src/shared/utils/tokenStorage.ts](../src/shared/utils/tokenStorage.ts) |
| Reminder storage | [src/shared/utils/reminderStorage.ts](../src/shared/utils/reminderStorage.ts) |
| Popup state (Zustand) | [src/popup/stores/authStore.ts](../src/popup/stores/authStore.ts) |

## Cross-cutting concerns

- **Path aliases**: KHÔNG dùng. Dùng relative paths (em đã chuyển đổi 2026-06-21 sau khi vite-tsconfig-paths không apply được trong WXT prepare).
- **Imports**: Dùng `webextension-polyfill` (không gọi `chrome.*` trực tiếp).
- **State**: Zustand stores cho popup. Không có Redux/Context global.
- **Styling**: CSS Modules (`App.css`, `style.css` + per-component `.css`). KHÔNG Tailwind.
- **Animation**: Framer Motion 12.
- **Date**: date-fns v4.
- **OAuth**: Google OAuth 2.0 PKCE flow trong [src/shared/utils/auth.ts](../src/shared/utils/auth.ts).

## WXT/Vite gotcha

> **Quan trọng:** ViteNodeRunner (WXT prepare) load plugin context riêng.
> `tsc --noEmit` pass KHÔNG đảm bảo `wxt prepare` pass.
> Sau MỌI config change (tsconfig/wxt.config/vite plugin/package deps),
> chạy: `bash .harness/scripts/verify-config-change.sh`
> Xem [memory/wxt-vite-prepare-gotcha.md](../memory/wxt-vite-prepare-gotcha.md).

## Team workflow

```
CLAUDE       → Điều phối, lên plan, dạy concept, viết prompt
CURSOR AGENT → Nhận prompt, viết code + test, giải thích từng dòng
OWNER        → Học, review, copy code về local VSCode kiểm tra
LOCAL VSCODE → Quality gate cuối: ESLint, SonarLint, Vitest, Coverage
GITHUB MAIN  → Source of truth sau khi owner confirm
AUTOMATIONS  → Background: vulnerabilities, bugs, CI failures
```

**CURSOR AGENT không tự tạo PR** — owner quyết định push lên main.

## Related docs

- [code_style.md](code_style.md) — Comment rules, no-any, webextension-polyfill
- [sonarqube_rules.md](sonarqube_rules.md) — 8 SonarQube rules hay gặp
- [../INSTRUCTIONS.md](../INSTRUCTIONS.md) — Coding standards, security rules
- [../HARNESS.md](../HARNESS.md) — Harness framework reference
