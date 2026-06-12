import type { PKCEPair } from "@/src/shared/types/auth";

/** Prefix version cho payload mã hóa — giúp migrate format sau này */
const ENCRYPTED_PAYLOAD_VERSION = "v1";

/** Độ dài IV (nonce) chuẩn AES-GCM — 12 byte */
const GCM_IV_LENGTH_BYTES = 12;

/** Salt dùng derive key — cố định trong extension, không chứa secret user */
const KEY_DERIVATION_SALT = "glass-reminder-extension-token-salt";

/**
 * Chuyển Uint8Array sang chuỗi base64url (RFC 4648, không padding)
 * Dùng cho PKCE code_challenge và payload mã hóa
 */
const toBase64Url = (bytes: Uint8Array): string => {
  const base64 = btoa(String.fromCharCode(...bytes));
  return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
};

/**
 * Giải mã base64url về Uint8Array
 */
const fromBase64Url = (value: string): Uint8Array => {
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
  const binary = atob(padded);
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
};

/**
 * Lấy extension id an toàn — hoạt động cả trong browser lẫn vitest
 */
const getExtensionId = (): string => {
  const chromeApi = (
    globalThis as { chrome?: { runtime?: { id?: string } } }
  ).chrome;

  return chromeApi?.runtime?.id ?? "test-extension-id";
};

/**
 * Lấy material để derive encryption key
 * Dùng extension runtime id — mỗi cài đặt extension có key riêng
 */
const getKeyMaterial = async (): Promise<CryptoKey> => {
  const extensionId = getExtensionId();

  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    encoder.encode(extensionId),
    "PBKDF2",
    false,
    ["deriveKey"],
  );

  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: encoder.encode(KEY_DERIVATION_SALT),
      iterations: 100_000,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
};

/**
 * Sinh cặp PKCE cho OAuth 2.0
 * codeVerifier: chuỗi ngẫu nhiên 43-128 ký tự
 * codeChallenge: SHA-256(codeVerifier) encode base64url
 */
export const generatePKCE = async (): Promise<PKCEPair> => {
  const randomBytes = new Uint8Array(32);
  crypto.getRandomValues(randomBytes);

  const codeVerifier = toBase64Url(randomBytes);

  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(codeVerifier),
  );
  const codeChallenge = toBase64Url(new Uint8Array(digest));

  return { codeVerifier, codeChallenge };
};

/**
 * Mã hóa token bằng AES-GCM 256-bit trước khi lưu storage
 * Output: v1:<iv_base64url>.<ciphertext_base64url>
 */
export const encryptToken = async (plainText: string): Promise<string> => {
  const key = await getKeyMaterial();
  const iv = new Uint8Array(GCM_IV_LENGTH_BYTES);
  crypto.getRandomValues(iv);

  const cipherBuffer = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    new TextEncoder().encode(plainText),
  );

  const cipherText = toBase64Url(new Uint8Array(cipherBuffer));
  const ivEncoded = toBase64Url(iv);

  return `${ENCRYPTED_PAYLOAD_VERSION}:${ivEncoded}.${cipherText}`;
};

/**
 * Giải mã token đã mã hóa bằng encryptToken()
 * Parse IV + ciphertext từ payload rồi decrypt AES-GCM
 */
export const decryptToken = async (encrypted: string): Promise<string> => {
  const [version, payload] = encrypted.split(":");
  if (version !== ENCRYPTED_PAYLOAD_VERSION || !payload) {
    throw new Error("Định dạng token mã hóa không hợp lệ");
  }

  const [ivEncoded, cipherEncoded] = payload.split(".");
  if (!ivEncoded || !cipherEncoded) {
    throw new Error("Payload mã hóa thiếu IV hoặc ciphertext");
  }

  const key = await getKeyMaterial();
  const iv = fromBase64Url(ivEncoded);
  const cipherBytes = fromBase64Url(cipherEncoded);

  const plainBuffer = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: iv as BufferSource },
    key,
    cipherBytes as BufferSource,
  );

  return new TextDecoder().decode(plainBuffer);
};
