import { beforeEach, describe, expect, it, vi } from "vitest";

import { AUTH_MESSAGE_TYPE } from "../../src/shared/types/authMessages";

const launchGoogleOAuth = vi.fn();
const logoutGoogle = vi.fn();
const addListener = vi.fn();

vi.mock("../../src/background/auth", () => ({
  launchGoogleOAuth,
  logoutGoogle,
}));

vi.mock("webextension-polyfill", () => ({
  default: {
    runtime: {
      onMessage: {
        addListener,
      },
    },
  },
}));

describe("authMessageHandler", () => {
  beforeEach(async () => {
    vi.resetModules();
    vi.clearAllMocks();
    launchGoogleOAuth.mockReset();
    logoutGoogle.mockReset();
    addListener.mockReset();
  });

  it("registerAuthMessageHandler() xử lý AUTH_LOGIN qua launchGoogleOAuth", async () => {
    launchGoogleOAuth.mockResolvedValue({
      accessToken: "access-token",
      refreshToken: "refresh-token",
      expiresAt: Math.floor(Date.now() / 1000) + 3600,
      email: "user@example.com",
    });

    const { registerAuthMessageHandler } = await import(
      "../../src/background/authMessageHandler"
    );

    registerAuthMessageHandler();

    expect(addListener).toHaveBeenCalledOnce();

    const messageListener = addListener.mock.calls[0]?.[0] as (
      message: unknown,
      sender: unknown,
      sendResponse: (response: unknown) => void,
    ) => boolean;

    const sendResponse = vi.fn();
    const keepChannelOpen = messageListener(
      { type: AUTH_MESSAGE_TYPE.LOGIN },
      {},
      sendResponse,
    );

    expect(keepChannelOpen).toBe(true);
    await vi.waitFor(() => {
      expect(sendResponse).toHaveBeenCalledWith({
        success: true,
        token: expect.objectContaining({ accessToken: "access-token" }),
      });
    });
  });

  it("registerAuthMessageHandler() trả lỗi khi launchGoogleOAuth fail", async () => {
    launchGoogleOAuth.mockRejectedValue(new Error("OAuth flow bị hủy"));

    const { registerAuthMessageHandler } = await import(
      "../../src/background/authMessageHandler"
    );

    registerAuthMessageHandler();

    const messageListener = addListener.mock.calls[0]?.[0] as (
      message: unknown,
      sender: unknown,
      sendResponse: (response: unknown) => void,
    ) => boolean;

    const sendResponse = vi.fn();
    messageListener({ type: AUTH_MESSAGE_TYPE.LOGIN }, {}, sendResponse);

    await vi.waitFor(() => {
      expect(sendResponse).toHaveBeenCalledWith({
        success: false,
        error: "OAuth flow bị hủy",
      });
    });
  });
});
