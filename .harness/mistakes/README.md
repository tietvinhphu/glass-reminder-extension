# .harness/mistakes/ — Mistake Log

> Theo **Mitchell Hashimoto's Harness Engineering loop**: mỗi lần agent mắc lỗi, ta engineer giải pháp để lỗi đó **không bao giờ lặp lại**.

## Quy tắc vàng

1. **Mỗi mistake = 1 file JSON** (không Markdown — model ít tự ý sửa JSON)
2. **Đặt tên theo pattern:** `{{YYYY-MM-DD}}-{{slug}}.json`
3. **Fill đủ schema** — xem `.harness/templates/mistake-log.template.json`
4. **Sau khi log, PHẢI engineer fix** ở 1 trong 7 layers
5. **Verify trước khi đóng** — set `verified_at` + `verified_by`

## Workflow

```
Agent mắc lỗi
  ↓
User nói "log mistake này" (hoặc hook tự detect)
  ↓
Skill `harness-mistake-log` tạo file JSON từ template
  ↓
Fill 4 fields bắt buộc: mistake, root_cause, harness_fix, prevention
  ↓
Engineer fix ở layer xác định (L1-L7)
  ↓
Verify fix hoạt động → set verified_at
  ↓
Commit: "chore(harness): log mistake {{slug}} + apply fix"
```

## Đọc thêm

- [`../docs/03-mistake-loop.md`](../docs/03-mistake-loop.md) — Hashimoto loop operationalized
- [`../examples/mistake-to-hook.md`](../examples/mistake-to-hook.md) — case study: comment enforcement

## Ví dụ

- [`2026-06-16-no-vi-comment.example.json`](2026-06-16-no-vi-comment.example.json) — agent quên comment tiếng Việt → engineer PostToolUse hook
