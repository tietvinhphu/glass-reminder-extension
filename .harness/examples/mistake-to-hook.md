# Case Study: Từ Mistake → Hook (Comment Enforcement)

> Đây là ví dụ đầy đủ của **Mistake Loop** (Hashimoto operationalized). Mỗi agent gặp lỗi tương tự đều có thể áp dụng pattern này.

---

## Bối cảnh

**Dự án:** glass-reminder-extension (WXT + React 19 + TypeScript)

**Convention:** Mọi function/block logic phải có comment tiếng Việt giải thích mục đích, lý do, param/return. (Đã ghi trong `CLAUDE.md` và `INSTRUCTIONS.md`.)

**Vấn đề:** Owner phát hiện function `calculateTotal()` được tạo mà KHÔNG có comment tiếng Việt.

---

## Bước 1 — DETECT

**Ai phát hiện:** Owner (anh) — khi review code trong VSCode local trước khi push.

**Câu nói:** "Agent vừa tạo function calculateTotal() mà không có comment tiếng Việt. Log mistake này và engineer fix để không lặp lại."

---

## Bước 2 — LOG

**Skill invoked:** `harness-mistake-log`

**Action:** Tạo file `.harness/mistakes/2026-06-16-no-vi-comment.json` từ template.

**Nội dung file** (rút gọn — xem [full example](../mistakes/2026-06-16-no-vi-comment.example.json)):

```json
{
  "id": "uuid-generated",
  "date": "2026-06-16",
  "category": "code-style",
  "mistake": {
    "summary": "Function calculateTotal() thiếu comment tiếng Việt",
    "context": "Task implement pricing calculation",
    "evidence": "src/utils/pricing.ts:42-58"
  },
  "root_cause": "Không có cơ chế tự động enforce rule — rule chỉ tồn tại trong docs, bị quên giữa sessions",
  "harness_fix": {
    "layer": "L4",
    "type": "hook",
    "description": "PostToolUse hook check .ts/.tsx sau Write/Edit — reject nếu thiếu comment tiếng Việt",
    "files_changed": [".claude/hooks/check-vi-comment.sh", ".claude/settings.json"]
  },
  "prevention": "Hook tự động reject edit nếu thiếu comment — không phụ thuộc vào việc agent nhớ"
}
```

---

## Bước 3 — ENGINEER FIX

### 3a. Xác định layer bị thiếu

Phân tích root cause:
- "Rule chỉ tồn tại trong docs" → L1 (docs) đã có, không thiếu
- "Bị quên giữa sessions" → L2 (memory) có convention, nhưng không ai đọc lại
- "Không có cơ chế tự động" → **L4 (hooks) bị thiếu** ← chọn layer này

### 3b. Tạo PostToolUse hook

**File:** `.claude/hooks/check-vi-comment.sh`

```bash
#!/bin/bash
# PostToolUse hook: check Vietnamese comment trong file .ts/.tsx
# Reject edit nếu thiếu comment tiếng Việt trong 10 dòng đầu

# Parse CLAUDE_TOOL_INPUT (JSON từ Claude Code) để lấy file_path
FILE_PATH=$(echo "$CLAUDE_TOOL_INPUT" | jq -r '.tool_input.file_path // empty' 2>/dev/null)

# Nếu không phải file .ts/.tsx → pass
if [[ -z "$FILE_PATH" || ! "$FILE_PATH" =~ \.(ts|tsx)$ ]]; then
  exit 0
fi

# Nếu file không tồn tại → pass (hook sẽ chạy lại sau khi write)
if [[ ! -f "$FILE_PATH" ]]; then
  exit 0
fi

# Check 10 dòng đầu có comment tiếng Việt không
HEAD=$(head -10 "$FILE_PATH" 2>/dev/null)
if echo "$HEAD" | grep -qE '^\s*//.*[àáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđ]'; then
  exit 0
fi

# Reject với message tiếng Việt
echo "❌ File .ts/.tsx phải có comment tiếng Việt giải thích trong 10 dòng đầu" >&2
echo "💡 Thêm 1 dòng: // Mô tả function/block này làm gì, tại sao, param/return" >&2
exit 2
```

**Update:** `.claude/settings.json` — thêm PostToolUse hook:

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Write|Edit|MultiEdit",
        "hooks": [
          {
            "type": "command",
            "command": "bash .claude/hooks/check-vi-comment.sh",
            "timeout": 5,
            "statusMessage": "🇻🇳 Checking Vietnamese comments..."
          }
        ]
      }
    ]
  }
}
```

---

## Bước 4 — VERIFY

### 4a. Manual test — THIẾU comment

```bash
# Tạo file test thiếu comment
echo "export const add = (a: number, b: number) => a + b;" > /tmp/test-no-comment.ts

# Set env var để giả lập Claude Code input
export CLAUDE_TOOL_INPUT='{"tool_input":{"file_path":"/tmp/test-no-comment.ts"}}'

# Chạy hook
bash .claude/hooks/check-vi-comment.sh
echo "Exit code: $?"
# Expected: exit 2 + message tiếng Việt
```

### 4b. Manual test — CÓ comment

```bash
# Tạo file test có comment tiếng Việt
cat > /tmp/test-with-comment.ts <<EOF
// Hàm cộng 2 số — dùng cho UI calculator
export const add = (a: number, b: number) => a + b;
EOF

export CLAUDE_TOOL_INPUT='{"tool_input":{"file_path":"/tmp/test-with-comment.ts"}}'

bash .claude/hooks/check-vi-comment.sh
echo "Exit code: $?"
# Expected: exit 0 (pass)
```

### 4c. Update mistake log

Sau khi verify pass:

```json
{
  "verified_at": "2026-06-16T14:30:00Z",
  "verified_by": "manual-test: edit .ts thiếu comment → exit 2; edit với comment → exit 0"
}
```

### 4d. Commit

```bash
git add .harness/mistakes/2026-06-16-no-vi-comment.json
git add .claude/hooks/check-vi-comment.sh
git add .claude/settings.json

git commit -m "chore(harness): log no-vi-comment mistake + apply PostToolUse hook

- .harness/mistakes/2026-06-16-no-vi-comment.json: log mistake
- .claude/hooks/check-vi-comment.sh: PostToolUse hook reject edit thiếu VI comment
- .claude/settings.json: wire hook vào Write|Edit|MultiEdit

Layer: L4 (Hooks)
Prevention: hook tự động reject, không phụ thuộc agent nhớ"
```

---

## Kết quả

**Trước fix:**
- Owner phải nhắc "thêm comment" mỗi session
- Agent quên rule khi context bị nén
- Code không consistent

**Sau fix:**
- Hook tự động reject edit thiếu comment
- Owner không phải nhắc lại
- Code 100% consistent

**Compound learning:** Mỗi mistake tiếp theo tương tự → tạo mistake log mới → engineer 1 hook/skill mới. Sau 6 tháng, harness gần như "perfect" cho workflow của anh.

---

## Áp dụng cho mistakes khác

Pattern này áp dụng cho MỌI mistake có thể tự động hóa:

| Mistake | Engineer ở layer | Tool tạo |
|---|---|---|
| Agent dùng `any` type | L7 (Quality Gates) | ESLint rule `@typescript-eslint/no-explicit-any: error` |
| Agent hardcode secret | L7 + L4 | SonarQube S6702 + PreToolUse check pattern |
| Agent skip TDD | L3 (Skills) | Update `test-driven-development` skill + L4 hook check test file exists |
| Agent log sensitive data | L4 (Hooks) | PostToolUse grep cho `console.log.*token` |
| Agent dùng `chrome.*` thay `webextension-polyfill` | L4 + L7 | PostToolUse grep + ESLint rule custom |

→ Quay lại [`../README.md`](../README.md) hoặc [`../../HARNESS.md`](../../HARNESS.md).
