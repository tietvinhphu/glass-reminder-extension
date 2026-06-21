#!/bin/bash
# PreToolUse hook: check-skill-drift
# Mục đích: Phát hiện khi agent edit file trong .agents/skills/ mà bản sao .claude/skills/ chưa sync
# Reference mistake: .harness/mistakes/2026-06-21-skill-file-drift.json
# Layer: L4 (Hooks) + L7 (Quality Gates) — enforce consistency giữa 2 bản sao skill files
# Template version — copy vào project mới qua bootstrap script

# Parse file_path từ CLAUDE_TOOL_INPUT dùng node (cross-platform, no jq required)
# Format input: {"tool_input":{"file_path":"path/to/file", ...}}
FILE_PATH=$(printf '%s' "$CLAUDE_TOOL_INPUT" | node -e "
let input='';
process.stdin.on('data',d=>input+=d);
process.stdin.on('end',()=>{
  try{const d=JSON.parse(input);process.stdout.write(d.tool_input?.file_path||'')}
  catch(e){process.stdout.write('')}
});
" 2>/dev/null)

# Nếu không có file_path → pass (không phải file edit)
if [[ -z "$FILE_PATH" ]]; then
  exit 0
fi

# Normalize path: bỏ leading ./ và convert Windows backslash
NORM_PATH=$(echo "$FILE_PATH" | sed 's|^\./||' | tr '\\' '/')

# Chỉ check file trong .agents/skills/ folder (canonical source)
# Bỏ qua các file trong .claude/skills/ (mirror, không phải source)
if [[ ! "$NORM_PATH" =~ ^\.agents/skills/ ]]; then
  exit 0
fi

# Tính đường dẫn bản mirror trong .claude/skills/
# .agents/skills/brainstorming/scripts/server.cjs
#   → .claude/skills/brainstorming/scripts/server.cjs
MIRROR_PATH=".claude/skills/${NORM_PATH#.agents/skills/}"

# Nếu bản mirror không tồn tại → có thể là skill mới, không phải drift → pass
if [[ ! -f "$MIRROR_PATH" ]]; then
  exit 0
fi

# So sánh 2 file bằng git diff (chính xác hơn checksum vì tính line-ending)
# Nếu giống nhau → pass
if diff -q "$NORM_PATH" "$MIRROR_PATH" >/dev/null 2>&1; then
  exit 0
fi

# Drift detected → cảnh báo (không reject, chỉ warn để agent tự sửa)
# Severity: warning (exit 0) thay vì reject (exit 2) vì:
#   - Có thể agent đang intentional update cả 2 bản trong cùng 1 turn
#   - Sync-memory hook ở Stop sẽ tự check lại
echo "⚠️  DRIFT DETECTED: $NORM_PATH và $MIRROR_PATH không đồng bộ" >&2
echo "💡 Đây là 2 bản sao của cùng 1 skill file. Canonical source: .agents/skills/" >&2
echo "📋 Các bước fix:" >&2
echo "   1. Áp dụng thay đổi tương tự cho $MIRROR_PATH" >&2
echo "   2. Hoặc xóa $MIRROR_PATH nếu muốn dùng symlink/junction thay vì duplicate" >&2
echo "🔍 Xem chi tiết: diff $NORM_PATH $MIRROR_PATH" >&2
exit 0
