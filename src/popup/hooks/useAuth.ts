import { useAuthStore } from "@/src/popup/stores/authStore";

/**
 * Hook wrapper cho authStore
 * Tách riêng để component không import trực tiếp store —
 * dễ mock trong test và đổi implementation sau này
 */
export const useAuth = () => {
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn);
  const user = useAuthStore((state) => state.user);
  const isLoading = useAuthStore((state) => state.isLoading);
  const error = useAuthStore((state) => state.error);
  const initialize = useAuthStore((state) => state.initialize);
  const login = useAuthStore((state) => state.login);
  const logout = useAuthStore((state) => state.logout);

  return {
    isLoggedIn,
    user,
    isLoading,
    error,
    initialize,
    login,
    logout,
  };
};
