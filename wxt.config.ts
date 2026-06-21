import { defineConfig } from "wxt";

import {
  REQUIRED_HOST_PERMISSIONS,
  REQUIRED_MANIFEST_PERMISSIONS,
} from "./src/shared/constants/manifest";

export default defineConfig({
  manifest: {
    name: "Glass Reminder Extension",
    description: "Glass Calendar & Smart Reminder Extension",
    version: "1.0.0",
    permissions: [...REQUIRED_MANIFEST_PERMISSIONS],
    host_permissions: [...REQUIRED_HOST_PERMISSIONS],
  },
  webExt: {
    binaries: {
      chrome:
        "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
    },
  },
});
