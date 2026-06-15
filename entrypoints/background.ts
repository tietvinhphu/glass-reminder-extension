import browser from "webextension-polyfill";

import { registerAlarmHandler, handleAlarmConfirmed } from "@/src/background/alarmHandler";

// Nhận message ALARM_CONFIRMED từ overlay window khi user bấm xác nhận
browser.runtime.onMessage.addListener((message: unknown) => {
  if (
    typeof message === "object" &&
    message !== null &&
    (message as Record<string, unknown>).type === "ALARM_CONFIRMED"
  ) {
    const reminderId = (message as Record<string, unknown>).reminderId;
    if (typeof reminderId === "string") {
      handleAlarmConfirmed(reminderId).catch(console.error);
    }
  }
  return false;
});

// Xóa stored window ID khi cửa sổ alarm bị đóng
browser.windows.onRemoved.addListener((windowId: number) => {
  browser.storage.local.get("alarm:windowId").then((stored) => {
    if (stored["alarm:windowId"] === windowId) {
      browser.storage.local.remove("alarm:windowId").catch(console.error);
    }
  }).catch(console.error);
});

export default defineBackground(() => {
  registerAlarmHandler();
});
