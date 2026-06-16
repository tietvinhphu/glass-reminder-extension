---
name: harness-mistake-log
description: "Log mistakes agent mắc phải và engineer giải pháp để không bao giờ lặp lại. Use khi user nói 'log mistake này', 'agent sai rồi', 'phải đảm bảo không lặp lại'."
---

# Harness Mistake Log

Skill này vận hành **Mitchell Hashimoto's Mistake Loop** — mỗi khi agent mắc lỗi, ta engineer giải pháp để lỗi đó không bao giờ lặp lại.

<HARD-GATE>
Không được log mistake mà KHÔNG engineer fix tương ứng ở 1 trong 7 layers (L1-L7). Log không = fix không. Mỗi mistake PHẢI dẫn đến 1 action cụ thể.
</HARD-GATE>

## Khi nào dùng

- User nói: "log mistake này", "agent sai rồi", "phải đảm bảo không lặp lại", "thêm vào mistake log"
- Agent tự detect lỗi nghiêm trọng (vd: security violation, rule bị vi phạm)
- PostToolUse hook tự động trigger (vd: phát hiện pattern lỗi)

## Workflow

### 1. Thu thập thông tin

Hỏi user (hoặc tự suy ra từ context) 4 fields bắt buộc:

| Field | Câu hỏi |
|---|---|
| `mistake.summary` | "Agent sai gì? Mô tả ngắn 1 dòng." |
| `mistake.context` | "Task nào, file nào, điều kiện gì?" |
| `root_cause` | "Tại sao agent sai? Thiếu memory, thiếu skill, thiếu guardrail?" |
| `harness_fix.description` | "Sẽ engineer fix gì ở layer nào (L1-L7)?" |

### 2. Tạo file JSON

```bash
# Generate UUID và date
UUID=$(uuidgen 2>/dev/null || cat /proc/sys/kernel/random/uuid)
DATE=$(date +%Y-%m-%d)
SLUG="<slug-from-summary>"  # vd: no-vi-comment, hardcoded-secret, skip-tdd

# Path
FILE=".harness/mistakes/${DATE}-${SLUG}.json"

# Copy template
cp .harness/templates/mistake-log.template.json "$FILE"
```

### 3. Fill JSON bằng tool Edit

Mở file vừa tạo, fill 4 fields bắt buộc:
- `id` = UUID
- `date` = ISO date
- `mistake.summary`, `mistake.context`, `mistake.evidence`
- `root_cause`
- `harness_fix.layer` (L1|L2|L3|L4|L5|L6|L7)
- `harness_fix.type` (skill|hook|template|memory|script|rule)
- `harness_fix.description`
- `harness_fix.files_changed` = []
- `prevention` = mô tả cơ chế ngăn lặp lại
- `tags` = []

### 4. Engineer fix ở layer xác định

Tùy layer:

| Layer | Action |
|---|---|
| L1 Identity | Cập nhật HARNESS.md, principles.md, INSTRUCTIONS.md |
| L2 Memory | Tạo/cập nhật file trong `memory/` |
| L3 Skills | Tạo/sửa skill trong `.claude/skills/<name>/SKILL.md` |
| L4 Hooks | Tạo/sửa file trong `.claude/hooks/` + update `settings.json` |
| L5 State | Convert state sang JSON, thêm schema |
| L6 Workflows | Tạo/sửa script trong `.harness/scripts/` |
| L7 Quality Gates | Thêm ESLint/SonarQube/Vitest rule |

**Quan trọng:** Không chỉ ghi "sẽ fix" — phải APPLY fix ngay trong session này.

### 5. Verify fix hoạt động

Sau khi apply fix, test:
- **Manual test:** Reproduce mistake → confirm fix chặn được
- **Auto test:** Hook/skill tự động reject
- **Test case:** Thêm unit test mô tả mistake

### 6. Set verified fields

Update JSON:
```json
{
  "verified_at": "<ISO datetime>",
  "verified_by": "<manual-test|hook-name|test-name>"
}
```

### 7. Commit

```bash
git add .harness/mistakes/ <các file đã thay đổi>
git commit -m "chore(harness): log mistake ${SLUG} + apply fix

Layer: <L4 | L3 | ...>
Prevention: <1-line summary>

- .harness/mistakes/${DATE}-${SLUG}.json
- <file 1 changed>
- <file 2 changed>"
```

## Mistake Log Schema (JSON, không Markdown)

```json
{
  "id": "uuid-v4",
  "date": "YYYY-MM-DD",
  "category": "code-style | security | perf | workflow | context",
  "mistake": {
    "summary": "Mô tả ngắn lỗi agent mắc",
    "context": "Task nào, file nào, điều kiện gì",
    "evidence": "Quote từ output hoặc file path:line"
  },
  "root_cause": "Tại sao agent sai — thiếu memory, thiếu skill, thiếu guardrail?",
  "harness_fix": {
    "layer": "L1|L2|L3|L4|L5|L6|L7",
    "type": "skill|hook|template|memory|script|rule",
    "description": "Cụ thể sửa gì",
    "files_changed": ["path1", "path2"]
  },
  "prevention": "Cơ chế nào ngăn lỗi lặp lại",
  "verified_at": "ISO datetime hoặc null",
  "verified_by": "user | hook-name | test-name | null",
  "tags": ["tag1", "tag2"]
}
```

## Anti-patterns

❌ "Log mistake xong rồi để đó" — phải apply fix
❌ "Mistake này chỉ xảy ra 1 lần" — log vẫn cần, pattern chỉ lộ sau N entries
❌ "Ghi vào Markdown cho dễ đọc" — PHẢI JSON
❌ "Tốn thời gian quá, skip" — đây là compound learning, skip = mất lợi thế

## Ví dụ

Xem `.harness/mistakes/2026-06-16-no-vi-comment.example.json` và `.harness/examples/mistake-to-hook.md`.
