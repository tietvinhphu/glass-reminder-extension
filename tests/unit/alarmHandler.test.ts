import { beforeEach, describe, expect, it, vi } from "vitest";

import type { Reminder } from "@/src/shared/types/reminder";
import { chromeMock } from "../mocks/webextension-polyfill";

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const MS_PER_WEEK = 7 * MS_PER_DAY;

/** Mock storage.local đọc/ghi in-memory — dùng chung pattern tokenStorage tests */
const setupRemindersStorage = (initialReminders: Reminder[] = []): void => {
  const storedData: Record<string, unknown> = {
    reminders: initialReminders,
  };

  chromeMock.storage.local.set.mockImplementation(
    async (data: Record<string, unknown>) => {
      Object.assign(storedData, data);
    },
  );
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
};

describe("alarmHandler", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal("chrome", chromeMock);
    setupRemindersStorage();
  });

  describe("getNextRepeatDatetime", () => {
    it("nhảy daily qua nhiều kỳ missed cho đến khi > now", async () => {
      const { getNextRepeatDatetime } = await import(
        "@/src/background/alarmHandler"
      );

      const now = Date.parse("2026-06-14T15:00:00.000Z");
      const originalDatetime = Date.parse("2026-06-01T09:00:00.000Z");

      const next = getNextRepeatDatetime(originalDatetime, "daily", now);

      expect(next).toBeGreaterThan(now);
      expect((next - originalDatetime) % MS_PER_DAY).toBe(0);
    });

    it("weekly repeat cũng advance tới tương lai", async () => {
      const { getNextRepeatDatetime } = await import(
        "@/src/background/alarmHandler"
      );

      const now = Date.parse("2026-06-14T15:00:00.000Z");
      const originalDatetime = Date.parse("2026-05-01T09:00:00.000Z");

      const next = getNextRepeatDatetime(originalDatetime, "weekly", now);

      expect(next).toBeGreaterThan(now);
      expect((next - originalDatetime) % MS_PER_WEEK).toBe(0);
    });
  });

  describe("restoreAlarmsFromStorage", () => {
    it("đăng ký lại alarm cho reminder tương lai khi background khởi động", async () => {
      const futureDatetime = Date.now() + MS_PER_DAY;
      const reminder: Reminder = {
        id: "reminder-future",
        title: "Họp team",
        datetime: futureDatetime,
        repeat: "none",
        createdAt: Date.now(),
      };
      setupRemindersStorage([reminder]);

      const { getReminders } = await import("@/src/shared/utils/reminderStorage");
      const { restoreAlarmsFromStorage } = await import(
        "@/src/background/alarmHandler"
      );

      expect(await getReminders()).toEqual([reminder]);
      await restoreAlarmsFromStorage();

      expect(chromeMock.alarms.create).toHaveBeenCalledWith("reminder-future", {
        when: futureDatetime,
      });
    });

    it("advance repeating reminder quá hạn rồi schedule alarm tương lai", async () => {
      const now = Date.parse("2026-06-14T15:00:00.000Z");
      vi.setSystemTime(now);

      const pastReminder: Reminder = {
        id: "reminder-past-daily",
        title: "Uống nước",
        datetime: Date.parse("2026-06-01T09:00:00.000Z"),
        repeat: "daily",
        createdAt: Date.parse("2026-06-01T08:00:00.000Z"),
      };
      setupRemindersStorage([pastReminder]);

      const { restoreAlarmsFromStorage } = await import(
        "@/src/background/alarmHandler"
      );

      await restoreAlarmsFromStorage();

      expect(chromeMock.alarms.create).toHaveBeenCalledOnce();
      const [, options] = chromeMock.alarms.create.mock.calls[0] as [
        string,
        { when: number },
      ];
      expect(options.when).toBeGreaterThan(now);

      vi.useRealTimers();
    });
  });
});
