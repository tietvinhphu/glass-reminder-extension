import browser from "webextension-polyfill";
import { create } from "zustand";

import { AUTH_MESSAGE_TYPE } from "@/src/shared/types/authMessages";
import type { AuthResponse } from "@/src/shared/types/authMessages";
import { isExpiringSoon } from "@/src/shared/utils/auth";
import { getToken } from "@/src/shared/utils/tokenStorage";

/** State và actions của auth trong popup */
interface AuthState {
  /** true khi đã có token hợp lệ trong storage */
  isLoggedIn: boolean;
  /** Thông tin user hiển thị trên header — null khi chưa login */
  user: { email: string } | null;
  /** true khi đang chạy OAuth hoặc đọc storage */
  isLoading: boolean;
  /** Thông báo lỗi login — null khi không có lỗi */
  error: string | null;
  /** Khởi tạo trạng thái từ chrome.storage.local khi mở popup */
  initialize: () => Promise<void>;
  /** Gửi message sang background để chạy OAuth (popup có thể đóng giữa chừng) */
  login: () => Promise<void>;
  /** Xóa token qua background và reset state */
  logout: () => Promise<void>;
}

/**
 * Gửi message auth sang background service worker
 * Không gọi trực tiếp launchWebAuthFlow từ popup — context popup bị destroy khi OAuth mở tab mới
 */
const sendAuthMessage = async (
  type: typeof AUTH_MESSAGE_TYPE.LOGIN | typeof AUTH_MESSAGE_TYPE.LOGOUT,
): Promise<AuthResponse> => {
  const response = (await browser.runtime.sendMessage({ type })) as
    | AuthResponse
    | undefined;

  if (!response) {
    throw new Error("Background không phản hồi auth message");
  }

  return response;
};

/**
 * Zustand store quản lý auth state toàn popup
 * Tách riêng khỏi component để nhiều màn hình dùng chung isLoggedIn
 */
export const useAuthStore = create<AuthState>((set) => ({
  isLoggedIn: false,
  user: null,
  isLoading: false,
  error: null,

  initialize: async () => {
    set({ isLoading: true, error: null });

    try {
      const token = await getToken();
      // Token hết hạn và không còn refresh token → coi như chưa đăng nhập
      const isLoggedIn =
        token !== null &&
        !(isExpiringSoon(token.expiresAt, 0) && !token.refreshToken);

      set({
        isLoggedIn,
        user: isLoggedIn && token?.email ? { email: token.email } : null,
        isLoading: false,
      });
    } catch {
      set({
        isLoggedIn: false,
        user: null,
        isLoading: false,
        error: "Không thể đọc trạng thái đăng nhập",
      });
    }
  },

  login: async () => {
    set({ isLoading: true, error: null });

    try {
      const response = await sendAuthMessage(AUTH_MESSAGE_TYPE.LOGIN);

      if (!response.success) {
        set({
          isLoggedIn: false,
          user: null,
          isLoading: false,
          error: response.error,
        });
        return;
      }

      const token = response.token;
      if (!token) {
        set({
          isLoggedIn: false,
          user: null,
          isLoading: false,
          error: "Đăng nhập thất bại — không nhận được token",
        });
        return;
      }

      set({
        isLoggedIn: true,
        user: token.email ? { email: token.email } : { email: "Google User" },
        isLoading: false,
        error: null,
      });
    } catch (err) {
      // Popup có thể đóng khi OAuth mở tab — token mới vẫn được lưu ở background
      // Chỉ recover khi token còn hạn — tránh báo đăng nhập thành công với session cũ đã hết hạn
      const storedToken = await getToken().catch(() => null);
      if (storedToken && !isExpiringSoon(storedToken.expiresAt, 0)) {
        set({
          isLoggedIn: true,
          user: storedToken.email
            ? { email: storedToken.email }
            : { email: "Google User" },
          isLoading: false,
          error: null,
        });
        return;
      }

      const message =
        err instanceof Error ? err.message : "Đăng nhập Google thất bại";

      set({
        isLoggedIn: false,
        user: null,
        isLoading: false,
        error: message,
      });
    }
  },

  logout: async () => {
    set({ isLoading: true, error: null });

    try {
      const response = await sendAuthMessage(AUTH_MESSAGE_TYPE.LOGOUT);

      if (!response.success) {
        set({
          isLoading: false,
          error: response.error,
        });
        return;
      }

      set({
        isLoggedIn: false,
        user: null,
        isLoading: false,
        error: null,
      });
    } catch {
      set({
        isLoading: false,
        error: "Không thể đăng xuất",
      });
    }
  },
}));
