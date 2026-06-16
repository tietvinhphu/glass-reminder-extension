# .harness/ — Framework Directory

> Quickstart 1 trang. Chi tiết xem [`HARNESS.md`](../HARNESS.md) (master doc) hoặc [`docs/`](docs/) (5 docs sâu).

## 🚀 Tạo dự án mới từ framework này (30 giây)

```powershell
# 1. Tạo thư mục mới
mkdir my-new-project && cd my-new-project

# 2. Copy .harness/ từ repo nguồn
Copy-Item -Recurse ..\source-repo\.harness .

# 3. Bootstrap
.\.harness\scripts\init-harness.ps1 `
  -ProjectName "my-new-project" `
  -Stack "Next.js 15 + TypeScript" `
  -Purpose "SaaS dashboard" `
  -DeployTarget "Vercel"
```

Output: project mới với 9 files templated + `.harness/mistakes/` sẵn sàng + first commit.

## 📁 Cấu trúc thư mục này

```
.harness/
├── README.md          ← file này
├── principles.md      ← 7 nguyên tắc cốt lõi
├── templates/         ← 9 templates (copy sang project mới)
├── scripts/           ← init-harness + check-harness-health
├── mistakes/          ← JSON log mỗi khi agent sai
├── examples/          ← case studies + walkthroughs
└── docs/              ← 5 docs chi tiết (philosophy, layers, loop, multi-agent, hygiene)
```

## 🛠️ Scripts

| Script | Mục đích | OS |
|---|---|---|
| `init-harness.sh` | Tạo project mới từ templates | Linux/Mac |
| `init-harness.ps1` | Tạo project mới từ templates | Windows |
| `check-harness-health.sh` | Verify framework đang hoạt động đúng | Linux/Mac |

## 📚 Đọc tiếp

- **Mới với framework?** → [`docs/01-philosophy.md`](docs/01-philosophy.md)
- **Muốn hiểu 7 layers?** → [`docs/02-seven-layers.md`](docs/02-seven-layers.md)
- **Agent vừa sai?** → [`docs/03-mistake-loop.md`](docs/03-mistake-loop.md) + skill `harness-mistake-log`
- **Setup multi-agent workflow?** → [`docs/04-multi-agent-patterns.md`](docs/04-multi-agent-patterns.md)
- **Quy tắc context hygiene?** → [`docs/05-context-hygiene.md`](docs/05-context-hygiene.md)
