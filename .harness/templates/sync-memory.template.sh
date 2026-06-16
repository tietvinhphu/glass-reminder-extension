#!/bin/bash
# Auto-sync memory + agents skills lên GitHub sau mỗi session
# Trigger: Claude Code Stop hook (.claude/settings.json)

# Cấu hình project path — customize theo máy
PROJECT_DIR="{{PROJECT_DIR}}"
cd "$PROJECT_DIR" || exit 0

# Stage memory + agents config
git add memory/ .agents/ skills-lock.json .hintrc 2>/dev/null

# Chỉ commit nếu có thay đổi
if ! git diff --cached --quiet; then
  TIMESTAMP=$(date '+%H:%M %d/%m/%Y')
  git commit -m "chore: auto-sync memory & skills [$TIMESTAMP]"
  git push origin main 2>/dev/null
fi
