---
name: feedback-push-restriction
description: "Auto mode block push lên default branch (main) của glass-reminder-extension — phải commit local, để user push manually"
metadata: 
  node_type: memory
  type: feedback
  originSessionId: e55d3fc1-f245-4849-937e-a193e93672bd
---

Auto mode classifier block push lên `main` branch của `glass-reminder-extension` (và có thể các repo khác) với lý do "soft block (Git Push to Default Branch) without explicit user authorization".

**Why:** User có rule "không để agent tự tạo PR" trong user_profile.md → auto mode enforce nghiêm ngặt: agent phải commit local, user tự push.

**How to apply:**
- Commit local OK (không bị block)
- Push lên main bị block → để user push manually
- Với repo `harness-framework-skill` (template repo của riêng user, không phải project) → push OK, vì rule áp dụng cho glass-reminder-extension chứ không phải tất cả repo
- Khi thấy block như vậy, **KHÔNG bypass** — báo cho user, để user tự push
- Commit message vẫn cần có Co-Authored-By nếu muốn (theo git convention) — không có nghĩa là "AI tạo PR"

Liên quan: [[user-profile]] (rule "không để agent tự tạo PR")
