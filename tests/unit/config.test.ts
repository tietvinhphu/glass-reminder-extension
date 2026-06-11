import { describe, expect, it } from "vitest";

import { createChromeMock } from "../mocks/chrome";

describe("test infrastructure", () => {
  it("imports webextension-polyfill through the test mock", async () => {
    const browser = await import("webextension-polyfill");

    expect(browser.default).toBeDefined();
    expect(browser.default.runtime.id).toBe("test-extension-id");
    expect(browser.default.storage.local.get).toBeDefined();
  });

  it("provides a reusable chrome API mock", () => {
    const chromeMock = createChromeMock();

    expect(chromeMock.storage.local.get).toBeDefined();
    expect(chromeMock.storage.sync.set).toBeDefined();
    expect(chromeMock.alarms.create).toBeDefined();
    expect(chromeMock.notifications.create).toBeDefined();
    expect(chromeMock.identity.launchWebAuthFlow).toBeDefined();
    expect(chromeMock.runtime.id).toBe("test-extension-id");
  });

  it("resolves extension asset URLs through runtime.getURL", async () => {
    const browser = await import("webextension-polyfill");

    expect(browser.default.runtime.getURL("/icons/icon-48.png")).toBe(
      "chrome-extension://test-extension-id/icons/icon-48.png",
    );
  });
});
