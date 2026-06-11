import { vi } from "vitest";

import { createChromeMock } from "./chrome";

const browser = {
  ...createChromeMock(),
  runtime: {
    id: "test-extension-id",
    getURL: vi.fn((path: string) => `chrome-extension://test-extension-id${path}`),
  },
};

export default browser;
