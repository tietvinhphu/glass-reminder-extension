import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  define: {
    "import.meta.env.VITE_GOOGLE_CLIENT_ID": JSON.stringify(
      "test-client-id.apps.googleusercontent.com",
    ),
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
      "webextension-polyfill": path.resolve(
        __dirname,
        "tests/mocks/webextension-polyfill.ts",
      ),
    },
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./tests/setup.ts"],
    include: ["tests/**/*.{test,spec}.{ts,tsx}"],
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov"],
      include: ["src/**/*.{ts,tsx}", "entrypoints/**/*.{ts,tsx}"],
      exclude: ["**/*.d.ts"],
    },
  },
});
