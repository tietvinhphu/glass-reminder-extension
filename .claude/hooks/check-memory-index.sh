#!/bin/bash
# PreToolUse hook: check MEMORY.md index có đồng bộ với danh sách file thực tế trong memory/ không
# Reference mistake: .harness/mistakes/2026-06-16-stale-memory-index.json
# Layer: L4 (Hooks) — enforce consistency giữa metadata và content
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

# Nếu không có file_path → pass
if [[ -z "$FILE_PATH" ]]; then
  exit 0
fi

# Normalize path: bỏ leading ./ và convert Windows backslash
NORM_PATH=$(echo "$FILE_PATH" | sed 's|^\./||' | tr '\\' '/')

# Chỉ check file trong memory/ folder (không phải MEMORY.md chính nó)
if [[ ! "$NORM_PATH" =~ ^memory/ ]] || [[ "$NORM_PATH" == "memory/MEMORY.md" ]]; then
  exit 0
fi

# Lấy basename (filename không có folder)
BASENAME=$(basename "$NORM_PATH")

# Check MEMORY.md có tồn tại không
if [[ ! -f "memory/MEMORY.md" ]]; then
  exit 0  # Chưa có MEMORY.md thì skip (project mới bootstrap)
fi

# Check xem MEMORY.md có reference file này không
# Pattern: chấp nhận [basename] HOẶC (basename) + bất kỳ text nào (vd: " — description")
if grep -qE "\[${BASENAME}\]|\(${BASENAME}\)[^)]" "memory/MEMORY.md" 2>/dev/null; then
  exit 0  # Đã reference → pass
fi

# File memory mới bị thiếu trong MEMORY.md index → reject
echo "❌ File memory/$BASENAME chưa được thêm vào MEMORY.md index" >&2
echo "💡 Thêm 1 dòng vào memory/MEMORY.md, format:" >&2
echo "   - [$BASENAME]($BASENAME) — mô tả ngắn 1 dòng về file này" >&2
echo "📋 Xem memory/MEMORY.md hiện tại để biết format" >&2
echo "🔄 Sau khi update MEMORY.md, edit lại file này (không đổi content) để pass hook" >&2
exit 2
