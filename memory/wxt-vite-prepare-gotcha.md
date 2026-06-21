---
name: wxt-vite-prepare-gotcha
description: WXT/Vite ViteNodeRunner chạy context riêng — TypeScript editor pass và `tsc --noEmit` pass KHÔNG đảm bảo `wxt prepare` pass. Phải verify bằng `wxt prepare` (hoặc `npm run dev` / `wxt build`) sau mọi config change.
metadata:
  type: project
---

# WXT/Vite Prepare Gotcha

## Vấn đề

Với dự án WXT (browser extension framework trên Vite), có 2 command system khác nhau:

| Command | Context | Dùng cho |
|---|---|---|
| `tsc --noEmit` / TypeScript editor | TS compiler thuần | Check type errors |
| `wxt prepare` | **ViteNodeRunner** riêng của WXT | Generate `.output/` directory |

**ViteNodeRunner load plugin context riêng** — nếu bạn thêm plugin Vite (vd: `vite-tsconfig-paths`) vào `wxt.config.ts`, plugin CÓ THỂ không apply trong `wxt prepare` dù nó work với `tsc`.

Tương tự:
- `tsconfig.json` `paths` config → TS editor thấy nhưng ViteNodeRunner KHÔNG thấy
- `vite-tsconfig-paths` plugin → apply cho Vite production build nhưng KHÔNG apply cho `wxt prepare`
- `@/X` alias → work trong editor nhưng fail ở `wxt prepare` vì plugin không load

## Cách verify (BẮT BUỘC sau config change)

```bash
# 3 lệnh phải chạy theo thứ tự
npx wxt prepare      # ← QUAN TRỌNG NHẤT, dùng ViteNodeRunner
npm run type-check   # ← verify TS
npm run test         # ← verify Vitest
```

Hoặc dùng quality gate script:
```bash
bash .harness/scripts/verify-config-change.sh
```

## Khi nào áp dụng

- Sửa `tsconfig.json` (paths, baseUrl, compilerOptions)
- Sửa `wxt.config.ts` (vite plugin, defineConfig)
- Đổi import pattern giữa alias (`@/X`) ↔ relative path
- Thêm deps mới có thể ảnh hưởng build pipeline
- Update WXT version

## Anti-pattern

❌ Sửa tsconfig → chạy `tsc --noEmit` → thấy pass → announce "done"
→ Bug: `wxt prepare` sẽ fail ở command thật, user phát hiện khi load extension

❌ Thêm plugin Vite vào wxt.config.ts → không test `wxt prepare`
→ Bug: plugin không apply trong ViteNodeRunner, extension không load

✅ Đúng: Sau MỌI config change, chạy `bash .harness/scripts/verify-config-change.sh`

## Related

- Mistake log: `.harness/mistakes/2026-06-21-assume-config-works.json`
- Skill: `harness-mistake-log` (Hashimoto Mistake Loop)
- Hook L4 (skill drift) khác: `.claude/hooks/check-skill-drift.sh` — cùng pattern nhưng cho skill files
