---
name: reference-harness-framework
description: Harness Engineering framework v1.0 — 7 layers, mistake loop, templates để bootstrap dự án mới
metadata:
  type: reference
---

# Harness Engineering Framework

> Framework được build theo tư duy của **Mitchell Hashimoto** (2/2026): "Mỗi khi agent mắc lỗi → engineer giải pháp để không bao giờ lặp lại."

## 3 files quan trọng nhất

1. [`HARNESS.md`](../HARNESS.md) — master framework doc (~250 dòng), bắt đầu đọc ở đây
2. [`.harness/README.md`](../.harness/README.md) — quickstart 1 trang
3. [`.harness/principles.md`](../.harness/principles.md) — 7 nguyên tắc cốt lõi

## 7 Layers (tổng quan)

| # | Layer | File mapping |
|---|---|---|
| L1 | Identity | `HARNESS.md` + `.harness/principles.md` |
| L2 | Memory | `memory/` (3-tier theo Anthropic pattern) |
| L3 | Skills | `.claude/skills/` + `.agents/skills/` |
| L4 | Hooks | `.claude/settings.json` + `.claude/hooks/*.sh` |
| L5 | State | `.harness/mistakes/*.json` |
| L6 | Workflows | `.harness/scripts/` |
| L7 | Quality Gates | SonarQube + Vitest + ESLint |

## 2 custom skills (mới thêm)

- `harness-mistake-log` — workflow log mistake + engineer fix ở 1 trong 7 layers
- `harness-bootstrap` — workflow tạo project mới từ templates

## 3 hooks mới (đã thêm vào settings.json)

- `SessionStart` → `harness-health.sh` (hiển thị health summary)
- `PostToolUse` → `check-vi-comment.sh` (reject .ts/.tsx thiếu comment tiếng Việt)
- `PreCompact` → `summarize-mistakes.sh` (snapshot mistake log trước khi context bị nén)

## Mistake Loop (Hashimoto operationalized)

```
1. DETECT → 2. LOG → 3. ENGINEER FIX → 4. VERIFY
```

- **DETECT:** user nói "log mistake này" hoặc hook tự phát hiện
- **LOG:** tạo file `.harness/mistakes/{{DATE}}-{{SLUG}}.json` (JSON, không Markdown)
- **ENGINEER FIX:** xác định layer thiếu (L1-L7) → tạo skill/hook/template/memory/script
- **VERIFY:** test fix hoạt động → set `verified_at` + commit

## Bootstrap dự án mới

```powershell
mkdir new-project && cd new-project
Copy-Item -Recurse ..\this-repo\.harness .
.\.harness\scripts\init-harness.ps1 -ProjectName "new-project" -Stack "..." -Purpose "..."
```

Chi tiết: [`.harness/examples/bootstrap-new-project.md`](../.harness/examples/bootstrap-new-project.md)

## Ví dụ mistake → fix

[`Harness Framework`](../.harness/mistakes/2026-06-16-no-vi-comment.example.json) + [case study](../.harness/examples/mistake-to-hook.md)

---

**Why:** Solo founder không có team review code → harness = "team" tự động (hooks = reviewer, skills = playbook, mistake log = post-mortem DB).

**How to apply:**
- Mỗi lần agent mắc lỗi → invoke skill `harness-mistake-log` → engineer fix
- Khi tạo dự án mới → dùng `init-harness.ps1` để copy framework
- Mỗi tuần check `bash .harness/scripts/check-harness-health.sh`
