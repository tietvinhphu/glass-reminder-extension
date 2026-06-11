import { defineConfig } from "wxt";

export default defineConfig({
  manifest: {
    name: "Glass Reminder Extension",
    description: "Glass Calendar & Smart Reminder Extension",
    version: "1.0.0",
  },
  runner: {
    binaries: {
      chrome:
        "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
    },
  },
});
