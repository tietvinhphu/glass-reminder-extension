import { describe, expect, it } from "vitest";

import {
  isHttpsOnlyHostPermission,
  isOverlyBroadMatchPattern,
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

  it("accepts Edge-specific MV3 match pattern schemes", () => {
    expect(
      isValidManifestMatchPattern("ms-browser-extension://test-extension-id/*"),
    ).toBe(true);
  });

  it("flags store-risky overly broad match patterns", () => {
    expect(isOverlyBroadMatchPattern("<all_urls>")).toBe(true);
    expect(isOverlyBroadMatchPattern("*://*/*")).toBe(true);
    expect(isOverlyBroadMatchPattern("*://*")).toBe(true);
    expect(isOverlyBroadMatchPattern("*://*.google.com/*")).toBe(false);
  });
});
