import { beforeEach, describe, expect, it, vi } from "vitest";

import type { GoogleAuthToken } from "../../src/shared/types/auth";
import { chromeMock } from "../mocks/webextension-polyfill";

describe("tokenStorage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock chrome API theo spec task — dùng chung instance với webextension-polyfill
    vi.stubGlobal("chrome", chromeMock);
  });

  it("storeToken() gọi chrome.storage.local.set (KHÔNG .sync)", async () => {
    const { storeToken } = await import("../../src/shared/utils/tokenStorage");

    const token: GoogleAuthToken = {
      accessToken: "access-token-abc",
      refreshToken: "refresh-token-xyz",
      expiresAt: Math.floor(Date.now() / 1000) + 3600,
      email: "user@example.com",
    };

    chromeMock.storage.local.set.mockResolvedValue(undefined);

    await storeToken(token);

    expect(chromeMock.storage.local.set).toHaveBeenCalledOnce();
    expect(chromeMock.storage.sync.set).not.toHaveBeenCalled();
  });

  it("getToken() → null nếu chưa có", async () => {
    chromeMock.storage.local.get.mockResolvedValue({});

    const { getToken } = await import("../../src/shared/utils/tokenStorage");

    const result = await getToken();

    expect(result).toBeNull();
    expect(chromeMock.storage.local.get).toHaveBeenCalled();
    expect(chromeMock.storage.sync.get).not.toHaveBeenCalled();
  });

  it("getToken() sau storeToken() → đúng token", async () => {
    const storedData: Record<string, unknown> = {};

    chromeMock.storage.local.set.mockImplementation(
      async (data: Record<string, unknown>) => {
        Object.assign(storedData, data);
      },
    );
    chromeMock.storage.local.get.mockImplementation(
      async (keys: string | string[] | Record<string, unknown> | null) => {
        if (keys === null) {
          return { ...storedData };
        }
        const keyList = Array.isArray(keys)
          ? keys
          : typeof keys === "string"
            ? [keys]
            : Object.keys(keys);
        const result: Record<string, unknown> = {};
        for (const key of keyList) {
          if (key in storedData) {
            result[key] = storedData[key];
          }
        }
        return result;
      },
    );

    const { storeToken, getToken } = await import(
      "../../src/shared/utils/tokenStorage"
    );

    const token: GoogleAuthToken = {
      accessToken: "stored-access-token",
      refreshToken: "stored-refresh-token",
      expiresAt: Math.floor(Date.now() / 1000) + 7200,
      email: "stored@example.com",
    };

    await storeToken(token);
    const retrieved = await getToken();

    expect(retrieved).toEqual(token);
  });
});
