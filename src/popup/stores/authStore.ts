import { create } from "zustand";

import { launchGoogleOAuth, logoutGoogle } from "@/src/background/auth";
import type { AuthUser } from "@/src/shared/types/auth";
import { getToken } from "@/src/shared/utils/tokenStorage";

/** State và actions của auth trong popup */
interface AuthState {
  /** true khi đã có token hợp lệ trong storage */
  isLoggedIn: boolean;
  /** Thông tin user hiển thị trên header — null khi chưa login */
  user: AuthUser | null;
  /** true khi đang chạy OAuth hoặc đọc storage */
  isLoading: boolean;
  /** Thông báo lỗi login — null khi không có lỗi */
  error: string | null;
  /** Khởi tạo trạng thái từ chrome.storage.local khi mở popup */
  initialize: () => Promise<void>;
  /** Bắt đầu OAuth flow qua background service */
  login: () => Promise<void>;
  /** Xóa token và reset state */
  logout: () => Promise<void>;
}

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
      const isLoggedIn = token !== null;

      set({
        isLoggedIn,
        user: token?.email ? { email: token.email } : null,
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
      const token = await launchGoogleOAuth();

      set({
        isLoggedIn: true,
        user: token.email ? { email: token.email } : { email: "Google User" },
        isLoading: false,
        error: null,
      });
    } catch (err) {
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
      await logoutGoogle();
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
