import { beforeEach, describe, expect, it, vi } from "vitest";

import { GOOGLE_CONTENT_SCRIPT_MATCHES } from "@/src/shared/constants/contentScript";

describe("content script entrypoint", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.unstubAllGlobals();
  });

  it("registers the shared match patterns with WXT", async () => {
    const defineContentScript = vi.fn((config: unknown) => config);
    vi.stubGlobal("defineContentScript", defineContentScript);

    await import("../../entrypoints/content");

    expect(defineContentScript).toHaveBeenCalledOnce();
    expect(defineContentScript).toHaveBeenCalledWith(
      expect.objectContaining({
        matches: [...GOOGLE_CONTENT_SCRIPT_MATCHES],
      }),
    );
  });

  it("does not register an empty matches list", async () => {
    const defineContentScript = vi.fn((config: unknown) => config);
    vi.stubGlobal("defineContentScript", defineContentScript);

    await import("../../entrypoints/content");

    const [{ matches }] = defineContentScript.mock.calls[0] as [
      { matches: string[] },
    ];

    expect(matches.length).toBeGreaterThan(0);
  });

  it("registers a main handler for page injection", async () => {
    const defineContentScript = vi.fn((config: unknown) => config);
    vi.stubGlobal("defineContentScript", defineContentScript);
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});

    await import("../../entrypoints/content");

    const [{ main }] = defineContentScript.mock.calls[0] as [
      { main: () => void },
    ];

    expect(main).toEqual(expect.any(Function));

    main();
    expect(logSpy).toHaveBeenCalledWith("Hello content.");

    logSpy.mockRestore();
  });
});
