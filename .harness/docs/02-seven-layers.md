# 02. 7 Layers của Harness Engineering

> Mỗi layer là 1 "bề mặt engineer" — khi agent sai, xác định layer nào thiếu → engineer fix tại layer đó.

---

## Tổng quan

| # | Layer | File mapping | Khi agent sai → engineer gì? |
|---|---|---|---|
| L1 | Identity | `HARNESS.md` + `principles.md` | Cập nhật master doc, principles |
| L2 | Memory | `memory/` | Thêm file memory mới hoặc cập nhật index |
| L3 | Skills | `.claude/skills/` + `.agents/skills/` | Tạo/cập nhật skill với workflow rõ ràng |
| L4 | Hooks | `.claude/settings.json` | Thêm/sửa hook (PreTool/PostTool/SessionStart/Stop) |
| L5 | State | `.harness/mistakes/*.json` | Log JSON, theo dõi qua sessions |
| L6 | Workflows | `.harness/scripts/` | Script tự động hóa DAG steps |
| L7 | Quality Gates | SonarQube + Vitest + ESLint | Thêm rule, fail-fast, auto-reject |

---

## L1 — Identity (Định nghĩa "AI nghĩ về cái gì")

**Mục đích:** Xác định rõ domain, vai trò, giới hạn của agent trong dự án này.

**File mapping:**
- `HARNESS.md` — master framework doc
- `.harness/principles.md` — 7 nguyên tắc cốt lõi
- `CLAUDE.md`, `AGENTS.md`, `INSTRUCTIONS.md`, `.cursorrules` — instructions per tool

**Khi engineer:** Cập nhật docs khi domain thay đổi, khi phát hiện giới hạn mới, khi cần clarify role.

**Ví dụ mistake → fix:**
- Agent gọi sai API vì không biết stack là Edge extension → thêm vào `INSTRUCTIONS.md` section "Stack constraints"
- Agent đề xuất dùng jQuery cho React project → thêm principle "Luôn dùng React patterns, không jQuery"

---

## L2 — Memory (Bộ nhớ xuyên session)

**Mục đích:** Lưu trữ context quan trọng để agent không phải "nhớ" mỗi session.

**File mapping:** `memory/` (3-tier theo Anthropic pattern):
- Tier 1: `MEMORY.md` (~200 tokens) — index luôn load
- Tier 2: `*.md` topic files — load on-demand
- Tier 3: transcripts — searchable

**Khi engineer:** Thêm memory mới khi phát hiện thông tin phải lặp lại nhiều lần. Cập nhật index khi có file mới.

**Ví dụ mistake → fix:**
- Agent quên owner đang học → cần comment tiếng Việt → thêm `feedback_code_style.md` (đã có)
- Agent không biết convention naming → thêm `feedback_naming.md` mới
- Agent không biết project đang ở Checkpoint 3 → thêm `project_status.md` (đã có)

---

## L3 — Skills (Playbook cho từng loại task)

**Mục đích:** Cung cấp workflow chuẩn cho từng loại task — không phải mỗi session tự nghĩ ra approach.

**File mapping:** `.claude/skills/<skill-name>/SKILL.md` (+ supporting files)

**Khi engineer:** Tạo skill mới khi thấy cùng 1 quy trình lặp lại 3+ lần. Cập nhật khi workflow thay đổi.

**Nguyên tắc Progressive Disclosure (theo Anthropic):**
- SKILL.md: ~200 tokens metadata (description, when to use)
- SKILL.md body: ~3K tokens instructions
- Dynamic resources: load on-demand (refs/, scripts/)

**Ví dụ mistake → fix:**
- Agent brainstorm thẳng vào code → tạo skill `brainstorming` (đã có)
- Agent viết code không theo TDD → tạo skill `test-driven-development` (đã có)
- Agent quên log mistake sau khi fix → tạo skill `harness-mistake-log` (mới thêm)

---

## L4 — Hooks (Tường rào tự động)

**Mục đích:** Cho phép hệ thống **kiểm soát** những gì agent được phép làm — tách rời "model muốn" và "system cho phép".

**File mapping:** `.claude/settings.json` + `.claude/hooks/*.sh`

**Các loại hooks:**
- `SessionStart` — chạy khi session mới bắt đầu (vd: check harness health)
- `PreToolUse` — chạy TRƯỚC khi tool execute (vd: confirm trước khi xóa file)
- `PostToolUse` — chạy SAU khi tool execute (vd: check Vietnamese comment sau Write/Edit)
- `PreCompact` — trước khi context bị compress (vd: lưu summary mistake log)
- `Stop` — khi session kết thúc (vd: sync memory to git)

**Khi engineer:** Thêm hook khi rule phải enforce tự động, không thể tin tưởng agent nhớ.

**Ví dụ mistake → fix:**
- Agent xóa file nhầm → thêm `PreToolUse` cho `Bash rm` với confirmation prompt
- Agent quên Vietnamese comment → thêm `PostToolUse` cho `Write|Edit` check comment
- Memory bị mất khi session end → đã có `Stop` hook `sync-memory.sh`

---

## L5 — State (JSON cho persistence)

**Mục đích:** Lưu trữ state có cấu trúc mà agent ít tự ý sửa (theo Anthropic finding).

**File mapping:**
- `.harness/mistakes/*.json` — mistake log
- `package.json`, `tsconfig.json` — project config
- `skills-lock.json` — installed skills tracking

**Tại sao JSON?** Model ít modify JSON vì:
- Cấu trúc cứng, sửa dễ vỡ
- Không có semantic ambiguity như Markdown
- Có thể validate bằng schema (jq, zod)

**Khi engineer:** Chuyển state từ Markdown sang JSON khi cần persistence reliable. Thêm schema validation.

**Ví dụ mistake → fix:**
- Agent ghi nhầm mistake log thành prose → enforce JSON schema
- Feature list bị modify lung tung giữa sessions → lưu JSON với `passes: false`

---

## L6 — Workflows (Scripts tự động hóa)

**Mục đích:** Tự động hóa các bước DAG — agent không được skip, không được làm sai thứ tự.

**File mapping:** `.harness/scripts/` + các entry points (npm scripts, Makefile)

**Khi engineer:** Tạo script khi có chuỗi bước lặp lại nhiều lần, hoặc khi cần đảm bảo thứ tự.

**Ví dụ mistake → fix:**
- Agent quên `npm install` sau khi tạo project mới → thêm script `bootstrap.sh` tự chạy
- Agent tạo commit với message không chuẩn → thêm script `commit.sh` với template
- Agent quên chạy test trước khi claim done → thêm `pre-commit` hook

---

## L7 — Quality Gates (Tự động reject khi sai)

**Mục đích:** Bắt lỗi sớm nhất có thể — tốt nhất là lúc code vừa được viết, không phải đợi đến khi review.

**File mapping:**
- ESLint (`.eslint.config.js`)
- TypeScript (`tsconfig.json` với strict mode)
- Vitest (`vitest.config.ts` + `tests/`)
- SonarQube (`sonar-project.properties` + MCP)

**Khi engineer:** Thêm rule khi phát hiện pattern lỗi lặp lại. Fix rule chứ không fix từng case.

**Ví dụ mistake → fix:**
- Agent dùng `any` → thêm ESLint rule `@typescript-eslint/no-explicit-any: error`
- Agent hardcode secret → SonarQube rule S6702 fail build
- Agent CSS contrast thấp → SonarQube S7924 (hoặc NOSONAR nếu dark theme)

---

## Áp dụng: khi agent sai, xác định layer nào

Công thức:
```
Mistake xảy ra
  → Root cause là gì?
    → Thiếu context?        → Engineer L2 (memory) hoặc L1 (docs)
    → Thiếu workflow?       → Engineer L3 (skill) hoặc L6 (script)
    → Thiếu guardrail?      → Engineer L4 (hook)
    → State bị corrupt?     → Engineer L5 (JSON schema)
    → Quality gate miss?    → Engineer L7 (rule)
```

Worked example: [`examples/mistake-to-hook.md`](../examples/mistake-to-hook.md)

→ Quay lại [`HARNESS.md`](../HARNESS.md) hoặc đọc tiếp [`03-mistake-loop.md`](03-mistake-loop.md).
