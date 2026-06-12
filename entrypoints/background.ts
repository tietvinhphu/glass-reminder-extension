import { registerAlarmHandler } from "@/src/background/alarmHandler";

export default defineBackground(() => {
  // Lắng nghe alarm để bắn notification nhắc nhở đúng giờ
  registerAlarmHandler();
});
