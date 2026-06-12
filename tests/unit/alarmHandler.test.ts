import { beforeEach, describe, expect, it, vi } from "vitest";

import type { Reminder } from "@/src/shared/types/reminder";
import { chromeMock } from "../mocks/webextension-polyfill";

describe("alarmHandler", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal("chrome", chromeMock);
  });

  it("syncAlarmsFromStorage() đăng ký alarm cho mọi reminder trong storage", async () => {
    const reminders: Reminder[] = [
      {
        id: "reminder-1",
        title: "Họp team",
        datetime: Date.now() + 60_000,
        repeat: "none",
        createdAt: Date.now(),
      },
      {
        id: "reminder-2",
        title: "Deadline",
        datetime: Date.now() + 120_000,
        repeat: "daily",
        createdAt: Date.now(),
      },
    ];

    chromeMock.storage.local.get.mockResolvedValue({ reminders });

    const { syncAlarmsFromStorage } = await import("@/src/background/alarmHandler");

    await syncAlarmsFromStorage();

    expect(chromeMock.alarms.create).toHaveBeenCalledTimes(2);
    expect(chromeMock.alarms.create).toHaveBeenCalledWith("reminder-1", {
      when: reminders[0].datetime,
    });
    expect(chromeMock.alarms.create).toHaveBeenCalledWith("reminder-2", {
      when: reminders[1].datetime,
    });
  });

  it("registerAlarmHandler() gọi syncAlarmsFromStorage khi background khởi động", async () => {
    chromeMock.storage.local.get.mockResolvedValue({ reminders: [] });

    const { registerAlarmHandler } = await import("@/src/background/alarmHandler");

    registerAlarmHandler();

    expect(chromeMock.alarms.onAlarm.addListener).toHaveBeenCalledOnce();
    expect(chromeMock.storage.local.get).toHaveBeenCalledWith("reminders");
  });

  it("handleAlarm repeat daily cập nhật datetime thay vì xóa rồi tạo mới", async () => {
    const storedData: Record<string, unknown> = {};
    const reminder: Reminder = {
      id: "repeat-daily",
      title: "Uống nước",
      datetime: Date.now(),
      repeat: "daily",
      createdAt: Date.now() - 86_400_000,
    };

    storedData.reminders = [reminder];

    chromeMock.storage.local.get.mockImplementation(
      async (keys: string | string[] | Record<string, unknown> | null) => {
        if (keys === null) {
          return { ...storedData };
        }
        const keyList = Array.isArray(keys)
          ? keys
          : typeof keys === "string"
            ? [keys]
            : Object.keys(keys);
        const result: Record<string, unknown> = {};
        for (const key of keyList) {
          if (key in storedData) {
            result[key] = storedData[key];
          }
        }
        return result;
      },
    );
    chromeMock.storage.local.set.mockImplementation(
      async (data: Record<string, unknown>) => {
        Object.assign(storedData, data);
      },
    );
    chromeMock.notifications.create.mockResolvedValue("repeat-daily");

    const { registerAlarmHandler } = await import("@/src/background/alarmHandler");

    registerAlarmHandler();

    const listener = chromeMock.alarms.onAlarm.addListener.mock.calls[0][0] as (
      alarm: { name: string },
    ) => void;

    listener({ name: "repeat-daily" });
    await new Promise((resolve) => setTimeout(resolve, 0));

    const nextReminders = storedData.reminders as Reminder[];
    expect(nextReminders).toHaveLength(1);
    expect(nextReminders[0].id).toBe("repeat-daily");
    expect(nextReminders[0].datetime).toBe(reminder.datetime + 24 * 60 * 60 * 1000);
    expect(chromeMock.alarms.create).toHaveBeenCalledWith(
      "repeat-daily",
      expect.objectContaining({ when: nextReminders[0].datetime }),
    );
  });
});
