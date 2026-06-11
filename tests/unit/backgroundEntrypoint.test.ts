import { beforeEach, describe, expect, it, vi } from "vitest";

import browser from "webextension-polyfill";

describe("background entrypoint", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.unstubAllGlobals();
  });

  it("registers the service worker with WXT defineBackground", async () => {
    const defineBackground = vi.fn((callback: () => void) => callback);
    vi.stubGlobal("defineBackground", defineBackground);
    vi.stubGlobal("browser", browser);

    await import("../../entrypoints/background");

    expect(defineBackground).toHaveBeenCalledOnce();
    expect(defineBackground).toHaveBeenCalledWith(expect.any(Function));
  });

  it("reads the extension runtime id from the browser polyfill on startup", async () => {
    const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    let backgroundCallback: (() => void) | undefined;

    const defineBackground = vi.fn((callback: () => void) => {
      backgroundCallback = callback;
      return callback;
    });
    vi.stubGlobal("defineBackground", defineBackground);
    vi.stubGlobal("browser", browser);

    await import("../../entrypoints/background");

    expect(backgroundCallback).toBeTypeOf("function");
    backgroundCallback!();

    expect(consoleSpy).toHaveBeenCalledWith("Hello background!", {
      id: "test-extension-id",
    });

    consoleSpy.mockRestore();
  });
});
