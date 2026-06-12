import { vi, type Mock } from "vitest";

export interface ChromeMock {
  storage: {
    local: {
      get: Mock;
      set: Mock;
      remove: Mock;
    };
    sync: {
      get: Mock;
      set: Mock;
    };
  };
  alarms: {
    create: Mock;
    clear: Mock;
    onAlarm: {
      addListener: Mock;
    };
  };
  notifications: {
    create: Mock;
    clear: Mock;
  };
  identity: {
    launchWebAuthFlow: Mock;
    getRedirectURL: Mock;
  };
  runtime: {
    id: string;
  };
}

let sharedChromeMock: ChromeMock | null = null;

/** Trả về singleton mock — tránh resetModules tạo instance mới */
export const getChromeMock = (): ChromeMock => {
  if (!sharedChromeMock) {
    sharedChromeMock = createChromeMock();
  }
  return sharedChromeMock;
};

export const createChromeMock = (): ChromeMock => ({
  storage: {
    local: {
      get: vi.fn().mockResolvedValue({}),
      set: vi.fn().mockResolvedValue(undefined),
      remove: vi.fn().mockResolvedValue(undefined),
    },
    sync: {
      get: vi.fn(),
      set: vi.fn(),
    },
  },
  alarms: {
    create: vi.fn(),
    clear: vi.fn(),
    onAlarm: {
      addListener: vi.fn(),
    },
  },
  notifications: {
    create: vi.fn(),
    clear: vi.fn(),
  },
  identity: {
    launchWebAuthFlow: vi.fn(),
    getRedirectURL: vi.fn(),
  },
  runtime: {
    id: "test-extension-id",
  },
});
