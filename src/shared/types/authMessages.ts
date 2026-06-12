import type { GoogleAuthToken } from "@/src/shared/types/auth";

/** Message types popup gửi sang background cho OAuth */
export const AUTH_MESSAGE_TYPE = {
  LOGIN: "AUTH_LOGIN",
  LOGOUT: "AUTH_LOGOUT",
} as const;

export type AuthMessageType =
  (typeof AUTH_MESSAGE_TYPE)[keyof typeof AUTH_MESSAGE_TYPE];

/** Payload login — hiện chưa cần field, giữ type cho mở rộng sau */
export interface AuthLoginMessage {
  type: typeof AUTH_MESSAGE_TYPE.LOGIN;
}

/** Payload logout */
export interface AuthLogoutMessage {
  type: typeof AUTH_MESSAGE_TYPE.LOGOUT;
}

export type AuthMessage = AuthLoginMessage | AuthLogoutMessage;

/** Response thành công — login có token, logout chỉ báo success */
export interface AuthSuccessResponse {
  success: true;
  token?: GoogleAuthToken;
}

/** Response lỗi từ background */
export interface AuthErrorResponse {
  success: false;
  error: string;
}

export type AuthResponse = AuthSuccessResponse | AuthErrorResponse;
