#!/bin/bash
# Verify Harness Framework đang hoạt động đúng
# Usage: ./check-harness-health.sh

set -e

# Màu cho output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

ERRORS=0
WARNINGS=0

echo "🔍 Checking Harness Framework health..."
echo ""

# 1. Check memory system
echo "📂 [L2] Memory system..."
if [ -d "memory" ]; then
  MEMORY_COUNT=$(find memory -name "*.md" -not -name "MEMORY.md" 2>/dev/null | wc -l)
  if [ "$MEMORY_COUNT" -ge 1 ]; then
    echo -e "  ${GREEN}✓${NC} $MEMORY_COUNT memory files found"
  else
    echo -e "  ${YELLOW}⚠${NC} No memory files (besides index)"
    WARNINGS=$((WARNINGS + 1))
  fi
  if [ -f "memory/MEMORY.md" ]; then
    echo -e "  ${GREEN}✓${NC} MEMORY.md index exists"
  else
    echo -e "  ${RED}✗${NC} MEMORY.md missing"
    ERRORS=$((ERRORS + 1))
  fi
else
  echo -e "  ${RED}✗${NC} memory/ directory missing"
  ERRORS=$((ERRORS + 1))
fi

# 2. Check skills
echo ""
echo "🎯 [L3] Skills..."
if [ -d ".agents/skills" ]; then
  SKILL_COUNT=$(find .agents/skills -name "SKILL.md" 2>/dev/null | wc -l)
  echo -e "  ${GREEN}✓${NC} $SKILL_COUNT skills installed in .agents/"
elif [ -d ".claude/skills" ]; then
  SKILL_COUNT=$(find .claude/skills -name "SKILL.md" 2>/dev/null | wc -l)
  echo -e "  ${YELLOW}⚠${NC} $SKILL_COUNT skills in .claude/ (no .agents/ — run 'npx skills' to install)"
  WARNINGS=$((WARNINGS + 1))
else
  echo -e "  ${RED}✗${NC} No skills directory"
  ERRORS=$((ERRORS + 1))
fi

# Check for required harness skills
for skill in harness-mistake-log harness-bootstrap; do
  if [ -f ".claude/skills/$skill/SKILL.md" ] || [ -f ".agents/skills/$skill/SKILL.md" ]; then
    echo -e "  ${GREEN}✓${NC} $skill skill present"
  else
    echo -e "  ${YELLOW}⚠${NC} $skill skill missing"
    WARNINGS=$((WARNINGS + 1))
  fi
done

# 3. Check hooks
echo ""
echo "🪝 [L4] Hooks..."
if [ -f ".claude/settings.json" ]; then
  HOOK_COUNT=$(grep -c '"type":' .claude/settings.json 2>/dev/null || echo 0)
  if [ "$HOOK_COUNT" -ge 2 ]; then
    echo -e "  ${GREEN}✓${NC} $HOOK_COUNT hooks configured"
  else
    echo -e "  ${YELLOW}⚠${NC} Only $HOOK_COUNT hooks — recommend at least 2 (SessionStart + Stop)"
    WARNINGS=$((WARNINGS + 1))
  fi
  for hook in harness-health check-vi-comment sync-memory; do
    if [ -f ".claude/hooks/$hook.sh" ]; then
      echo -e "  ${GREEN}✓${NC} $hook.sh exists"
    else
      echo -e "  ${YELLOW}⚠${NC} $hook.sh missing"
      WARNINGS=$((WARNINGS + 1))
    fi
  done
else
  echo -e "  ${RED}✗${NC} .claude/settings.json missing"
  ERRORS=$((ERRORS + 1))
fi

# 4. Check mistake log
echo ""
echo "📋 [L5] Mistake log..."
if [ -d ".harness/mistakes" ]; then
  MISTAKE_COUNT=$(find .harness/mistakes -name "*.json" -not -name "template.json" -not -name "*.example.json" 2>/dev/null | wc -l)
  if [ "$MISTAKE_COUNT" -ge 1 ]; then
    echo -e "  ${GREEN}✓${NC} $MISTAKE_COUNT mistakes logged"
  else
    echo -e "  ${YELLOW}⚠${NC} No mistakes logged yet (good — means harness is working!)"
  fi
  if [ -f ".harness/mistakes/README.md" ]; then
    echo -e "  ${GREEN}✓${NC} README present"
  else
    echo -e "  ${YELLOW}⚠${NC} README missing in .harness/mistakes/"
    WARNINGS=$((WARNINGS + 1))
  fi
else
  echo -e "  ${YELLOW}⚠${NC} .harness/mistakes/ not created yet"
  WARNINGS=$((WARNINGS + 1))
fi

# 5. Check scripts
echo ""
echo "📜 [L6] Workflows..."
SCRIPT_COUNT=0
for script in init-harness.sh init-harness.ps1; do
  if [ -f ".harness/scripts/$script" ]; then
    SCRIPT_COUNT=$((SCRIPT_COUNT + 1))
  fi
done
if [ "$SCRIPT_COUNT" -ge 1 ]; then
  echo -e "  ${GREEN}✓${NC} $SCRIPT_COUNT bootstrap scripts present"
else
  echo -e "  ${YELLOW}⚠${NC} No bootstrap scripts"
  WARNINGS=$((WARNINGS + 1))
fi

# 6. Check master doc
echo ""
echo "📖 [L1] Identity..."
if [ -f "HARNESS.md" ]; then
  echo -e "  ${GREEN}✓${NC} HARNESS.md present"
else
  echo -e "  ${YELLOW}⚠${NC} HARNESS.md missing (recommended)"
  WARNINGS=$((WARNINGS + 1))
fi

# Summary
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if [ "$ERRORS" -eq 0 ] && [ "$WARNINGS" -eq 0 ]; then
  echo -e "${GREEN}✅ Harness healthy! All systems operational.${NC}"
  exit 0
elif [ "$ERRORS" -eq 0 ]; then
  echo -e "${YELLOW}⚠️  $WARNINGS warnings, 0 errors. Harness functional but improvable.${NC}"
  exit 0
else
  echo -e "${RED}❌ $ERRORS errors, $WARNINGS warnings. Fix errors above.${NC}"
  exit 1
fi
