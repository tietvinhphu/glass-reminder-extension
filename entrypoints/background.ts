import {
  registerAlarmHandler,
  restoreReminderAlarms,
} from "@/src/background/alarmHandler";

export default defineBackground(() => {
  // Lắng nghe alarm để bắn notification nhắc nhở đúng giờ
  registerAlarmHandler();
  // Extension reload/update xóa alarm — đồng bộ lại từ storage
  void restoreReminderAlarms();
});
