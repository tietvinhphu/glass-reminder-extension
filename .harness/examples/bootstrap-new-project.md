# Walkthrough: Tạo dự án mới từ Harness Framework

> Đây là ví dụ đầy đủ về cách dùng framework để bootstrap dự án mới trong 30 giây.

---

## Scenario

Anh muốn tạo dự án mới: **SaaS dashboard** cho sale team, dùng Next.js 15 + TypeScript, deploy lên Vercel.

**Yêu cầu:**
- Áp dụng được ngay workflow solo founder (TDD, comment tiếng Việt, SonarQube)
- Có memory system, mistake log, hooks sẵn
- Không phải copy-paste từ dự án cũ (sẽ leak convention không liên quan)

---

## Bước 0 — Chuẩn bị (1 phút)

Verify framework source repo available:
- Path: `path/to/source-repo` (vd: `glass-reminder-extension` nếu đang dùng repo này)
- File `HARNESS.md` tồn tại
- `.harness/scripts/init-harness.ps1` tồn tại

```powershell
Test-Path path\to\source-repo\.harness\scripts\init-harness.ps1
# Expected: True
```

---

## Bước 1 — Tạo thư mục mới (10 giây)

```powershell
# Ở thư mục cha muốn chứa project mới
mkdir sales-dashboard
cd sales-dashboard
```

---

## Bước 2 — Copy framework sang (5 giây)

```powershell
# Copy .harness/ từ source repo
Copy-Item -Recurse ..\path\to\source-repo\.harness .

# Verify
Get-ChildItem .harness
# Expected: README.md, principles.md, templates/, scripts/, mistakes/, examples/, docs/
```

---

## Bước 3 — Bootstrap (15 giây)

```powershell
.\.harness\scripts\init-harness.ps1 `
  -ProjectName "sales-dashboard" `
  -Stack "Next.js 15 + TypeScript + Tailwind v4" `
  -Purpose "SaaS dashboard for sales team — track leads, deals, revenue" `
  -DeployTarget "Vercel"
```

**Output mong đợi:**
```
🚀 Bootstrapping sales-dashboard từ Harness Framework...
   Stack: Next.js 15 + TypeScript + Tailwind v4
   Purpose: SaaS dashboard for sales team — track leads, deals, revenue
   Deploy: Vercel

  ✓ CLAUDE.md
  ✓ AGENTS.md
  ✓ INSTRUCTIONS.md
  ✓ .cursorrules
  ✓ .claude\settings.json
  ✓ memory\MEMORY.md
  ✓ .harness\mistakes\template.json
  ✓ .claude\hooks\sync-memory.sh
  ✓ .claude\hooks\sync-memory.ps1

✅ Project sales-dashboard đã được bootstrap thành công!
📁 Location: C:\...\sales-dashboard
🚀 Next steps:
   cd sales-dashboard
   code .
```

---

## Bước 4 — Customize (2-5 phút)

### 4a. Sửa CLAUDE.md, INSTRUCTIONS.md, AGENTS.md
- Thay placeholder còn sót
- Thêm project-specific rules (vd: "Database: PostgreSQL", "API: REST với tRPC")

### 4b. Thêm memories vào `memory/`
- Tạo `user_profile.md` nếu dùng cho user mới
- Tạo `project_status.md` cho dự án mới
- Tạo `feedback_code_style.md` nếu có convention riêng

### 4c. Cài base skills (optional nhưng recommended)
```powershell
# Cài TDD + brainstorming + verification skills
npx skills find test-driven-development --yes
npx skills find brainstorming --yes
npx skills find verification-before-completion --yes
```

### 4d. Tạo first commit trên main branch
```powershell
git branch -M main
git remote add origin https://github.com/username/sales-dashboard.git
git push -u origin main
```

---

## Bước 5 — Verify (30 giây)

```powershell
# Chạy health check
bash .harness/scripts/check-harness-health.sh
```

**Output mong đợi:**
```
🔍 Checking Harness Framework health...

📂 [L2] Memory system...
  ✓ 0 memory files found
  ✓ MEMORY.md index exists

🎯 [L3] Skills...
  ✓ 0 skills installed in .agents/

🪝 [L4] Hooks...
  ✓ 2 hooks configured
  ✓ harness-health.sh exists
  ✓ check-vi-comment.sh missing  ← sau khi cài skills sẽ có
  ✓ sync-memory.sh exists

📋 [L5] Mistake log...
  ✓ 0 mistakes logged yet
  ✓ README present

📜 [L6] Workflows...
  ✓ 2 bootstrap scripts present

📖 [L1] Identity...
  ✓ HARNESS.md present

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Harness healthy! All systems operational.
```

---

## Kết quả

**Project mới có ngay:**
- 9 files templated với project info đã substitute
- `.harness/mistakes/` sẵn sàng log
- 3 hooks: SessionStart (health), PostToolUse (vi-comment), Stop (sync)
- Memory system với index + template cho 6 loại memory chuẩn
- First commit với message chuẩn

**Thời gian tổng:** <5 phút (so với 30-60 phút copy-paste từ dự án cũ).

**Lợi ích dài hạn:**
- Mỗi mistake trong project mới → log vào `.harness/mistakes/`
- Engineer fix 1 lần → áp dụng cho TẤT CẢ project (nếu copy lại framework)
- Harness ngày càng tốt hơn theo thời gian → compound learning

---

## Tips

1. **Backup framework:** Khi update `.harness/` trong source repo, các project con KHÔNG tự động update. Cần quyết định: framework là "pinned version" (mỗi project tự quản) hay "shared library" (git submodule).

2. **Customize per project:** Mỗi dự án có thể:
   - Thêm mistake log riêng
   - Thêm skill riêng
   - Modify templates (sau khi copy về)

3. **Versioning:** Khi `HARNESS.md` thay đổi major (vd: v1.0 → v2.0), cần migration guide cho các project cũ.

→ Quay lại [`../README.md`](../README.md) hoặc [`../../HARNESS.md`](../../HARNESS.md).
