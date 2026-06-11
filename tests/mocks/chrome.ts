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

export const createChromeMock = (): ChromeMock => ({
  storage: {
    local: {
      get: vi.fn(),
      set: vi.fn(),
      remove: vi.fn(),
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
