import { beforeEach, describe, expect, it, vi } from "vitest";

const registerAuthMessageHandler = vi.fn();

vi.mock("@/background/authMessageHandler", () => ({
  registerAuthMessageHandler,
}));

describe("background entrypoint", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    registerAuthMessageHandler.mockReset();
  });

  it("registers a background handler with WXT", async () => {
    const defineBackground = vi.fn((fn: () => void) => fn);
    vi.stubGlobal("defineBackground", defineBackground);

    await import("../../entrypoints/background");

    expect(defineBackground).toHaveBeenCalledOnce();
    expect(defineBackground).toHaveBeenCalledWith(expect.any(Function));
  });

  it("registers auth message handler when background starts", async () => {
    const defineBackground = vi.fn((fn: () => void) => fn);
    vi.stubGlobal("defineBackground", defineBackground);

    await import("../../entrypoints/background");

    const [[backgroundHandler]] = defineBackground.mock.calls as [
      [() => void],
    ];
    backgroundHandler();

    expect(registerAuthMessageHandler).toHaveBeenCalledOnce();
  });
});
