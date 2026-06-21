import { beforeEach, describe, expect, it, vi } from "vitest";

import type { GoogleAuthToken } from "@/shared/types/auth";

const getToken = vi.fn();
const storeToken = vi.fn();
const launchWebAuthFlow = vi.fn();
const getRedirectURL = vi.fn();

vi.mock("@/shared/utils/tokenStorage", () => ({
  getToken,
  storeToken,
  clearToken: vi.fn(),
}));

vi.mock("webextension-polyfill", () => ({
  default: {
    identity: {
      launchWebAuthFlow,
      getRedirectURL,
    },
  },
}));

describe("launchGoogleOAuth", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    vi.stubEnv("VITE_GOOGLE_CLIENT_ID", "test-client-id.apps.googleusercontent.com");

    getRedirectURL.mockReturnValue("https://test-extension.chromiumapp.org/");
    launchWebAuthFlow.mockResolvedValue(
      "https://test-extension.chromiumapp.org/?code=oauth-auth-code",
    );

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          access_token: "new-access-token",
          expires_in: 3600,
          token_type: "Bearer",
        }),
      }),
    );
  });

  it("launchGoogleOAuth() vẫn chạy khi getToken() throw do storage corrupt", async () => {
    getToken.mockRejectedValue(new Error("Định dạng token mã hóa không hợp lệ"));
    storeToken.mockResolvedValue(undefined);

    const { launchGoogleOAuth } = await import("@/background/auth");
    const token = await launchGoogleOAuth();

    expect(launchWebAuthFlow).toHaveBeenCalledOnce();
    expect(storeToken).toHaveBeenCalledOnce();

    const storedToken = storeToken.mock.calls[0]?.[0] as GoogleAuthToken;
    expect(token.accessToken).toBe("new-access-token");
    expect(storedToken.accessToken).toBe("new-access-token");
    expect(storedToken.refreshToken).toBe("");
  });
});
