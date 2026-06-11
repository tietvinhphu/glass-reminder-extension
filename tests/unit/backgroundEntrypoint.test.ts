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
  it("registers a background handler with WXT", async () => {
    const defineBackground = vi.fn((fn: () => void) => fn);
    vi.stubGlobal("defineBackground", defineBackground);

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
  it("reads runtime id from the browser API when the handler runs", async () => {
    const defineBackground = vi.fn((fn: () => void) => fn);
    vi.stubGlobal("defineBackground", defineBackground);
    vi.stubGlobal("browser", {
      runtime: { id: "test-extension-id" },
    });

    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});

    await import("../../entrypoints/background");

    const [[backgroundHandler]] = defineBackground.mock.calls as [
      [() => void],
    ];
    backgroundHandler();

    expect(logSpy).toHaveBeenCalledWith("Hello background!", {
      id: "test-extension-id",
    });

    logSpy.mockRestore();
  });
});
