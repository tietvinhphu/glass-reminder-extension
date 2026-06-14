import browser from "webextension-polyfill";

import {
  getReminders,
  getReminderById,
  deleteReminder,
  addReminder,
} from "@/src/shared/utils/reminderStorage";

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const MS_PER_WEEK = 7 * MS_PER_DAY;

/** Khoảng lặp theo loại repeat — dùng chung cho schedule và restore */
const getRepeatIntervalMs = (repeat: "daily" | "weekly"): number =>
  repeat === "daily" ? MS_PER_DAY : MS_PER_WEEK;

/**
 * Tính thời điểm lặp tiếp theo — luôn > now
 * Tránh schedule alarm quá khứ gây bắn notification liên tục khi máy sleep/lỡ giờ
 */
export const getNextRepeatDatetime = (
  currentDatetime: number,
  repeat: "daily" | "weekly",
  now: number = Date.now(),
): number => {
  const interval = getRepeatIntervalMs(repeat);
  let next = currentDatetime;
  while (next <= now) {
    next += interval;
  }
  return next;
};

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
 * Khôi phục alarm từ storage khi extension reload/update
 * Chrome xóa toàn bộ chrome.alarms khi extension unload — reminder vẫn còn trong storage
 */
export const restoreAlarmsFromStorage = async (): Promise<void> => {
  const reminders = await getReminders();
  const now = Date.now();

  for (const reminder of reminders) {
    // Reminder còn hạn → schedule lại alarm
    if (reminder.datetime > now) {
      scheduleAlarm(reminder.id, reminder.datetime);
      continue;
    }

    // Reminder một lần đã quá hạn → bỏ qua (user thấy trong list, tự xóa)
    if (reminder.repeat === "none") {
      continue;
    }

    // Repeating quá hạn → advance tới lần tiếp theo trong tương lai
    const nextDatetime = getNextRepeatDatetime(reminder.datetime, reminder.repeat, now);
    await deleteReminder(reminder.id);
    const next = await addReminder({
      title: reminder.title,
      datetime: nextDatetime,
      note: reminder.note,
      repeat: reminder.repeat,
    });
    scheduleAlarm(next.id, nextDatetime);
  }
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

  // Xử lý repeat: tạo alarm tiếp theo rồi xóa bản ghi cũ
  if (reminder.repeat === "daily" || reminder.repeat === "weekly") {
    const nextDatetime = getNextRepeatDatetime(reminder.datetime, reminder.repeat);
    await deleteReminder(reminder.id);
    const next = await addReminder({
      title: reminder.title,
      datetime: nextDatetime,
      note: reminder.note,
      repeat: reminder.repeat,
    });
    scheduleAlarm(next.id, nextDatetime);
  } else {
    // Không repeat → xóa khỏi storage sau khi bắn
    await deleteReminder(reminder.id);
  }
};

/** Đăng ký listener và khôi phục alarm khi background khởi động */
export const registerAlarmHandler = (): void => {
  void restoreAlarmsFromStorage();
  browser.alarms.onAlarm.addListener((alarm) => {
    void handleAlarm(alarm);
  });
};
