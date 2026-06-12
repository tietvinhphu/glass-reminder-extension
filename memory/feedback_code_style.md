---
name: feedback-code-style
description: Quy tắc viết code bắt buộc trong project này — comment, TypeScript, security
metadata:
  type: feedback
---

Mọi function và block logic phức tạp PHẢI có comment tiếng Việt giải thích mục đích, lý do, param/return.

**Why:** Owner đang học — code không có comment = không học được gì. Yêu cầu cứng trong CLAUDE.md và INSTRUCTIONS.md.

**How to apply:**
- Không bao giờ viết code không có comment trong project này (ngược với default behavior của Claude Code)
- TypeScript strict, no `any`
- Token chỉ lưu `chrome.storage.local` với AES-GCM encrypt — không bao giờ `storage.sync`
- Dùng `webextension-polyfill` thay `chrome.*` trực tiếp
- Không log sensitive data (token, email)
