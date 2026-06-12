import browser from "webextension-polyfill";

import {
  getReminders,
  getReminderById,
  deleteReminder,
  updateReminder,
} from "@/src/shared/utils/reminderStorage";

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const MS_PER_WEEK = 7 * MS_PER_DAY;

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
 * Tính thời điểm kích hoạt tiếp theo cho reminder lặp đã quá hạn
 * Trả null nếu reminder one-shot đã quá hạn (cần xóa)
 */
const resolveNextSchedule = (
  datetime: number,
  repeat: "none" | "daily" | "weekly",
  now: number,
): number | null => {
  if (datetime > now) return datetime;
  if (repeat === "none") return null;

  const interval = repeat === "daily" ? MS_PER_DAY : MS_PER_WEEK;
  let next = datetime;
  while (next <= now) {
    next += interval;
  }
  return next;
};

/**
 * Khôi phục alarm từ storage — gọi khi extension khởi động hoặc sau update
 * Chrome xóa alarm khi extension reload/update nhưng giữ nguyên storage
 */
export const restoreAlarms = async (): Promise<void> => {
  const reminders = await getReminders();
  const now = Date.now();

  for (const reminder of reminders) {
    const scheduleAt = resolveNextSchedule(reminder.datetime, reminder.repeat, now);

    if (scheduleAt === null) {
      await deleteReminder(reminder.id);
      continue;
    }

    if (scheduleAt !== reminder.datetime) {
      await updateReminder(reminder.id, { datetime: scheduleAt });
    }

    scheduleAlarm(reminder.id, scheduleAt);
  }
};

/**
 * Xử lý khi alarm bắn: hiện notification, xử lý repeat
 * Nếu repeat daily/weekly → cập nhật datetime và tạo alarm mới (giữ nguyên id)
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

  // Xử lý repeat: cập nhật datetime rồi lên lịch lần sau (một lần ghi storage)
  if (reminder.repeat === "daily") {
    const nextDatetime = reminder.datetime + MS_PER_DAY;
    await updateReminder(reminder.id, { datetime: nextDatetime });
    scheduleAlarm(reminder.id, nextDatetime);
  } else if (reminder.repeat === "weekly") {
    const nextDatetime = reminder.datetime + MS_PER_WEEK;
    await updateReminder(reminder.id, { datetime: nextDatetime });
    scheduleAlarm(reminder.id, nextDatetime);
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
