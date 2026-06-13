import { beforeEach, describe, expect, it, vi } from "vitest";

import type { Reminder } from "@/src/shared/types/reminder";
import { chromeMock } from "../mocks/webextension-polyfill";

const makeReminder = (overrides: Partial<Reminder> = {}): Reminder => ({
  id: "reminder-1",
  title: "Test reminder",
  datetime: Date.now() + 60 * 60 * 1000,
  repeat: "none",
  createdAt: Date.now(),
  ...overrides,
});

describe("alarmHandler", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal("chrome", chromeMock);
  });

  describe("getNextRepeatDatetime", () => {
    it("trả về lần lặp tiếp theo khi alarm bắn đúng giờ", async () => {
      const { getNextRepeatDatetime } = await import("@/src/background/alarmHandler");
      const now = Date.now();
      const lastDatetime = now - 1000;

      const nextDaily = getNextRepeatDatetime(lastDatetime, "daily");
      expect(nextDaily).toBeGreaterThan(now);
      expect(nextDaily - lastDatetime).toBe(24 * 60 * 60 * 1000);

      const nextWeekly = getNextRepeatDatetime(lastDatetime, "weekly");
      expect(nextWeekly).toBeGreaterThan(now);
      expect(nextWeekly - lastDatetime).toBe(7 * 24 * 60 * 60 * 1000);
    });

    it("nhảy nhiều chu kỳ khi alarm bắn muộn nhiều ngày — tránh notification storm", async () => {
      const { getNextRepeatDatetime } = await import("@/src/background/alarmHandler");
      const now = Date.now();
      const threeDaysAgo = now - 3 * 24 * 60 * 60 * 1000;

      const next = getNextRepeatDatetime(threeDaysAgo, "daily");
      expect(next).toBeGreaterThan(now);
      // Chỉ cộng thêm 4 ngày (3 ngày quá hạn + 1 chu kỳ tương lai), không loop vô hạn
      expect(next - threeDaysAgo).toBe(4 * 24 * 60 * 60 * 1000);
    });
  });

  describe("restoreAlarmsFromStorage", () => {
    it("đăng ký lại alarm cho reminder tương lai sau extension reload", async () => {
      const futureReminder = makeReminder({
        id: "future-1",
        datetime: Date.now() + 2 * 60 * 60 * 1000,
      });

      chromeMock.storage.local.get.mockResolvedValue({
        reminders: [futureReminder],
      });
      chromeMock.storage.local.set.mockResolvedValue(undefined);

      const { restoreAlarmsFromStorage } = await import("@/src/background/alarmHandler");
      await restoreAlarmsFromStorage();

      expect(chromeMock.alarms.create).toHaveBeenCalledWith("future-1", {
        when: futureReminder.datetime,
      });
    });

    it("cập nhật datetime và schedule cho reminder lặp đã quá hạn", async () => {
      const now = Date.now();
      const pastDaily = makeReminder({
        id: "daily-past",
        datetime: now - 2 * 24 * 60 * 60 * 1000,
        repeat: "daily",
      });

      chromeMock.storage.local.get.mockResolvedValue({
        reminders: [pastDaily],
      });
      chromeMock.storage.local.set.mockResolvedValue(undefined);

      const { restoreAlarmsFromStorage } = await import("@/src/background/alarmHandler");
      await restoreAlarmsFromStorage();

      expect(chromeMock.alarms.create).toHaveBeenCalledOnce();
      const [alarmName, options] = chromeMock.alarms.create.mock.calls[0] as [
        string,
        { when: number },
      ];
      expect(alarmName).toBe("daily-past");
      expect(options.when).toBeGreaterThan(now);

      const saved = chromeMock.storage.local.set.mock.calls[0]?.[0] as {
        reminders: Reminder[];
      };
      expect(saved.reminders[0].datetime).toBe(options.when);
    });

    it("schedule alarm gần ngay cho reminder một lần đã quá hạn", async () => {
      const now = Date.now();
      const pastOnce = makeReminder({
        id: "once-past",
        datetime: now - 60 * 60 * 1000,
        repeat: "none",
      });

      chromeMock.storage.local.get.mockResolvedValue({
        reminders: [pastOnce],
      });
      chromeMock.storage.local.set.mockResolvedValue(undefined);

      const { restoreAlarmsFromStorage } = await import("@/src/background/alarmHandler");
      await restoreAlarmsFromStorage();

      const [, options] = chromeMock.alarms.create.mock.calls[0] as [string, { when: number }];
      expect(options.when).toBeGreaterThan(now);
      expect(options.when).toBeLessThanOrEqual(now + 2000);
    });
  });
});
