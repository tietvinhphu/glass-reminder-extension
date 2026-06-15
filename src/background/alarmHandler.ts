import browser from "webextension-polyfill";

import { getReminderById, deleteReminder, addReminder } from "@/src/shared/utils/reminderStorage";

/**
 * Đăng ký alarm cho một reminder — gọi khi tạo reminder mới
 * alarm name = reminder.id để tìm lại reminder khi alarm bắn
 */
export const scheduleAlarm = (reminderId: string, datetime: number): void => {
  void browser.alarms.create(reminderId, { when: datetime });
};

/**
 * Hủy alarm của một reminder — gọi khi xóa reminder
 */
export const cancelAlarm = (reminderId: string): void => {
  void browser.alarms.clear(reminderId);
};

/**
 * Xử lý khi alarm bắn: hiện notification, xử lý repeat
 * Nếu repeat daily/weekly → tạo alarm mới cho lần sau
 */
const handleAlarm = async (alarm: browser.Alarms.Alarm): Promise<void> => {
  const reminder = await getReminderById(alarm.name);
  if (!reminder) return;

  // Bắn notification — dùng runtime.getURL để đảm bảo icon path hợp lệ
  // try/catch riêng để lỗi notification không chặn deleteReminder phía dưới
  try {
    await browser.notifications.create(reminder.id, {
      type: "basic",
      iconUrl: browser.runtime.getURL("icon/128.png"),
      title: reminder.title,
      message: reminder.note ?? "Glass Reminder",
      priority: 2,
    });
  } catch (err) {
    console.error("[Glass Reminder] notifications.create failed:", err);
  }

  // Xử lý repeat: tạo alarm tiếp theo rồi xóa bản ghi cũ
  if (reminder.repeat === "daily") {
    const nextDatetime = reminder.datetime + 24 * 60 * 60 * 1000;
    await deleteReminder(reminder.id);
    const next = await addReminder({ ...reminder, datetime: nextDatetime });
    scheduleAlarm(next.id, nextDatetime);
  } else if (reminder.repeat === "weekly") {
    const nextDatetime = reminder.datetime + 7 * 24 * 60 * 60 * 1000;
    await deleteReminder(reminder.id);
    const next = await addReminder({ ...reminder, datetime: nextDatetime });
    scheduleAlarm(next.id, nextDatetime);
  } else {
    // Không repeat → xóa khỏi storage sau khi bắn
    await deleteReminder(reminder.id);
  }
};

/** Đăng ký listener cho tất cả alarm của extension */
export const registerAlarmHandler = (): void => {
  browser.alarms.onAlarm.addListener((alarm) => {
    void handleAlarm(alarm);
  });
};
