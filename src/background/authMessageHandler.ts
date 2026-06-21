import browser from "webextension-polyfill";

import {
  launchGoogleOAuth,
  logoutGoogle,
} from "../background/auth";
import {
  AUTH_MESSAGE_TYPE,
  type AuthMessage,
  type AuthResponse,
} from "../shared/types/authMessages";

/**
 * Xử lý message auth từ popup
 * OAuth PHẢI chạy ở background — popup đóng khi mất focus sẽ hủy callback
 */
const handleAuthMessage = async (
  message: AuthMessage,
): Promise<AuthResponse> => {
  if (message.type === AUTH_MESSAGE_TYPE.LOGIN) {
    try {
      const token = await launchGoogleOAuth();
      return { success: true, token };
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Đăng nhập Google thất bại";
      return { success: false, error: errorMessage };
    }
  }

  if (message.type === AUTH_MESSAGE_TYPE.LOGOUT) {
    try {
      await logoutGoogle();
      return { success: true };
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Không thể đăng xuất";
      return { success: false, error: errorMessage };
    }
  }

  return { success: false, error: "Message auth không hợp lệ" };
};

/**
 * Đăng ký listener runtime.onMessage cho flow OAuth/logout
 * Gọi một lần khi background service worker khởi động
 */
export const registerAuthMessageHandler = (): void => {
  const listener = (
    message: unknown,
    _sender: unknown,
    sendResponse: () => void,
  ): true | undefined => {
    if (
      typeof message !== "object" ||
      message === null ||
      !("type" in message)
    ) {
      return undefined;
    }

    const authMessage = message as AuthMessage;
    if (
      authMessage.type !== AUTH_MESSAGE_TYPE.LOGIN &&
      authMessage.type !== AUTH_MESSAGE_TYPE.LOGOUT
    ) {
      return undefined;
    }

    void handleAuthMessage(authMessage).then(sendResponse);
    return true;
  };

  browser.runtime.onMessage.addListener(
    listener as Parameters<typeof browser.runtime.onMessage.addListener>[0],
  );
};
