import { registerAlarmHandler, syncAlarmsWithStorage } from "@/src/background/alarmHandler";

export default defineBackground(() => {
  // Lắng nghe alarm để bắn notification nhắc nhở đúng giờ
  registerAlarmHandler();
  // Khôi phục alarm sau reload/update — tránh mất notification dù reminder vẫn còn
  void syncAlarmsWithStorage();
});
