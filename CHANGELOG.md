# Changelog — Glass Reminder Extension

Tất cả thay đổi đáng chú ý sẽ được ghi vào file này.

Format dựa theo [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
project tuân thủ [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [2.0.0] - 2026-06-21 — "Liquid Glass + Local Mode"

### 🎨 UI redesign — Liquid Glass

- **Popup**: đổi từ "banking red" theme sang **liquid glass dark crimson** với frosted glass cards
- **Background**: gradient trung tính sáng thay cho nền đỏ (SonarQube S7924 contrast fix)
- **Buttons**: cải thiện btn-edit / btn-delete contrast
- **Compatibility**: thêm `-webkit-backdrop-filter` cho Safari support

### 🔔 Alarm overlay mới

- **Âm thanh**: thêm audio khi alarm fire (notification không đủ attention)
- **Multi-alarm**: hỗ trợ nhiều reminder fire cùng lúc
- **Pre-warning**: nhắc trước X phút
- **Window resize**: overlay tự đo chiều cao, gửi RESIZE_WINDOW message về background
- **Fix bug notification**: notification không bắn khi alarm fire

### 🏠 Local mode (BREAKING CHANGE)

- **Xóa OAuth flow**: extension chạy hoàn toàn local, không gọi Google API
- **Xóa `identity` + `offscreen` permissions** khỏi manifest
- **Host permissions rỗng** (`REQUIRED_HOST_PERMISSIONS = []`)
- **Impact cho user 1.x**: cần gỡ extension cũ và cài lại — settings không migrate
- **Lý do**: privacy-first, không cần Google account, đơn giản hóa UX

### 🔒 Security hardening (Snyk Code)

- **XSS fix**: loại bỏ unsafe HTML rendering trong popup components
- **Path traversal fix**: validate input path trong skill scripts
- **HTTP cleartext fix**: enforce HTTPS only cho mọi URL
- **SHA1 → SHA-256**: upgrade crypto hash algorithm
- **22 Snyk warnings** resolved trong 2.0.0

### 🛠️ Engineering

- **Harness framework**: tích hợp Hashimoto mistake loop + 7 layers (L1-L7)
- **Skills system**: 13 skills auto-loaded (brainstorming, TDD, glassmorphism, ...)
- **Memory layer**: persistent memory trong `memory/` (GitHub source of truth)
- **Mistake logs**: 2 mistakes logged với L7 quality gate fix
- **Icon redesign**: 6 icon sizes (16/32/48/96/128/300) đồng nhất chuông tím glass
- **Relative imports**: bỏ alias `@/`, dùng relative paths (WXT/ViteNodeRunner compatibility)

### 📝 Documentation

- **CLAUDE.md** rút gọn từ 217 → 102 dòng (progressive disclosure)
- **`.claude/docs/`**: 3 file mới (architecture, code_style, sonarqube_rules)
- **`HARNESS.md`**: framework reference đầy đủ

---

## [1.0.0] - 2026-06-08 — Initial release

- Reminder CRUD cơ bản (create / list / edit / delete)
- Google OAuth 2.0 PKCE + Google Calendar API v3
- AES-GCM encrypted token storage
- Glass-morphism popup UI (early version)
- Microsoft Edge Add-ons approved
