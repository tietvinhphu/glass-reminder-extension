import browser from "webextension-polyfill";

import type { GoogleAuthToken } from "@/src/shared/types/auth";
import { decryptToken, encryptToken } from "@/src/shared/utils/crypto";

/** Key lưu token trong chrome.storage.local — KHÔNG dùng sync vì token nhạy cảm */
const GOOGLE_TOKEN_STORAGE_KEY = "googleToken";

/**
 * Lưu token đã mã hóa vào chrome.storage.local
 * Dùng local thay vì sync: token không được đồng bộ lên cloud của browser
 */
export const storeToken = async (token: GoogleAuthToken): Promise<void> => {
  const encryptedPayload = await encryptToken(JSON.stringify(token));

  await browser.storage.local.set({
    [GOOGLE_TOKEN_STORAGE_KEY]: encryptedPayload,
  });
};

/**
 * Đọc và giải mã token từ local storage
 * Trả về null nếu chưa đăng nhập hoặc không có dữ liệu
 */
export const getToken = async (): Promise<GoogleAuthToken | null> => {
  const stored = (await browser.storage.local.get(
    GOOGLE_TOKEN_STORAGE_KEY,
  )) as Record<string, unknown>;
  const encrypted = stored[GOOGLE_TOKEN_STORAGE_KEY];

  if (typeof encrypted !== "string" || encrypted.length === 0) {
    return null;
  }

  const decrypted = await decryptToken(encrypted);
  return JSON.parse(decrypted) as GoogleAuthToken;
};

/**
 * Xóa token khi user logout
 * Chỉ xóa key local — không đụng tới sync storage
 */
export const clearToken = async (): Promise<void> => {
  await browser.storage.local.remove(GOOGLE_TOKEN_STORAGE_KEY);
};
