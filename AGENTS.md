# AGENTS.md

## Cursor Cloud specific instructions

This repo is a single product: the **Glass Reminder Extension**, a WXT + React (Manifest V3)
browser extension. There is no backend/server, database, or Docker — "running" means building the
extension and loading it into a Chromium browser. Standard commands live in `package.json` and
`CLAUDE.md`; only non-obvious caveats are captured here.

### Dependencies / startup
- `npm install` installs everything and runs `postinstall` (`wxt prepare`, generates `.wxt/` types).
  This is the only setup step and is handled by the update script.
- Node 22 (the VM default) works fine even though docs mention Node 20.

### Running in dev mode (gotcha: hardcoded Windows browser path)
- `wxt.config.ts` hardcodes a **Windows Edge** binary path in `runner.binaries.chrome`. On Linux,
  `npm run dev` builds correctly but then **crashes** when it tries to auto-launch that path
  (`spawn ...msedge.exe ENOENT`).
- Fix without editing committed code: create a **gitignored** `web-ext.config.ts` at the repo root
  (WXT loads it as a local runner override). This file is intentionally not committed, so recreate it
  on a fresh VM if you want dev-mode auto-launch:
  ```ts
  import { defineWebExtConfig } from "wxt";
  export default defineWebExtConfig({
    binaries: { chrome: "/usr/bin/google-chrome-stable" },
    chromiumArgs: ["--no-sandbox", "--no-first-run"],
  });
  ```
- Alternatively, skip auto-launch entirely: run `npm run build` (prod → `.output/chrome-mv3`) or
  `npm run dev` (dev → `.output/chrome-mv3-dev`), then in Chrome go to `chrome://extensions`, enable
  Developer mode, and "Load unpacked" pointing at the output dir.
- Open the popup via the **toolbar extension icon**. Navigating directly to
  `chrome-extension://<id>/popup.html` is blocked by Chrome (`ERR_BLOCKED_BY_CLIENT`).

### Tests / type-check / lint
- There is **no `test` or `lint` script** in `package.json`. Run tests with `npx vitest --run`
  (watch: `npx vitest`). Type-check with `npm run compile` (`tsc --noEmit`). ESLint/Prettier are
  referenced in docs but not wired up in the repo.
- Known pre-existing breakage (NOT an environment problem): three committed test files contain
  merged/duplicated blocks with syntax errors — `tests/unit/backgroundEntrypoint.test.ts`,
  `tests/unit/contentScriptEntrypoint.test.ts`, `tests/unit/wxtConfig.test.ts`. They make
  `npm run compile` fail and 3 of 7 vitest files error out; the other 4 files (18 tests) pass. Fix
  the source files if a task requires a green test/compile run.
