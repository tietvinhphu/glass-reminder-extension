import { describe, expect, it } from "vitest";

import { GOOGLE_CONTENT_SCRIPT_MATCHES } from "@/src/shared/constants/contentScript";

describe("content script scope", () => {
  it("limits injection to Google domains only", () => {
    expect(GOOGLE_CONTENT_SCRIPT_MATCHES).toEqual(["*://*.google.com/*"]);
  });

  it("avoids overly broad match patterns", () => {
    for (const pattern of GOOGLE_CONTENT_SCRIPT_MATCHES) {
      expect(pattern).not.toBe("<all_urls>");
      expect(pattern).not.toBe("*://*/*");
      expect(pattern).toContain("google.com");
    }
  });
});
