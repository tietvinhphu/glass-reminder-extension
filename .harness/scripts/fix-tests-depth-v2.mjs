// Fix 10 lỗi TS 2307 còn lại trong tests/unit/*.test.ts
// Root causes:
//   Pattern 1: '../../background/X' (thiếu /src/) → '../../src/background/X'
//   Pattern 2: '../../shared/X'    (thiếu /src/) → '../../src/shared/X'
//   Pattern 3: '../../src/utils/matchPatterns' (test fixture ở tests/utils/) → '../utils/matchPatterns'
//
// Run: node .harness/scripts/fix-tests-depth-v2.mjs
import { promises as fs } from 'node:fs';
import path from 'node:path';

const ROOT = 'd:/OneDrive/Data Automation/Projects/glass-reminder-extension';
const TESTS_DIR = path.join(ROOT, 'tests', 'unit');

async function findFiles(dir, ext) {
  const results = [];
  async function walk(d) {
    const entries = await fs.readdir(d, { withFileTypes: true });
    for (const e of entries) {
      const p = path.join(d, e.name);
      if (e.isDirectory()) {
        if (['node_modules', '.wxt', '.output', 'dist', '.git'].includes(e.name)) continue;
        await walk(p);
      } else if (e.name.endsWith(ext)) {
        results.push(p);
      }
    }
  }
  await walk(dir);
  return results;
}

async function processFile(file) {
  const content = await fs.readFile(file, 'utf-8');
  let changed = false;
  let newContent = content;

  // Pattern 1: '../../background/X' (thiếu /src/) → '../../src/background/X'
  const re1 = /(['"])(\.\.\/\.\.\/background\/[^'"]+)\1/g;
  newContent = newContent.replace(re1, (m, q, rest) => {
    changed = true;
    return q + rest.replace('../../background/', '../../src/background/') + q;
  });

  // Pattern 2: '../../shared/X' (thiếu /src/) → '../../src/shared/X'
  const re2 = /(['"])(\.\.\/\.\.\/shared\/[^'"]+)\1/g;
  newContent = newContent.replace(re2, (m, q, rest) => {
    changed = true;
    return q + rest.replace('../../shared/', '../../src/shared/') + q;
  });

  // Pattern 3: '../../src/utils/matchPatterns' → '../utils/matchPatterns' (test fixture)
  const re3 = /(['"])(\.\.\/\.\.\/src\/utils\/matchPatterns)\1/g;
  newContent = newContent.replace(re3, (m, q) => {
    changed = true;
    return q + '../utils/matchPatterns' + q;
  });

  if (changed) {
    await fs.writeFile(file, newContent, 'utf-8');
    return true;
  }
  return false;
}

const files = [...(await findFiles(TESTS_DIR, '.ts')), ...(await findFiles(TESTS_DIR, '.tsx'))];
let changedCount = 0;
for (const f of files) {
  if (await processFile(f)) {
    changedCount++;
    console.log('  ✓ ' + path.relative(ROOT, f));
  }
}
console.log(`\nDone: ${changedCount}/${files.length} test files fixed`);
