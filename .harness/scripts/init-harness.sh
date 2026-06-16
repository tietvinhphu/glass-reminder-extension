#!/bin/bash
# Khởi tạo project mới từ Harness Framework templates
# Usage: ./init-harness.sh <project-name> <stack> <purpose> [deploy-target]

set -e

PROJECT_NAME="${1:?Missing project name}"
STACK="${2:?Missing stack}"
PURPOSE="${3:?Missing purpose}"
DEPLOY_TARGET="${4:-Vercel}"
DATE=$(date '+%Y-%m-%d')

# Determine source directory (where .harness/ lives)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
HARNESS_ROOT="$(dirname "$SCRIPT_DIR")"
SOURCE_REPO="$(dirname "$HARNESS_ROOT")"

# Determine target directory
TARGET_DIR="${PROJECT_NAME}"

if [ -d "$TARGET_DIR" ]; then
  echo "❌ Directory $TARGET_DIR đã tồn tại" >&2
  exit 1
fi

echo "🚀 Bootstrapping $PROJECT_NAME từ Harness Framework..."
echo "   Stack: $STACK"
echo "   Purpose: $PURPOSE"
echo "   Deploy: $DEPLOY_TARGET"
echo ""

# 1. Tạo thư mục + git init
mkdir -p "$TARGET_DIR"
cd "$TARGET_DIR"
git init -q

# 2. Copy + substitute templates
TEMPLATES=(
  "CLAUDE.template.md"
  "AGENTS.template.md"
  "INSTRUCTIONS.template.md"
  ".cursorrules.template"
  "settings.template.json"
  "MEMORY.template.md"
  "mistake-log.template.json"
  "sync-memory.template.sh"
  "sync-memory.template.ps1"
)

UUID=$(cat /proc/sys/kernel/random/uuid)

for tpl in "${TEMPLATES[@]}"; do
  src="$HARNESS_ROOT/templates/$tpl"
  dest_name="${tpl//.template./.}"
  dest="./$dest_name"
  if [ ! -f "$src" ]; then
    echo "⚠️  Template không tồn tại: $src" >&2
    continue
  fi
  content=$(cat "$src")
  content="${content//\{\{PROJECT_NAME\}\}/$PROJECT_NAME}"
  content="${content//\{\{STACK\}\}/$STACK}"
  content="${content//\{\{PURPOSE\}\}/$PURPOSE}"
  content="${content//\{\{DEPLOY_TARGET\}\}/$DEPLOY_TARGET}"
  content="${content//\{\{DATE\}\}/$DATE}"
  content="${content//\{\{UUID\}\}/$UUID}"
  echo "$content" > "$dest"
  echo "  ✓ $dest_name"
done

# 3. Copy mistake log example vào .harness/mistakes/
mkdir -p .harness/mistakes
if [ -d "$HARNESS_ROOT/mistakes" ]; then
  cp -r "$HARNESS_ROOT/mistakes/." .harness/mistakes/
fi

# 4. Make sync scripts executable
chmod +x sync-memory.sh sync-memory.ps1 2>/dev/null || true

# 5. First commit
git add -A
git commit -q -m "chore: bootstrap $PROJECT_NAME from harness framework v1.0"

echo ""
echo "✅ Project $PROJECT_NAME đã được bootstrap thành công!"
echo "📁 Location: $(pwd)"
echo "🚀 Next steps:"
echo "   cd $TARGET_DIR"
echo "   code ."
echo ""
