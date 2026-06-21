# Harness Engineering Framework — Solo Founder Edition
> Version 1.0 | 2026-06-16

> **Framework này là gì?** Toàn bộ "môi trường" xung quanh AI agent — tools, memory, hooks, skills, workflows — được thiết kế có hệ thống để **mỗi khi agent sai, ta engineer giải pháp để lỗi đó không bao giờ lặp lại**.

---

## 🎯 Tại sao framework này tồn tại

### 1. Bằng chứng thực nghiệm (SWE-agent paper, NeurIPS 2024)
> Cùng model, cùng task, cùng compute budget — **chỉ thay đổi cách thiết kế môi trường** → hiệu suất **tăng 64%**.

Đây là sự khác biệt giữa "agent chạy được" và "agent vô dụng", đến hoàn toàn từ **environment design** — tức là **harness**.

### 2. Định nghĩa gốc (Mitchell Hashimoto, 2/2026)
> *"Anytime you find an agent makes a mistake, you take the time to engineer a solution such that the agent never makes that mistake again."*

Tóm lại: **Mỗi lần agent sai → engineer fix → không bao giờ lặp lại.**

### 3. Trích dẫn cốt lõi (Rohit Verma)
> *"The model is what thinks. The harness is what it thinks about. Getting that distinction right is the entire game."*

**Harness mới là sản phẩm thực sự. Model chỉ là engine.**

### 4. Tiến hóa tư duy AI
| Năm | Tư duy | Câu hỏi trung tâm |
|---|---|---|
| 2022-2024 | Prompt Engineering | "Hỏi AI thế nào cho đúng?" |
| 2025 | Context Engineering | "Đưa thông tin gì cho AI?" |
| 2026 | **Harness Engineering** | **"Toàn bộ hệ thống xung quanh AI vận hành ra sao?"** |

Ẩn dụ: Prompt = viết email. Context = đính kèm file. **Harness = thiết kế cả cái văn phòng** (quy trình, con người, công cụ, kiểm soát chất lượng).

---

## 🏛️ 7 Layers của Harness

Mỗi layer map sang 1 file/thư mục cụ thể trong repo. Khi agent sai, ta xác định layer nào thiếu → engineer fix ngay tại layer đó.

| Layer | Tên | File mapping | Nguyên tắc gốc |
|---|---|---|---|
| **L1** | Identity | `HARNESS.md` + `.harness/principles.md` | "Harness là cái AI nghĩ về" — define rõ domain |
| **L2** | Memory | `memory/` (3-tier) | Anthropic leak: MEMORY.md (200 tokens) → topic files → transcripts |
| **L3** | Skills | `.claude/skills/` + `.agents/skills/` | Progressive disclosure: 200 tokens → 3K → dynamic |
| **L4** | Hooks | `.claude/settings.json` | "Model muốn làm gì vs system cho phép làm gì" |
| **L5** | State | `.harness/mistakes/*.json` | JSON > Markdown (model ít tự sửa JSON hơn) |
| **L6** | Workflows | `.harness/scripts/` | DAG enforcement, không được skip bước |
| **L7** | Quality Gates | SonarQube + Vitest + ESLint + Snyk | 4 ACI components: search 50 / view 100 / linter / compress |

### L4/L7 — Hooks Quality Gates mới (2026-06-21)

| Hook | Trigger | Vai trò | Reference mistake |
|---|---|---|---|
| `harness-health.sh` | SessionStart | Health check tổng thể | — |
| `check-vi-comment.sh` | PostToolUse (Write/Edit) | Reject code TS/TSX thiếu comment tiếng Việt | `2026-06-16-no-vi-comment.example.json` |
| `check-memory-index.sh` | PostToolUse (Write/Edit) | Reject memory file mới chưa có trong MEMORY.md index | `2026-06-16-stale-memory-index.json` |
| `check-skill-drift.sh` | PostToolUse (Write/Edit) | **Warn** khi `.agents/skills/*` drift so với `.claude/skills/*` mirror | `2026-06-21-skill-file-drift.json` |
| `summarize-mistakes.sh` | PreCompact | Snapshot mistake log trước khi context bị nén | — |
| `sync-memory.sh` | Stop | Tự động commit + push memory/ lên GitHub | — |

Chi tiết từng layer xem [`.harness/docs/02-seven-layers.md`](.harness/docs/02-seven-layers.md).

---

## 🔄 Mistake Loop (Hashimoto operationalized)

**Đây là trái tim của framework.** Mỗi khi agent mắc lỗi, ta chạy 4 bước:

```
┌─────────────────────────────────────────────────────┐
│  1. DETECT  →  Phát hiện lỗi (user báo hoặc         │
│               hook tự phát hiện)                    │
│                                                     │
│  2. LOG     →  Ghi vào .harness/mistakes/             │
│               theo JSON schema chuẩn                │
│                                                     │
│  3. ENGINEER FIX  →  Xác định layer bị thiếu (L1-L7) │
│               Tạo skill/hook/template/memory mới    │
│                                                     │
│  4. VERIFY  →  Test lại. Nếu pass → set verified_at.  │
│               Commit: "chore(harness): log + fix"   │
└─────────────────────────────────────────────────────┘
```

### Mistake Log Schema (JSON)

```json
{
  "id": "uuid-v4",
  "date": "2026-06-16",
  "category": "code-style | security | perf | workflow | context",
  "mistake": {
    "summary": "Mô tả ngắn lỗi agent mắc",
    "context": "Task nào, file nào, điều kiện gì",
    "evidence": "Quote từ output hoặc file path"
  },
  "root_cause": "Tại sao agent sai — thiếu memory, thiếu skill, thiếu guardrail?",
  "harness_fix": {
    "layer": "L1|L2|L3|L4|L5|L6|L7",
    "type": "skill|hook|template|memory|script",
    "description": "Cụ thể sửa gì",
    "files_changed": ["path1", "path2"]
  },
  "prevention": "Cơ chế nào ngăn lỗi lặp lại",
  "verified_at": "2026-06-16T14:30:00Z",
  "verified_by": "user | hook-name | test-name",
  "tags": ["comment", "vietnamese", "code-style"]
}
```

**Tại sao JSON chứ không phải Markdown?** Theo Anthropic (Claude Code leak 3/2026): model ít tự ý sửa JSON vì cấu trúc cứng → mistake log ít bị "tampered".

### Cách dùng
- **User**: "log mistake này" → invoke skill `harness-mistake-log`
- **Agent tự detect**: tự log + báo user trước khi fix
- **Tự động**: hook PostToolUse có thể auto-log khi phát hiện pattern lỗi

Ví dụ case study: [`.harness/examples/mistake-to-hook.md`](.harness/examples/mistake-to-hook.md)

---

## 🧼 Context Hygiene Rules (Goldilocks Numbers)

Từ SWE-agent paper — 4 Agent-Computer Interface (ACI) components tối ưu:

| Component | Quy tắc | Lý do |
|---|---|---|
| **Search** | Tối đa **50** kết quả/lần, vượt thì refine query | Tránh ngập working memory |
| **File viewer** | **100** dòng/lần, có số dòng prepend | "Just right" — tiết kiệm context, dễ edit |
| **Editor** | Sau edit → auto-run linter, reject nếu syntax error | Ngăn failures dây chuyền |
| **Context compression** | History >**5** turns → nén thành summary 1 dòng | Không bị chôn vùi trong history |

**Áp dụng cho mọi skill/tool mới:** mỗi tool mới phải tự enforce 1 trong 4 rule này.

Chi tiết: [`.harness/docs/05-context-hygiene.md`](.harness/docs/05-context-hygiene.md)

---

## 🤖 Multi-agent Roles (Anthropic 3-agent Pattern)

Map sang solo workflow — mỗi session, ta luân phiên 3 vai:

| Role | Khi nào dùng | Output |
|---|---|---|
| **Planner** | Đầu task, mở rộng prompt 1-4 câu thành full spec | `files/PLAN.md` + checklist |
| **Generator** | Build theo sprint, mỗi session 1 feature | Code + tests + commit |
| **Evaluator** | Trước khi claim "done" | Run quality gates + thực test thật |

**Tại sao tách 3 vai?** Theo Anthropic (2/2026): solo agent 20 phút cho ra game không chạy, full harness 6 giờ cho ra game chạy được. Sự khác biệt đến từ **separation of concerns** — Planner lo think, Generator lo build, Evaluator lo verify.

Chi tiết: [`.harness/docs/04-multi-agent-patterns.md`](.harness/docs/04-multi-agent-patterns.md)

### 🤖 6 Subagents đề xuất (adapt từ mrgoonie)

Khi bootstrap dự án mới, copy 6 subagent definitions vào `.claude/agents/`:

| Subagent | Model | Tóm tắt |
|---|---|---|
| `planner-researcher` | opus | Research + viết plan vào `.harness/plans/YYYYMMDD-feature.md` |
| `code-reviewer` | inherit | Review code quality, security, SonarQube |
| `tester` | sonnet | Run tests, coverage, report pass/fail |
| `debugger` | sonnet | Investigate CI logs, runtime errors, root cause |
| `docs-manager` | sonnet | Sync code ↔ docs, update landing page |
| `git-manager` | haiku | Stage + conventional commit + scan secrets |

Templates có sẵn trong [`.harness/templates/agents/`](.harness/templates/agents/) — xem README ở đó.

**3 patterns tổ chức subagent** (Chaining / Parallel / Context Collector) + warning "KHÔNG dùng subagent cho implementation": xem chi tiết trong [`.harness/docs/04-multi-agent-patterns.md`](.harness/docs/04-multi-agent-patterns.md).

---

## 🚀 Bootstrap dự án mới

**Khi muốn tạo dự án mới từ framework này:**

```powershell
# Trong thư mục cha muốn tạo project
mkdir new-project && cd new-project

# Copy .harness/ từ repo nguồn
cp -r path/to/this/repo/.harness .

# Chạy bootstrap
.harness\scripts\init-harness.ps1 `
  -ProjectName "my-new-app" `
  -Stack "Next.js 15 + TypeScript" `
  -Purpose "SaaS dashboard" `
  -DeployTarget "Vercel"

# Verify
.harness\scripts\check-harness-health.sh
```

Script sẽ tự động:
1. Copy 9 templates từ `.harness/templates/` → thay placeholders
2. Init git, first commit
3. Tạo thư mục `.harness/mistakes/` sẵn
4. Verify health pass

Chi tiết walkthrough: [`.harness/examples/bootstrap-new-project.md`](.harness/examples/bootstrap-new-project.md)

---

## 📂 Cấu trúc thư mục

```
HARNESS.md                              ← file này (đang đọc)
.harness/
├── README.md                           ← quickstart 1 trang
├── principles.md                       ← 7 nguyên tắc cốt lõi
├── templates/                          ← 9 templates để copy sang project mới
├── scripts/                            ← init-harness, check-harness-health
├── mistakes/                           ← JSON log (per Anthropic pattern)
├── examples/                           ← case studies + walkthroughs
└── docs/                               ← 5 docs chi tiết
    ├── 01-philosophy.md                ← tại sao harness > prompt
    ├── 02-seven-layers.md              ← chi tiết L1-L7
    ├── 03-mistake-loop.md              ← Hashimoto loop chi tiết
    ├── 04-multi-agent-patterns.md      ← Planner/Generator/Evaluator
    └── 05-context-hygiene.md           ← SWE-agent 4 ACI components
```

---

## 🔗 Liên kết

- Memory: [`memory/reference-harness-framework.md`](memory/reference-harness-framework.md) — quick reference cho session start
- Skills: `.claude/skills/harness-mistake-log/` — workflow log mistake
- Skills: `.claude/skills/harness-bootstrap/` — workflow tạo project mới
- Hooks: `.claude/settings.json` — cấu hình hooks
- Source article: [Harness Engineering là gì?](https://goonnguyen.substack.com/p/harness-engineering-la-gi)

---

*Version 1.0 | 2026-06-16 | Built by Harness Engineering framework, for solo founder.*
