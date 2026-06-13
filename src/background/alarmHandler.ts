import browser from "webextension-polyfill";

import type { Reminder } from "@/src/shared/types/reminder";
import { getReminders, getReminderById, deleteReminder, addReminder } from "@/src/shared/utils/reminderStorage";

const DAY_MS = 24 * 60 * 60 * 1000;
const WEEK_MS = 7 * DAY_MS;
/** Delay nhỏ khi reschedule reminder một lần đã quá hạn — tránh race với startup */
const IMMEDIATE_ALARM_DELAY_MS = 1000;

/**
 * Tính thời điểm lặp tiếp theo sau lastDatetime, luôn ở tương lai.
 * Tránh loop notification khi alarm bắn muộn (browser/extension tắt nhiều ngày).
 */
export const getNextRepeatDatetime = (
  lastDatetime: number,
  repeat: "daily" | "weekly",
): number => {
  const intervalMs = repeat === "daily" ? DAY_MS : WEEK_MS;
  let next = lastDatetime + intervalMs;
  const now = Date.now();
  while (next <= now) {
    next += intervalMs;
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
 * Khôi phục alarm từ storage khi background khởi động.
 * Extension update/reload xóa toàn bộ alarm — reminder trong storage sẽ không bắn nếu không restore.
 */
export const restoreAlarmsFromStorage = async (): Promise<void> => {
  const reminders = await getReminders();
  const now = Date.now();
  const updatedReminders: Reminder[] = [];

  for (const reminder of reminders) {
    let storedReminder = reminder;
    let scheduleAt: number;

    if (reminder.repeat === "none") {
      // Một lần: quá hạn → bắn sớm nhất có thể; còn tương lai → giữ nguyên
      scheduleAt =
        reminder.datetime <= now ? now + IMMEDIATE_ALARM_DELAY_MS : reminder.datetime;
    } else if (reminder.datetime <= now) {
      // Lặp lại đã quá hạn → nhảy tới lần tiếp theo trong tương lai và cập nhật storage
      const nextDatetime = getNextRepeatDatetime(reminder.datetime, reminder.repeat);
      storedReminder = { ...reminder, datetime: nextDatetime };
      scheduleAt = nextDatetime;
    } else {
      scheduleAt = reminder.datetime;
    }

    updatedReminders.push(storedReminder);
    scheduleAlarm(storedReminder.id, scheduleAt);
  }

  await browser.storage.local.set({ reminders: updatedReminders });
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
  if (reminder.repeat === "daily") {
    const nextDatetime = getNextRepeatDatetime(reminder.datetime, "daily");
    await deleteReminder(reminder.id);
    const next = await addReminder({ ...reminder, datetime: nextDatetime });
    scheduleAlarm(next.id, nextDatetime);
  } else if (reminder.repeat === "weekly") {
    const nextDatetime = getNextRepeatDatetime(reminder.datetime, "weekly");
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
  // Khôi phục alarm sau extension update/reload — alarms API bị clear khi extension unload
  void restoreAlarmsFromStorage();
};
