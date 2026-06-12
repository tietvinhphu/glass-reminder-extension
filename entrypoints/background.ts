import browser from "webextension-polyfill";

import { registerAlarmHandler, restoreAlarms } from "@/src/background/alarmHandler";

export default defineBackground(() => {
  // Lắng nghe alarm để bắn notification nhắc nhở đúng giờ
  registerAlarmHandler();

  // Khôi phục alarm từ storage — Chrome xóa alarm khi extension update/reload
  void restoreAlarms();

  browser.runtime.onInstalled.addListener(() => {
    void restoreAlarms();
  });
});
