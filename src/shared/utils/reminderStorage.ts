import browser from "webextension-polyfill";

import type { Reminder, ReminderFormData } from "../../shared/types/reminder";

const STORAGE_KEY = "reminders";

/** Đọc toàn bộ reminder từ local storage */
export const getReminders = async (): Promise<Reminder[]> => {
  const result = await browser.storage.local.get(STORAGE_KEY);
  const raw = result[STORAGE_KEY];
  if (!Array.isArray(raw)) return [];
  return raw as Reminder[];
};

/** Thêm reminder mới, tự tạo id và createdAt */
export const addReminder = async (data: ReminderFormData): Promise<Reminder> => {
  const reminders = await getReminders();
  const newReminder: Reminder = {
    ...data,
    id: crypto.randomUUID(),
    createdAt: Date.now(),
  };
  await browser.storage.local.set({ [STORAGE_KEY]: [...reminders, newReminder] });
  return newReminder;
};

/** Xóa reminder theo id */
export const deleteReminder = async (id: string): Promise<void> => {
  const reminders = await getReminders();
  const filtered = reminders.filter((r) => r.id !== id);
  await browser.storage.local.set({ [STORAGE_KEY]: filtered });
};

/** Lấy một reminder theo id — trả null nếu không tìm thấy */
export const getReminderById = async (id: string): Promise<Reminder | null> => {
  const reminders = await getReminders();
  return reminders.find((r) => r.id === id) ?? null;
};

/** Cập nhật reminder theo id — giữ nguyên id và createdAt */
export const updateReminder = async (id: string, data: ReminderFormData): Promise<Reminder> => {
  const reminders = await getReminders();
  const existing = reminders.find((r) => r.id === id);
  if (!existing) throw new Error(`Reminder ${id} không tồn tại`);
  const updated: Reminder = { ...existing, ...data };
  const rest = reminders.filter((r) => r.id !== id);
  await browser.storage.local.set({ [STORAGE_KEY]: [...rest, updated] });
  return updated;
};
