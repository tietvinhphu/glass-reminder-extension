import { beforeEach, describe, expect, it, vi } from "vitest";

import browser from "webextension-polyfill";

describe("background entrypoint", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.unstubAllGlobals();
  });

  it("registers a background handler with WXT", async () => {
    const defineBackground = vi.fn((fn: () => void) => fn);
    vi.stubGlobal("defineBackground", defineBackground);

    await import("../../entrypoints/background");

    expect(defineBackground).toHaveBeenCalledOnce();
    expect(defineBackground).toHaveBeenCalledWith(expect.any(Function));
  });

  it("reads runtime id from the browser API when the handler runs", async () => {
    const defineBackground = vi.fn((fn: () => void) => fn);
    vi.stubGlobal("defineBackground", defineBackground);
    vi.stubGlobal("browser", browser);

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
