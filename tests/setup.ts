import "@testing-library/jest-dom/vitest";
import { vi } from "vitest";

import { chromeMock } from "./mocks/webextension-polyfill";

/**
 * Gắn mock chrome API lên global — theo spec test infrastructure
 * Token và OAuth tests spy trực tiếp storage.local / identity
 */
vi.stubGlobal("chrome", chromeMock);
