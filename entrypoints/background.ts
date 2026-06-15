import browser from "webextension-polyfill";

import { registerAlarmHandler, handleAlarmConfirmed } from "@/src/background/alarmHandler";

// Nhận messages từ overlay window (ALARM_CONFIRMED + RESIZE_WINDOW)
browser.runtime.onMessage.addListener((message: unknown) => {
  if (typeof message !== "object" || message === null) return;
  const msg = message as Record<string, unknown>;

  if (msg.type === "ALARM_CONFIRMED" && typeof msg.reminderId === "string") {
    handleAlarmConfirmed(msg.reminderId).catch(console.error);
    return;
  }

  // Overlay đo chiều cao thực tế rồi yêu cầu background resize cửa sổ
  if (msg.type === "RESIZE_WINDOW" && typeof msg.height === "number") {
    browser.storage.local.get("alarm:windowId").then(async (stored) => {
      const windowId = stored["alarm:windowId"] as number | undefined;
      if (windowId !== undefined) {
        await browser.windows.update(windowId, { height: Math.round(msg.height as number) });
      }
    }).catch(console.error);
  }
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
