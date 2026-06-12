import browser from "webextension-polyfill";

import {
  getReminderById,
  getReminders,
  deleteReminder,
  updateReminder,
} from "@/src/shared/utils/reminderStorage";

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

  // Hiện notification với nội dung reminder
  await browser.notifications.create(reminder.id, {
    type: "basic",
    iconUrl: "/icon/128.png",
    title: reminder.title,
    message: reminder.note ?? "Glass Reminder",
    priority: 2,
  });

  // Xử lý repeat: cập nhật datetime tại chỗ để tránh mất dữ liệu giữa delete/add
  if (reminder.repeat === "daily") {
    const nextDatetime = reminder.datetime + 24 * 60 * 60 * 1000;
    const next = await updateReminder(reminder.id, { datetime: nextDatetime });
    scheduleAlarm(next.id, nextDatetime);
  } else if (reminder.repeat === "weekly") {
    const nextDatetime = reminder.datetime + 7 * 24 * 60 * 60 * 1000;
    const next = await updateReminder(reminder.id, { datetime: nextDatetime });
    scheduleAlarm(next.id, nextDatetime);
  } else {
    // Không repeat → xóa khỏi storage sau khi bắn
    await deleteReminder(reminder.id);
  }
};

/**
 * Khôi phục alarm từ storage khi service worker khởi động lại.
 * Chrome không đảm bảo alarm sống sót sau reload/update extension.
 */
export const syncAlarmsFromStorage = async (): Promise<void> => {
  const reminders = await getReminders();
  for (const reminder of reminders) {
    scheduleAlarm(reminder.id, reminder.datetime);
  }
};

/** Đăng ký listener và đồng bộ alarm từ storage khi background start */
export const registerAlarmHandler = (): void => {
  browser.alarms.onAlarm.addListener((alarm) => {
    void handleAlarm(alarm);
  });
  void syncAlarmsFromStorage();
};
