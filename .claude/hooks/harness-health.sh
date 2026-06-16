#!/bin/bash
# SessionStart hook: check Harness Framework health khi bắt đầu session
# Output: status màu + số liệu (skills count, mistakes count, last sync)

# Màu cho output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

# Check memory system
MEMORY_COUNT=0
if [ -d "memory" ]; then
  MEMORY_COUNT=$(find memory -name "*.md" -not -name "MEMORY.md" 2>/dev/null | wc -l)
fi

# Check skills
SKILL_COUNT=0
if [ -d ".agents/skills" ]; then
  SKILL_COUNT=$(find .agents/skills -name "SKILL.md" 2>/dev/null | wc -l)
elif [ -d ".claude/skills" ]; then
  SKILL_COUNT=$(find .claude/skills -name "SKILL.md" 2>/dev/null | wc -l)
fi

# Check hooks
HOOK_COUNT=0
if [ -f ".claude/settings.json" ]; then
  HOOK_COUNT=$(grep -c '"type":' .claude/settings.json 2>/dev/null || echo 0)
fi

# Check mistake log
MISTAKE_COUNT=0
if [ -d ".harness/mistakes" ]; then
  MISTAKE_COUNT=$(find .harness/mistakes -name "*.json" -not -name "template.json" -not -name "*.example.json" 2>/dev/null | wc -l)
fi

# Check last sync (git log cho memory commit)
LAST_SYNC="never"
if git log --oneline -1 -- memory/ 2>/dev/null | head -1; then
  LAST_SYNC=$(git log --format="%h %s" -1 -- memory/ 2>/dev/null | head -1)
fi

# Output
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${CYAN}🔍 Harness Health Check${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "  📂 Memory files:  ${GREEN}${MEMORY_COUNT}${NC}"
echo -e "  🎯 Skills:         ${GREEN}${SKILL_COUNT}${NC}"
echo -e "  🪝 Hooks:          ${GREEN}${HOOK_COUNT}${NC}"
echo -e "  📋 Mistakes logged: ${YELLOW}${MISTAKE_COUNT}${NC}"
echo -e "  🔄 Last sync:      ${LAST_SYNC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

# Warnings
if [ "$MISTAKE_COUNT" -gt 0 ]; then
  echo -e "${YELLOW}💡 Tip:${NC} Có ${MISTAKE_COUNT} mistakes logged. Có mistake nào cần engineer fix không?"
fi

if [ "$HOOK_COUNT" -lt 2 ]; then
  echo -e "${YELLOW}⚠️  Recommend:${NC} Thêm ít nhất SessionStart + Stop hooks"
fi

# Check HARNESS.md exists
if [ -f "HARNESS.md" ]; then
  echo -e "${GREEN}✅ HARNESS.md present${NC}"
else
  echo -e "${YELLOW}⚠️  HARNESS.md missing — recommend tạo để track framework state${NC}"
fi

exit 0
