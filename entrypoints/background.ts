import { registerAuthMessageHandler } from "@/src/background/authMessageHandler";

export default defineBackground(() => {
  // OAuth chạy ở background — popup đóng khi mất focus sẽ không hủy flow
  registerAuthMessageHandler();
});
