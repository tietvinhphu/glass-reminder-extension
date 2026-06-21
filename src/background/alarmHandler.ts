import browser from "webextension-polyfill";

import { getReminderById, deleteReminder, addReminder } from "@/shared/utils/reminderStorage";

/** Key lưu pending alarm data trong storage */
const pendingKey = (id: string) => `alarm:pending:${id}`;

/** Data alarm lưu tạm để overlay window đọc, tồn tại đến khi user xác nhận */
interface PendingAlarmData {
  title: string;
  note: string;
  datetime: number;
}

/**
 * Đăng ký alarm cho một reminder — tạo 2 alarm:
 * 1. Pre-alarm: cảnh báo nhẹ trước 2 phút
 * 2. Main alarm: bắn overlay cửa sổ đúng giờ
 */
export const scheduleAlarm = (reminderId: string, datetime: number): void => {
  void browser.alarms.create(reminderId, { when: datetime });

  // Chỉ tạo pre-alarm nếu còn hơn 2 phút rưỡi
  const preTime = datetime - 2 * 60 * 1000;
  if (preTime > Date.now() + 30_000) {
    void browser.alarms.create(`${reminderId}:pre`, { when: preTime });
  }
};

/**
 * Hủy tất cả alarm liên quan đến một reminder (main + pre + recheck)
 */
export const cancelAlarm = (reminderId: string): void => {
  void browser.alarms.clear(reminderId);
  void browser.alarms.clear(`${reminderId}:pre`);
  void browser.alarms.clear(`${reminderId}:recheck`);
  void browser.storage.local.remove(pendingKey(reminderId));
};

/**
 * Xử lý khi user bấm "Đã xác nhận" trong overlay window:
 * xóa pending data và hủy recheck alarm
 */
export const handleAlarmConfirmed = async (reminderId: string): Promise<void> => {
  await browser.storage.local.remove(pendingKey(reminderId));
  await browser.alarms.clear(`${reminderId}:recheck`);
};

/** Storage key lưu ID cửa sổ alarm đang mở */
const ALARM_WINDOW_KEY = "alarm:windowId";

/**
 * Mở cửa sổ alarm overlay — nếu đã mở thì chỉ focus lại (tránh duplicate).
 * Overlay tự đọc toàn bộ pending alarms từ storage, không cần truyền ID.
 */
const openAlarmWindow = async (): Promise<void> => {
  try {
    // Kiểm tra xem đã có cửa sổ alarm đang mở chưa
    const stored = await browser.storage.local.get(ALARM_WINDOW_KEY);
    const existingId = stored[ALARM_WINDOW_KEY] as number | undefined;

    if (existingId !== undefined) {
      try {
        // Thử focus lại cửa sổ cũ — overlay sẽ tự refresh qua storage.onChanged
        await browser.windows.update(existingId, { focused: true });
        return;
      } catch {
        // Cửa sổ đã bị đóng, tiếp tục tạo mới
      }
    }

    // Đếm pending alarms để tính chiều cao cửa sổ ban đầu
    const allStorage = await browser.storage.local.get(null);
    const pendingCount = Object.keys(allStorage).filter((k) =>
      k.startsWith("alarm:pending:"),
    ).length;
    // Base 240px + 100px mỗi alarm, tối thiểu 360px, tối đa 660px
    const windowHeight = Math.min(Math.max(360, 240 + pendingCount * 100), 660);

    const newWindow = await browser.windows.create({
      url: browser.runtime.getURL("alarm.html"),
      type: "popup",
      width: 460,
      height: windowHeight,
      focused: true,
    });

    if (newWindow.id !== undefined) {
      await browser.storage.local.set({ [ALARM_WINDOW_KEY]: newWindow.id });
      // Focus lần 2 sau 600ms để đảm bảo cửa sổ nhảy lên trên cùng
      const winId = newWindow.id;
      setTimeout(() => {
        browser.windows.update(winId, { focused: true }).catch(() => {});
      }, 600);
    }
  } catch (err) {
    console.error("[Glass Reminder] Không mở được alarm window:", err);
    // Fallback: native notification
    try {
      await browser.notifications.create(`alarm:fallback:${Date.now()}`, {
        type: "basic",
        iconUrl: browser.runtime.getURL("icon/128.png"),
        title: "⏰ Tới giờ nhắc nhở",
        message: "Mở Glass Reminder để xem chi tiết",
        priority: 2,
      });
    } catch (notifErr) {
      console.error("[Glass Reminder] Fallback notification thất bại:", notifErr);
    }
  }
};

/**
 * Xử lý pre-alarm: hiện notification nhẹ trước 2 phút
 */
const handlePreAlarm = async (reminderId: string): Promise<void> => {
  const reminder = await getReminderById(reminderId);
  if (!reminder) return;

  try {
    await browser.notifications.create(`${reminderId}:pre`, {
      type: "basic",
      iconUrl: browser.runtime.getURL("icon/128.png"),
      title: `⏰ Sắp tới giờ: ${reminder.title}`,
      message: "Còn khoảng 2 phút",
      priority: 1,
    });
  } catch (err) {
    console.error("[Glass Reminder] Pre-notification thất bại:", err);
  }
};

/**
 * Xử lý recheck alarm: mở lại cửa sổ nếu user chưa xác nhận
 * Tự lên lịch recheck tiếp theo sau 2 phút
 */
const handleRecheckAlarm = async (reminderId: string): Promise<void> => {
  const stored = await browser.storage.local.get(pendingKey(reminderId));
  const pending = stored[pendingKey(reminderId)];
  if (!pending) return; // Đã xác nhận rồi, dừng recheck

  await openAlarmWindow();
  void browser.alarms.create(`${reminderId}:recheck`, { delayInMinutes: 2 });
};

/**
 * Xử lý main alarm: lưu pending data → mở overlay → lên lịch recheck → xử lý repeat
 */
const handleMainAlarm = async (reminderId: string): Promise<void> => {
  const reminder = await getReminderById(reminderId);
  if (!reminder) return;

  // Lưu data vào storage để overlay window đọc (và recheck tái sử dụng)
  const pendingData: PendingAlarmData = {
    title: reminder.title,
    note: reminder.note ?? "",
    datetime: reminder.datetime,
  };
  await browser.storage.local.set({ [pendingKey(reminderId)]: pendingData });

  // Mở cửa sổ overlay ngay lập tức
  await openAlarmWindow();

  // Recheck sau 2 phút nếu user không xác nhận
  void browser.alarms.create(`${reminderId}:recheck`, { delayInMinutes: 2 });

  // Xử lý repeat: tạo alarm tiếp theo rồi xóa cái cũ
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
    // Không repeat → xóa ngay, xác nhận chỉ dừng recheck
    await deleteReminder(reminder.id);
  }
};

/**
 * Router chính: phân loại alarm theo suffix và điều hướng đúng handler
 */
const handleAlarm = async (alarm: browser.Alarms.Alarm): Promise<void> => {
  const name = alarm.name;

  if (name.endsWith(":pre")) {
    await handlePreAlarm(name.slice(0, -":pre".length));
    return;
  }
  if (name.endsWith(":recheck")) {
    await handleRecheckAlarm(name.slice(0, -":recheck".length));
    return;
  }

  await handleMainAlarm(name);
};

/** Đăng ký onAlarm listener — phải gọi ở top-level background để không miss event */
export const registerAlarmHandler = (): void => {
  browser.alarms.onAlarm.addListener((alarm) => {
    void handleAlarm(alarm);
  });
};
