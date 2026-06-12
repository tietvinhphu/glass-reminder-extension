import { describe, expect, it } from "vitest";

import { decryptToken, encryptToken } from "@/src/shared/utils/crypto";

describe("crypto utils", () => {
  it("encryptToken() trả về string khác text gốc", async () => {
    const plainText = "secret-access-token-value";

    const encrypted = await encryptToken(plainText);

    expect(encrypted).not.toBe(plainText);
    expect(typeof encrypted).toBe("string");
    expect(encrypted.length).toBeGreaterThan(0);
  });

  it("decryptToken(encryptToken(text)) === text gốc", async () => {
    const plainText = "another-secret-token-12345";

    const encrypted = await encryptToken(plainText);
    const decrypted = await decryptToken(encrypted);

    expect(decrypted).toBe(plainText);
  });
});
