import { describe, expect, it } from "vitest";

import {
  isHttpsOnlyHostPermission,
  isValidManifestMatchPattern,
} from "../utils/matchPatterns";

describe("match pattern helpers", () => {
  it("accepts scoped Google content script patterns", () => {
    expect(isValidManifestMatchPattern("*://*.google.com/*")).toBe(true);
  });

  it("rejects invalid match pattern syntax", () => {
    expect(isValidManifestMatchPattern("not-a-pattern")).toBe(false);
    expect(isValidManifestMatchPattern("")).toBe(false);
  });

  it("identifies HTTPS-only host permissions", () => {
    expect(isHttpsOnlyHostPermission("https://www.googleapis.com/*")).toBe(true);
    expect(isHttpsOnlyHostPermission("http://www.googleapis.com/*")).toBe(false);
  });
});
