#!/bin/bash
# PreCompact hook: snapshot mistake log trước khi context bị compress
# Đảm bảo agent vẫn "nhớ" các mistakes sau khi context rot
# Output: log message + summary file tạm để system include trong compressed context

LOG_PREFIX="[PreCompact]"

# Count mistakes
MISTAKES_DIR=".harness/mistakes"
if [ ! -d "$MISTAKES_DIR" ]; then
  echo "$LOG_PREFIX No mistakes directory"
  exit 0
fi

TOTAL=$(find "$MISTAKES_DIR" -name "*.json" -not -name "template.json" -not -name "*.example.json" 2>/dev/null | wc -l)

if [ "$TOTAL" -eq 0 ]; then
  echo "$LOG_PREFIX No mistakes logged yet"
  exit 0
fi

# Get recent 5 mistakes với summary
RECENT=$(find "$MISTAKES_DIR" -name "*.json" -not -name "template.json" -not -name "*.example.json" -type f -printf '%T@ %p\n' 2>/dev/null | sort -rn | head -5 | awk '{print $2}')

echo "$LOG_PREFIX Found $TOTAL mistakes logged. Recent:"
echo "$RECENT" | while read f; do
  SUMMARY=$(jq -r '.mistake.summary // "(no summary)"' "$f" 2>/dev/null)
  ROOT=$(jq -r '.root_cause // "(no root cause)"' "$f" 2>/dev/null | head -c 80)
  LAYER=$(jq -r '.harness_fix.layer // "?"' "$f" 2>/dev/null)
  DATE=$(jq -r '.date // "?"' "$f" 2>/dev/null)
  echo "  [$DATE | L$LAYER] $SUMMARY"
  echo "     → Root cause: $ROOT"
done

echo "$LOG_PREFIX Summary emitted. After compact, reference: .harness/mistakes/"
exit 0
