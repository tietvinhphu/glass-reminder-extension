import { beforeEach, describe, expect, it, vi } from "vitest";

import type { Reminder } from "@/src/shared/types/reminder";
import { chromeMock } from "@/tests/mocks/webextension-polyfill";

const getReminders = vi.fn();
const getReminderById = vi.fn();
const deleteReminder = vi.fn();
const updateReminder = vi.fn();

vi.mock("@/src/shared/utils/reminderStorage", () => ({
  getReminders,
  getReminderById,
  deleteReminder,
  updateReminder,
}));

describe("alarmHandler", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    chromeMock.alarms.create.mockReset();
    chromeMock.alarms.clear.mockReset();
    chromeMock.alarms.onAlarm.addListener.mockReset();
    chromeMock.notifications.create.mockReset();
  });

  it("registerAlarmHandler() trả Promise từ listener để SW không bị kill giữa chừng", async () => {
    const reminder: Reminder = {
      id: "rem-1",
      title: "Họp team",
      datetime: Date.now() + 60_000,
      repeat: "none",
      createdAt: Date.now(),
    };
    getReminderById.mockResolvedValue(reminder);
    deleteReminder.mockResolvedValue(undefined);
    chromeMock.notifications.create.mockResolvedValue("notif-1");

    const { registerAlarmHandler } = await import("@/src/background/alarmHandler");
    registerAlarmHandler();

    const listener = chromeMock.alarms.onAlarm.addListener.mock.calls[0]?.[0] as (
      alarm: { name: string },
    ) => Promise<void>;

    expect(listener).toBeTypeOf("function");

    const result = listener({ name: reminder.id });
    expect(result).toBeInstanceOf(Promise);
    await result;

    expect(chromeMock.notifications.create).toHaveBeenCalledOnce();
    expect(deleteReminder).toHaveBeenCalledWith(reminder.id);
  });

  it("restoreReminderAlarms() đăng ký lại alarm cho mọi reminder trong storage", async () => {
    const reminders: Reminder[] = [
      {
        id: "rem-a",
        title: "A",
        datetime: Date.now() + 120_000,
        repeat: "none",
        createdAt: Date.now(),
      },
      {
        id: "rem-b",
        title: "B",
        datetime: Date.now() + 240_000,
        repeat: "daily",
        createdAt: Date.now(),
      },
    ];
    getReminders.mockResolvedValue(reminders);

    const { restoreReminderAlarms } = await import("@/src/background/alarmHandler");
    await restoreReminderAlarms();

    expect(chromeMock.alarms.create).toHaveBeenCalledTimes(2);
    expect(chromeMock.alarms.create).toHaveBeenCalledWith("rem-a", {
      when: reminders[0].datetime,
    });
    expect(chromeMock.alarms.create).toHaveBeenCalledWith("rem-b", {
      when: reminders[1].datetime,
    });
  });

  it("handleAlarm daily repeat cập nhật in-place thay vì xóa+rồi-thêm mới", async () => {
    const reminder: Reminder = {
      id: "rem-daily",
      title: "Uống thuốc",
      datetime: Date.now(),
      repeat: "daily",
      createdAt: Date.now() - 86_400_000,
    };
    const nextDatetime = reminder.datetime + 24 * 60 * 60 * 1000;
    const updated: Reminder = { ...reminder, datetime: nextDatetime };

    getReminderById.mockResolvedValue(reminder);
    updateReminder.mockResolvedValue(updated);
    chromeMock.notifications.create.mockResolvedValue("notif-daily");

    const { registerAlarmHandler } = await import("@/src/background/alarmHandler");
    registerAlarmHandler();

    const listener = chromeMock.alarms.onAlarm.addListener.mock.calls[0]?.[0] as (
      alarm: { name: string },
    ) => Promise<void>;

    await listener({ name: reminder.id });

    expect(updateReminder).toHaveBeenCalledWith(reminder.id, {
      datetime: nextDatetime,
    });
    expect(deleteReminder).not.toHaveBeenCalled();
    expect(chromeMock.alarms.create).toHaveBeenCalledWith(reminder.id, {
      when: nextDatetime,
    });
  });
});
