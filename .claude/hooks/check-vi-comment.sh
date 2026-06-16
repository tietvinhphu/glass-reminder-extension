#!/bin/bash
# PostToolUse hook: check Vietnamese comment trong file .ts/.tsx
# Reject edit nếu thiếu comment tiếng Việt giải thích trong 10 dòng đầu
# Reference mistake: .harness/mistakes/2026-06-16-no-vi-comment.example.json

# Parse CLAUDE_TOOL_INPUT (JSON từ Claude Code) để lấy file_path
# Format: {"tool_input":{"file_path":"path/to/file.ts", ...}}
FILE_PATH=$(echo "$CLAUDE_TOOL_INPUT" | jq -r '.tool_input.file_path // empty' 2>/dev/null)

# Nếu parse fail hoặc không có file_path → pass (hook khác sẽ xử lý)
if [[ -z "$FILE_PATH" ]]; then
  exit 0
fi

# Chỉ check file .ts/.tsx (extension cụ thể của TypeScript project này)
if [[ ! "$FILE_PATH" =~ \.(ts|tsx)$ ]]; then
  exit 0
fi

# Nếu file không tồn tại (vd: đang tạo file mới) → pass
if [[ ! -f "$FILE_PATH" ]]; then
  exit 0
fi

# Check 10 dòng đầu có comment tiếng Việt không
# Vietnamese characters: àáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđ
HEAD=$(head -10 "$FILE_PATH" 2>/dev/null)
if echo "$HEAD" | grep -qE '^\s*//.*[àáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđ]'; then
  exit 0
fi

# Reject với message tiếng Việt — agent phải thêm comment mới pass
echo "❌ File .ts/.tsx phải có comment tiếng Việt giải thích trong 10 dòng đầu" >&2
echo "💡 Thêm 1 dòng: // Mô tả function/block này làm gì, tại sao, param/return" >&2
echo "📋 Xem rule trong INSTRUCTIONS.md section 'Comment giải thích'" >&2
exit 2
