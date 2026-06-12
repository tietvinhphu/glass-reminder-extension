import { beforeEach, describe, expect, it, vi } from "vitest";

import type { Reminder } from "@/src/shared/types/reminder";
import {
  processAlarm,
  syncAlarmsWithStorage,
} from "@/src/background/alarmHandler";
import { chromeMock } from "../mocks/webextension-polyfill";

const STORAGE_KEY = "reminders";

/** Mock storage.local giữ state qua get/set — mô phỏng chrome.storage.local thật */
const mockPersistentStorage = (initial: Record<string, unknown> = {}): void => {
  const store: Record<string, unknown> = { ...initial };

  chromeMock.storage.local.get.mockImplementation(async (keys?: string | string[] | Record<string, unknown> | null) => {
    if (keys == null) return { ...store };
    if (typeof keys === "string") return { [keys]: store[keys] };
    if (Array.isArray(keys)) {
      return Object.fromEntries(keys.map((key) => [key, store[key]]));
    }
    return Object.fromEntries(
      Object.keys(keys).map((key) => [key, store[key] ?? keys[key]]),
    );
  });

  chromeMock.storage.local.set.mockImplementation(async (items: Record<string, unknown>) => {
    Object.assign(store, items);
  });
};

const sampleReminder = (overrides: Partial<Reminder> = {}): Reminder => ({
  id: "reminder-1",
  title: "Họp team",
  datetime: Date.now() + 60_000,
  repeat: "none",
  createdAt: Date.now(),
  ...overrides,
});

describe("alarmHandler", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPersistentStorage();
    chromeMock.alarms.create.mockResolvedValue(undefined);
    chromeMock.notifications.create.mockResolvedValue("notification-id");
  });

  it("syncAlarmsWithStorage đăng ký alarm cho mọi reminder trong storage", async () => {
    const reminders = [
      sampleReminder({ id: "a", datetime: 1_700_000_000_000 }),
      sampleReminder({ id: "b", datetime: 1_700_000_100_000 }),
    ];
    mockPersistentStorage({ [STORAGE_KEY]: reminders });

    await syncAlarmsWithStorage();

    expect(chromeMock.alarms.create).toHaveBeenCalledTimes(2);
    expect(chromeMock.alarms.create).toHaveBeenCalledWith("a", {
      when: 1_700_000_000_000,
    });
    expect(chromeMock.alarms.create).toHaveBeenCalledWith("b", {
      when: 1_700_000_100_000,
    });
  });

  it("processAlarm giữ id khi repeat daily thay vì xóa rồi tạo mới", async () => {
    const reminder = sampleReminder({ repeat: "daily", datetime: 1_700_000_000_000 });
    mockPersistentStorage({ [STORAGE_KEY]: [reminder] });

    await processAlarm({ name: reminder.id, scheduledTime: reminder.datetime });

    expect(chromeMock.notifications.create).toHaveBeenCalledWith(
      reminder.id,
      expect.objectContaining({
        title: reminder.title,
        iconUrl: "chrome-extension://test-extension-id/icon/128.png",
      }),
    );
    expect(chromeMock.storage.local.set).toHaveBeenCalledWith({
      [STORAGE_KEY]: [
        expect.objectContaining({
          id: reminder.id,
          datetime: 1_700_000_000_000 + 86_400_000,
          repeat: "daily",
        }),
      ],
    });
    expect(chromeMock.alarms.create).toHaveBeenCalledWith(reminder.id, {
      when: 1_700_000_000_000 + 86_400_000,
    });
  });

  it("processAlarm xóa reminder không lặp sau khi bắn", async () => {
    const reminder = sampleReminder({ repeat: "none" });
    mockPersistentStorage({ [STORAGE_KEY]: [reminder] });

    await processAlarm({ name: reminder.id, scheduledTime: reminder.datetime });

    expect(chromeMock.storage.local.set).toHaveBeenCalledWith({
      [STORAGE_KEY]: [],
    });
  });
});
