import { describe, expect, it } from "vitest";

import { GOOGLE_CONTENT_SCRIPT_MATCHES } from "@/src/shared/constants/contentScript";
import {
  isOverlyBroadMatchPattern,
  isValidManifestMatchPattern,
} from "../utils/matchPatterns";

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

  it("uses valid MV3 match pattern syntax", () => {
    for (const pattern of GOOGLE_CONTENT_SCRIPT_MATCHES) {
      expect(isValidManifestMatchPattern(pattern)).toBe(true);
    }
  });

  it("does not use store-risky overly broad match patterns", () => {
    for (const pattern of GOOGLE_CONTENT_SCRIPT_MATCHES) {
      expect(isOverlyBroadMatchPattern(pattern)).toBe(false);
    }
  });
});
