import { useEffect, type ReactNode } from "react";

import { useAuth } from "@/popup/hooks/useAuth";
import { LoginScreen } from "@/popup/components/LoginScreen";

interface AuthGateProps {
  /** Nội dung chính của app — chỉ render khi đã đăng nhập */
  children: ReactNode;
}

/**
 * Auth gate — kiểm tra login trước khi render app
 * Flow: initialize từ storage → isLoggedIn ? children : LoginScreen
 */
export const AuthGate = ({ children }: Readonly<AuthGateProps>) => {
  const { isLoggedIn, isLoading, initialize } = useAuth();

  // Đọc token từ storage khi popup mount
  useEffect(() => {
    void initialize();
  }, [initialize]);

  if (isLoading) {
    return (
      <div className="auth-gate-loading" aria-live="polite">
        {"Đang kiểm tra đăng nhập..."}
      </div>
    );
  }

  if (!isLoggedIn) {
    return <LoginScreen />;
  }

  return <>{children}</>;
};
