---
name: harness-bootstrap
description: "Tạo dự án mới từ Harness Framework templates. Use khi user nói 'tạo project mới', 'bootstrap từ framework', 'init dự án mới'."
---

# Harness Bootstrap

Skill này tạo dự án mới từ **Harness Framework templates** trong 30 giây. Áp dụng được cho mọi dự án: web app, mobile app, CLI, library, browser extension, v.v.

<HARD-GATE>
Không được tạo project mà KHÔNG có `.harness/` trong source repo. Nếu không có, báo lỗi và hướng dẫn user setup trước.
</HARD-GATE>

## Khi nào dùng

- User nói: "tạo project mới", "bootstrap từ framework", "init dự án mới dùng harness", "apply framework vào project X"
- Bắt đầu 1 dự án fresh, muốn có sẵn memory + hooks + skills + mistake log

## Workflow

### 1. Verify framework source

```bash
# Check .harness/ tồn tại trong source repo (cwd hoặc parent)
if [ ! -d ".harness" ] && [ ! -d "../.harness" ]; then
  echo "❌ Không tìm thấy .harness/ — phải copy từ framework source repo trước"
  exit 1
fi
```

### 2. Thu thập thông tin dự án

Hỏi user 4 fields bắt buộc:

| Field | Câu hỏi ví dụ |
|---|---|
| `ProjectName` | "Tên project? (vd: sales-dashboard, my-cli)" |
| `Stack` | "Stack? (vd: Next.js 15 + TS, Python + FastAPI, Rust + Actix)" |
| `Purpose` | "Mục đích chính? 1 dòng mô tả" |
| `DeployTarget` | "Deploy đâu? (vd: Vercel, AWS, self-hosted, Edge Add-ons)" — default Vercel |

### 3. Verify môi trường

```powershell
# Check prerequisites
Test-Path .harness\scripts\init-harness.ps1
Test-Path .harness\templates\CLAUDE.template.md
Get-Command git
```

### 4. Chạy bootstrap script

```powershell
# Trong thư mục cha của project mới
.\.harness\scripts\init-harness.ps1 `
  -ProjectName "<name>" `
  -Stack "<stack>" `
  -Purpose "<purpose>" `
  -DeployTarget "<deploy>"
```

**Output mong đợi:**
```
🚀 Bootstrapping <name> từ Harness Framework...
  ✓ CLAUDE.md
  ✓ AGENTS.md
  ✓ INSTRUCTIONS.md
  ✓ .cursorrules
  ✓ .claude\settings.json
  ✓ memory\MEMORY.md
  ✓ .harness\mistakes\template.json
  ✓ .claude\hooks\sync-memory.sh
  ✓ .claude\hooks\sync-memory.ps1

✅ Project <name> đã được bootstrap thành công!
```

### 5. Customize cho dự án cụ thể

Sau khi bootstrap, hướng dẫn user customize:

1. **Sửa 4 file instructions** (CLAUDE.md, AGENTS.md, INSTRUCTIONS.md, .cursorrules):
   - Thay placeholder còn sót
   - Thêm project-specific rules

2. **Tạo memories:**
   - `user_profile.md` (nếu cần)
   - `project_status.md`
   - `feedback_code_style.md` (convention riêng)

3. **Cài skills** (nếu cần):
   ```powershell
   npx skills find test-driven-development --yes
   npx skills find brainstorming --yes
   npx skills find verification-before-completion --yes
   ```

4. **First push:**
   ```powershell
   cd <project-name>
   git branch -M main
   git remote add origin <url>
   git push -u origin main
   ```

### 6. Verify

```powershell
# Trong project mới
bash .harness/scripts/check-harness-health.sh
```

**Expected:** tất cả 7 layers (L1-L7) có indicator xanh hoặc vàng (không đỏ).

### 7. Báo cáo cho user

Output bằng tiếng Việt:
```
✅ Đã bootstrap xong project <name>!

📁 Location: <path>
🎯 Stack: <stack>
🚀 Deploy: <deploy>

📋 Checklist tiếp theo:
  ☐ Sửa 4 file instructions (CLAUDE.md, AGENTS.md, INSTRUCTIONS.md, .cursorrules)
  ☐ Thêm memories (user_profile, project_status, code_style)
  ☐ Cài skills cần thiết (npx skills find <query> --yes)
  ☐ Customize hooks trong .claude/settings.json nếu cần
  ☐ First commit + push lên GitHub

💡 Tip: Mỗi mistake sau này, dùng skill `harness-mistake-log` để log + engineer fix.
```

## Templates được áp dụng

| Template | Thành file |
|---|---|
| `CLAUDE.template.md` | `CLAUDE.md` |
| `AGENTS.template.md` | `AGENTS.md` |
| `INSTRUCTIONS.template.md` | `INSTRUCTIONS.md` |
| `.cursorrules.template` | `.cursorrules` |
| `settings.template.json` | `.claude/settings.json` |
| `MEMORY.template.md` | `memory/MEMORY.md` |
| `mistake-log.template.json` | `.harness/mistakes/template.json` |
| `sync-memory.template.sh` | `.claude/hooks/sync-memory.sh` |
| `sync-memory.template.ps1` | `.claude/hooks/sync-memory.ps1` |

## Placeholders được thay

- `{{PROJECT_NAME}}` → tên dự án
- `{{STACK}}` → tech stack
- `{{PURPOSE}}` → mục đích
- `{{DEPLOY_TARGET}}` → nơi deploy
- `{{DATE}}` → ngày bootstrap
- `{{UUID}}` → UUID v4

## Anti-patterns

❌ "Copy thủ công từ project cũ" — sẽ leak convention không liên quan
❌ "Bỏ qua templates, tự viết từ đầu" — mất lợi thế compound learning
❌ "Modify framework trong project mới" — fork sớm, mất cập nhật từ source

## Ví dụ đầy đủ

Xem `.harness/examples/bootstrap-new-project.md`.
