import { vi } from "vitest";

import { getChromeMock, type ChromeMock } from "./chrome";

/**
 * Mock browser API dùng chung cho mọi test
 * Singleton — spy storage.local trên cùng instance dù resetModules
 */
export const chromeMock: ChromeMock = getChromeMock();

const browser = {
  ...chromeMock,
  runtime: {
    id: "test-extension-id",
    getURL: vi.fn(
      (path: string) => `chrome-extension://test-extension-id${path}`,
    ),
    onInstalled: {
      addListener: vi.fn(),
    },
    onMessage: {
      addListener: vi.fn(),
    },
    sendMessage: vi.fn(),
  },
};

export default browser;
