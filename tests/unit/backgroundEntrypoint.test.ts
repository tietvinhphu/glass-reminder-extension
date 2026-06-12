import { beforeEach, describe, expect, it, vi } from "vitest";

const registerAlarmHandler = vi.fn();
const restoreAlarms = vi.fn().mockResolvedValue(undefined);

vi.mock("@/src/background/alarmHandler", () => ({
  registerAlarmHandler,
  restoreAlarms,
}));

describe("background entrypoint", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    registerAlarmHandler.mockReset();
    restoreAlarms.mockReset();
    restoreAlarms.mockResolvedValue(undefined);
  });

  it("registers a background handler with WXT", async () => {
    const defineBackground = vi.fn((fn: () => void) => fn);
    vi.stubGlobal("defineBackground", defineBackground);

    await import("../../entrypoints/background");

    expect(defineBackground).toHaveBeenCalledOnce();
    expect(defineBackground).toHaveBeenCalledWith(expect.any(Function));
  });

  it("registers alarm handler and restores alarms when background starts", async () => {
    const defineBackground = vi.fn((fn: () => void) => fn);
    vi.stubGlobal("defineBackground", defineBackground);

    const browser = (await import("webextension-polyfill")).default;
    await import("../../entrypoints/background");

    const [[backgroundHandler]] = defineBackground.mock.calls as [
      [() => void],
    ];
    backgroundHandler();

    expect(registerAlarmHandler).toHaveBeenCalledOnce();
    expect(restoreAlarms).toHaveBeenCalledOnce();
    expect(browser.runtime.onInstalled?.addListener).toHaveBeenCalledOnce();
  });
});
