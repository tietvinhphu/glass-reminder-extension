#!/bin/bash
# Auto-sync memory và skills lên GitHub sau mỗi task Claude
# Triggered bởi Stop hook trong .claude/settings.json

PROJECT_DIR="C:/Users/tiet.vinh-phu1/Downloads/glass-reminder-extension"

cd "$PROJECT_DIR" || exit 0

# Stage các folder cần sync lên GitHub
git add memory/ .agents/ skills-lock.json .hintrc 2>/dev/null

# Chỉ commit nếu có thay đổi thực sự — tránh commit rỗng
if ! git diff --cached --quiet; then
  TIMESTAMP=$(date '+%H:%M %d/%m/%Y')
  git commit -m "chore: auto-sync memory & skills [$TIMESTAMP]"
  git push origin main 2>/dev/null
fi
