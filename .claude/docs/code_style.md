# Code Style — Glass Reminder Extension

> File này là **progressive disclosure** cho CLAUDE.md.
> Chỉ đọc khi viết/sửa code, không đọc cho architecture/architecture-only tasks.

## Quy tắc bắt buộc

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

### 2. TypeScript strict — no `any`

- `tsconfig.json` extends WXT-generated với `strict: true`
- Tuyệt đối KHÔNG dùng `any`. Dùng `unknown` + narrowing nếu cần.
- Interface props phải wrap trong `Readonly<Props>` (SonarQube S6759).

### 3. Dùng `webextension-polyfill`, không `chrome.*` trực tiếp

```typescript
// ✅ Đúng
import browser from "webextension-polyfill";
const data = await browser.storage.local.get("key");

// ❌ Sai
const data = await chrome.storage.local.get("key");
```

Lý do: Cross-browser (Edge/Chrome/Firefox), có sẵn TypeScript types, dễ mock.

### 4. Token chỉ lưu `chrome.storage.local` với AES-GCM encrypt

- Token KHÔNG BAO GIỜ lưu plain text
- Encrypt bằng AES-GCM 256-bit ([src/shared/utils/crypto.ts](../src/shared/utils/crypto.ts))
- Storage key: `auth:token` (xem [src/shared/utils/tokenStorage.ts](../src/shared/utils/tokenStorage.ts))

### 5. Không log sensitive data

- KHÔNG log token, refresh token, client secret, user email
- KHÔNG log error stack trace có chứa token
- Dùng `console.error` chỉ cho non-sensitive errors

## TDD — RED GREEN REFACTOR

```
🔴 RED    → Viết test → chạy → FAIL (đúng rồi)
🟢 GREEN  → Implement → chạy → PASS
🔵 REFACTOR → Clean + comment → tests vẫn PASS
```

Mock browser APIs: xem [tests/mocks/chrome.ts](../tests/mocks/chrome.ts) (singleton ChromeMock + windows.onRemoved cho alarm tests).

## SonarQube rules hay gặp

Xem [sonarqube_rules.md](sonarqube_rules.md) để biết 8 rule phổ biến + cách fix.

## Related docs

- [architecture.md](architecture.md) — Directory structure, key files
- [sonarqube_rules.md](sonarqube_rules.md) — SonarQube rules hay gặp
- [../INSTRUCTIONS.md](../INSTRUCTIONS.md) — Full coding standards
