import { describe, expect, it } from "vitest";

import { existsSync } from "node:fs";
import path from "node:path";

/**
 * Local mode không inject content script — entrypoint/content.ts đã xóa
 * để tránh Edge store review flag injection vào google.com.
 */
describe("content script entrypoint", () => {
  it("không có entrypoint content script trong local mode", () => {
    const contentEntrypoint = path.resolve(
      process.cwd(),
      "entrypoints/content.ts",
    );
    expect(existsSync(contentEntrypoint)).toBe(false);
  });
});
