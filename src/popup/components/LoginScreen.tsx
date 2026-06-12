import { LogIn } from "lucide-react";

import { useAuth } from "@/src/popup/hooks/useAuth";

/**
 * Màn hình đăng nhập — glass style, nút Sign in with Google
 * Hiển thị khi user chưa có token trong storage
 */
export const LoginScreen = () => {
  const { login, isLoading, error } = useAuth();

  return (
    <div className="login-screen">
      {/* Card glass chính — blur + border mờ theo design system */}
      <div className="glass-card login-card">
        <h1 className="login-title">Glass Reminder</h1>
        <p className="login-subtitle">
          Đồng bộ lịch Google và nhận nhắc nhở thông minh
        </p>

        {/* Nút OAuth — gọi login() mở Google consent screen */}
        <button
          type="button"
          className="glass-button login-button"
          onClick={() => void login()}
          disabled={isLoading}
          aria-busy={isLoading}
        >
          <LogIn size={18} aria-hidden="true" />
          <span>{isLoading ? "Đang đăng nhập..." : "Sign in with Google"}</span>
        </button>

        {/* Hiển thị lỗi OAuth — không log token, chỉ message an toàn */}
        {error ? (
          <p className="login-error" role="alert">
            {error}
          </p>
        ) : null}
      </div>
    </div>
  );
};
