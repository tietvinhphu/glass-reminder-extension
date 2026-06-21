#!/bin/bash
# ============================================================
# verify-config-change.sh — L7 Quality Gate cho config changes
# ============================================================
# Mục đích: Sau khi sửa bất kỳ config nào (tsconfig, wxt.config,
# vite plugin, package.json scripts), PHẢI chạy script này để
# đảm bảo tất cả 3 bước đều pass trước khi announce "fix xong".
#
# Lý do: Với WXT/Vite, TS editor pass KHÔNG có nghĩa là
# `wxt prepare` pass — ViteNodeRunner dùng context riêng, có thể
# fail ở command thật dù type-check xanh.
#
# Đây là COMMAND OF RECORD. Sau khi sửa:
#   - tsconfig.json
#   - wxt.config.ts
#   - vite plugin config
#   - package.json (thêm deps, scripts)
#   - bất kỳ file nào có thể ảnh hưởng đến build pipeline
#
# Cách dùng:
#   bash .harness/scripts/verify-config-change.sh
#
# Nếu FAIL ở bất kỳ bước nào → KHÔNG được announce "done".
# Fix root cause trước, chạy lại, rồi mới commit.
#
# Why: Bài học từ mistake 2026-06-21-assume-config-works — agent
# tốn 3 turn sai vì không verify bằng `wxt prepare` sau khi thay
# đổi tsconfig/vite plugin. Script này là fix L7.
# ============================================================

set -e  # Exit ngay khi bất kỳ step nào fail

echo "============================================================"
echo "🔍 L7 Quality Gate — verify-config-change"
echo "============================================================"
echo ""

# ─── STEP 1: wxt prepare ────────────────────────────────────
# Đây là COMMAND BẮT BUỘC cho mọi config change.
# `wxt prepare` chạy ViteNodeRunner riêng — nếu alias sai hoặc
# plugin không apply, nó fail ngay. KHÔNG thay thế được bằng tsc.
echo "📦 Step 1/3: wxt prepare ..."
if ! npx wxt prepare 2>&1; then
  echo ""
  echo "❌ wxt prepare FAILED"
  echo "   → ViteNodeRunner không thấy module hoặc plugin không apply"
  echo "   → Đây là lỗi runtime build, KHÔNG phải TS compile error"
  echo "   → Xem memory/wxt-vite-prepare-gotcha.md để biết root cause"
  exit 1
fi
echo "   ✅ wxt prepare PASS"
echo ""

# ─── STEP 2: type-check ────────────────────────────────────
# Verify TS strict mode không bị break bởi config change.
echo "📝 Step 2/3: type-check ..."
if ! npm run type-check 2>&1; then
  echo ""
  echo "❌ type-check FAILED"
  echo "   → TS compile lỗi. Có thể do paths sai, types chưa có, ..."
  exit 1
fi
echo "   ✅ type-check PASS"
echo ""

# ─── STEP 3: tests ─────────────────────────────────────────
# Đảm bảo Vitest không bị break bởi import path đổi.
echo "🧪 Step 3/3: tests ..."
if ! npm run test 2>&1; then
  echo ""
  echo "❌ tests FAILED"
  echo "   → Có thể do import path sai, mock chưa sync, ..."
  exit 1
fi
echo "   ✅ tests PASS"
echo ""

echo "============================================================"
echo "✅ ALL 3 STEPS PASS — Config change đã verify"
echo "============================================================"
echo ""
echo "Anh có thể announce 'fix xong' và commit được rồi."
echo "Đừng quên: git diff kiểm tra lại, đọc từng file đã sửa."
