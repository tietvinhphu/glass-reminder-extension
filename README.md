# 🔔 Glass Reminder

> Smart, privacy-first reminder extension for Microsoft Edge. 100% offline, glassmorphism UI, zero data collection.

[![Version](https://img.shields.io/badge/version-2.0.0-9775FA?style=for-the-badge)](https://github.com/tietvinhphu/glass-reminder-extension/releases)
[![Edge Add-on](https://img.shields.io/badge/Microsoft-Edge_Add--ons-2C84DB?style=for-the-badge&logo=microsoftedge&logoColor=white)](https://microsoftedge.microsoft.com/addons/detail/glass-reminder-extension/cihehijlflhokoobcdadgdfjgmlhmplp)
[![License](https://img.shields.io/badge/license-MIT-629987?style=for-the-badge)](LICENSE)
[![Build](https://img.shields.io/badge/build-passing-22C55E?style=for-the-badge)](https://github.com/tietvinhphu/glass-reminder-extension)

[🇻🇳 Tiếng Việt](README.md) · [🇺🇸 English](README.en.md) · [🌐 Landing page](https://tietvinhphu.github.io/glass-reminder-extension/)

---

## ✨ Features

- 🎯 **Visual date/time picker** — chọn ngày giờ chính xác, không cần nhớ format
- 🔔 **Reliable notifications** — cửa sổ glassmorphism + âm thanh, hoạt động cả khi đóng tab
- 🔁 **Auto repeat** — daily / weekly cho các reminder định kỳ
- 🔒 **Privacy-first** — tất cả data lưu local, AES-GCM encrypted, không server, không account
- 📴 **Offline-ready** — không cần internet, extension chạy hoàn toàn cục bộ
- ⚡ **Lightweight** — bundle chỉ ~1.7 MB, không lag, không background services

---

## 📸 Screenshots

> *(Sẽ cập nhật sau khi Microsoft Add-ons approve v2.0.0)*

| Popup | Alarm Overlay |
|-------|---------------|
| _coming soon_ | _coming soon_ |

---

## 🚀 Installation

### Microsoft Edge (Recommended)

1. Truy cập [Microsoft Edge Add-ons Store](https://microsoftedge.microsoft.com/addons/detail/glass-reminder-extension/cihehijlflhokoobcdadgdfjgmlhmplp)
2. Click **Get** → **Add extension**
3. Click icon Glass Reminder trên thanh toolbar → tạo reminder đầu tiên

### Manual install (Chrome / Edge dev mode)

1. Download `glass-reminder-extension-2.0.0-chrome.zip` từ [Releases](https://github.com/tietvinhphu/glass-reminder-extension/releases)
2. Giải nén ra thư mục
3. Mở `edge://extensions/` (hoặc `chrome://extensions/`)
4. Bật **Developer mode** (toggle góc trái)
5. Click **Load unpacked** → chọn thư mục vừa giải nén

### Firefox (Coming soon)

Firefox port đang trong kế hoạch v2.1.0.

---

## 🛠️ Development

### Tech stack

| Layer | Tech |
|-------|------|
| Framework | [WXT 0.20](https://wxt.dev/) + [Vite 8](https://vitejs.dev/) |
| UI | [React 19](https://react.dev/) + [Framer Motion 12](https://www.framer.com/motion/) |
| Language | [TypeScript 5.9](https://www.typescriptlang.org/) (strict mode) |
| Styling | CSS Modules (không Tailwind) |
| Date | [date-fns v4](https://date-fns.org/) |
| Test | [Vitest 4](https://vitest.dev/) + Testing Library |
| Crypto | Native WebCrypto API (AES-GCM 256-bit) |

### Prerequisites

- Node.js ≥ 20
- npm ≥ 10
- Microsoft Edge ≥ 110 (cho dev mode)

### Quick start

```bash
# Clone repo
git clone https://github.com/tietvinhphu/glass-reminder-extension.git
cd glass-reminder-extension

# Install deps (auto-runs `wxt prepare` qua postinstall hook)
npm install

# Dev mode — Edge tự mở với extension live-reload
npm run dev

# Run tests
npm test

# Type check
npm run type-check

# Build production zip (cho Microsoft Partner Center upload)
npm run zip
```

### Quality gate (BẮT BUỘC trước khi commit)

```bash
bash .harness/scripts/verify-config-change.sh
```

Chạy 3 bước theo thứ tự: **`wxt prepare`** → `npm run type-check` → `npm run test`.

**Tại sao?** Với WXT/Vite, `tsc --noEmit` pass KHÔNG đảm bảo `wxt prepare` pass. ViteNodeRunner load plugin context riêng. Xem [`memory/wxt-vite-prepare-gotcha.md`](memory/wxt-vite-prepare-gotcha.md).

### Project structure

```
glass-reminder-extension/
├── entrypoints/           ← WXT auto-loaded entry points
│   ├── background.ts      ← Alarm + message handler
│   ├── popup/             ← Browser toolbar popup (React)
│   └── alarm/main.tsx     ← Fullscreen alarm overlay window
│
├── src/                   ← Shared source code
│   ├── background/        ← Auth, alarm handlers
│   ├── popup/             ← Components, hooks, Zustand stores
│   ├── alarm/             ← Alarm overlay components
│   └── shared/            ← constants, types, utils (auth, crypto, storage)
│
├── tests/                 ← Vitest (mirror src/ structure)
│   ├── mocks/             ← Chrome + webextension-polyfill mocks
│   └── unit/              ← Unit tests
│
├── docs/                  ← GitHub Pages landing site
│   ├── index.html         ← Landing page
│   └── privacy-policy.html
│
├── public/icon/           ← Extension icons (16/32/48/96/128/300)
│
├── .claude/               ← Claude Code config
│   ├── docs/              ← Progressive disclosure (architecture, code style, ...)
│   ├── hooks/             ← PostToolUse hooks
│   └── skills/            ← Skills mirror (.agents/skills/)
│
├── .harness/              ← Harness Engineering framework
│   ├── mistakes/          ← Hashimoto mistake logs (JSON)
│   └── scripts/           ← Quality gate scripts
│
├── memory/                ← Persistent memory (GitHub source of truth)
│
├── wxt.config.ts          ← WXT framework config
├── vitest.config.ts       ← Vitest config
└── package.json
```

Đọc thêm: [`.claude/docs/architecture.md`](.claude/docs/architecture.md)

---

## 🧪 Testing

```bash
npm test                  # Single run (CI mode)
npm run test:watch        # Watch mode (dev)
npm run test:coverage     # Generate coverage report
```

Hiện tại: **35/35 tests passing** · **Vitest 4** + **@testing-library/react 16**

---

## 🤝 Contributing

PRs welcome! Vui lòng đọc [`CONTRIBUTING.md`](CONTRIBUTING.md) trước khi bắt đầu.

**Quy trình:**

1. Fork → tạo branch (`git checkout -b feat/amazing-feature`)
2. Chạy quality gate (`bash .harness/scripts/verify-config-change.sh`)
3. Viết tests trước (TDD Red → Green → Refactor)
4. Comment tiếng Việt cho mọi function/block logic phức tạp
5. Update CHANGELOG.md theo [Keep a Changelog](https://keepachangelog.com/)
6. Commit (Convention: `feat:`, `fix:`, `chore:`, `docs:`)
7. Mở PR → chờ review

---

## 🔒 Security

- Tokens được mã hóa **AES-GCM 256-bit** trước khi lưu `chrome.storage.local`
- Không có telemetry, không có analytics, không có server-side logging
- Báo cáo lỗ hổng: [SECURITY.md](SECURITY.md) hoặc email `tietvinhphu@gmail.com`

---

## 📜 License

[MIT License](LICENSE) © 2026 Vinh Phú

---

## 🙏 Acknowledgments

- Design system inspired by [Anthropic Claude](https://claude.com/) — warm cream + charcoal palette
- Built with [WXT](https://wxt.dev/) — the best web extension framework
- Icons + badges from [shields.io](https://shields.io/)

---

## 💬 Contact

- **GitHub Issues**: [github.com/tietvinhphu/glass-reminder-extension/issues](https://github.com/tietvinhphu/glass-reminder-extension/issues)
- **Email**: tietvinhphu@gmail.com
- **Landing page**: https://tietvinhphu.github.io/glass-reminder-extension/

---

<div align="center">

**[⬆ Back to top](#-glass-reminder)**

Made with ❤️ in Vietnam

</div>
