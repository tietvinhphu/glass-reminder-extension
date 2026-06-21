import { beforeEach, describe, expect, it, vi } from "vitest";

const registerAlarmHandler = vi.fn();
const handleAlarmConfirmed = vi.fn();

vi.mock("../../src/background/alarmHandler", () => ({
  registerAlarmHandler,
  handleAlarmConfirmed,
}));

describe("background entrypoint", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    registerAlarmHandler.mockReset();
    handleAlarmConfirmed.mockReset();
  });

  it("registers a background handler with WXT", async () => {
    const defineBackground = vi.fn((fn: () => void) => fn);
    vi.stubGlobal("defineBackground", defineBackground);

    await import("../../entrypoints/background");

    expect(defineBackground).toHaveBeenCalledOnce();
    expect(defineBackground).toHaveBeenCalledWith(expect.any(Function));
  });

  it("registers alarm handler when background starts", async () => {
    const defineBackground = vi.fn((fn: () => void) => fn);
    vi.stubGlobal("defineBackground", defineBackground);

    await import("../../entrypoints/background");

    const [[backgroundHandler]] = defineBackground.mock.calls as [
      [() => void],
    ];
    backgroundHandler();

    expect(registerAlarmHandler).toHaveBeenCalledOnce();
  });
});
