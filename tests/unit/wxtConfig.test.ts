import { describe, expect, it } from "vitest";

import wxtConfig from "../../wxt.config";

describe("wxt.config", () => {
  it("sets the extension manifest identity", () => {
    expect(wxtConfig.manifest).toMatchObject({
      name: "Glass Reminder Extension",
      description: "Glass Calendar & Smart Reminder Extension",
      version: "1.0.0",
    });
  });

  it("configures Edge as the primary development browser", () => {
    expect(wxtConfig.runner?.binaries?.chrome).toContain("msedge.exe");
  });
});
