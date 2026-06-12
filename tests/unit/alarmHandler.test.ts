import { beforeEach, describe, expect, it, vi } from "vitest";

import browser from "webextension-polyfill";

import type { Reminder } from "@/src/shared/types/reminder";
import {
  registerAlarmHandler,
  restoreAlarms,
  scheduleAlarm,
} from "@/src/background/alarmHandler";

const STORAGE_KEY = "reminders";

const makeReminder = (overrides: Partial<Reminder> = {}): Reminder => ({
  id: "reminder-1",
  title: "Họp team",
  datetime: Date.now() + 60 * 60 * 1000,
  repeat: "none",
  createdAt: Date.now(),
  ...overrides,
});

describe("alarmHandler", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(browser.storage.local.get).mockResolvedValue({});
    vi.mocked(browser.storage.local.set).mockResolvedValue(undefined);
    vi.mocked(browser.notifications.create).mockResolvedValue("notification-id");
  });

  it("restoreAlarms schedules alarms for future reminders", async () => {
    const reminder = makeReminder();
    vi.mocked(browser.storage.local.get).mockResolvedValue({
      [STORAGE_KEY]: [reminder],
    });

    await restoreAlarms();

    expect(browser.alarms.create).toHaveBeenCalledWith(reminder.id, {
      when: reminder.datetime,
    });
  });

  it("restoreAlarms reschedules overdue repeating reminders without losing id", async () => {
    const pastDaily = makeReminder({
      id: "daily-1",
      repeat: "daily",
      datetime: Date.now() - MS_PER_DAY,
    });
    vi.mocked(browser.storage.local.get).mockResolvedValue({
      [STORAGE_KEY]: [pastDaily],
    });

    await restoreAlarms();

    expect(browser.storage.local.set).toHaveBeenCalled();
    const setCall = vi.mocked(browser.storage.local.set).mock.calls.at(-1)?.[0] as {
      reminders: Reminder[];
    };
    const updated = setCall.reminders[0];
    expect(updated.id).toBe("daily-1");
    expect(updated.datetime).toBeGreaterThan(Date.now());
    expect(browser.alarms.create).toHaveBeenCalledWith("daily-1", {
      when: updated.datetime,
    });
  });

  it("restoreAlarms deletes overdue one-shot reminders", async () => {
    const pastOnce = makeReminder({
      datetime: Date.now() - 1000,
      repeat: "none",
    });
    vi.mocked(browser.storage.local.get).mockResolvedValue({
      [STORAGE_KEY]: [pastOnce],
    });

    await restoreAlarms();

    expect(browser.storage.local.set).toHaveBeenCalledWith({ [STORAGE_KEY]: [] });
    expect(browser.alarms.create).not.toHaveBeenCalled();
  });

  it("scheduleAlarm registers alarm with reminder id as name", () => {
    const when = Date.now() + 5000;
    scheduleAlarm("abc-123", when);

    expect(browser.alarms.create).toHaveBeenCalledWith("abc-123", { when });
  });

  it("daily repeat keeps reminder id instead of delete-and-recreate", async () => {
    const reminder = makeReminder({
      id: "repeat-id",
      repeat: "daily",
      datetime: 1_700_000_000_000,
    });
    vi.mocked(browser.storage.local.get).mockResolvedValue({
      [STORAGE_KEY]: [reminder],
    });

    registerAlarmHandler();
    const listener = vi.mocked(browser.alarms.onAlarm.addListener).mock
      .calls[0]?.[0] as (alarm: { name: string }) => void;

    listener({ name: reminder.id });
    await vi.waitFor(() => {
      expect(browser.storage.local.set).toHaveBeenCalled();
    });

    const setCall = vi.mocked(browser.storage.local.set).mock.calls.at(-1)?.[0] as {
      reminders: Reminder[];
    };
    expect(setCall.reminders).toHaveLength(1);
    expect(setCall.reminders[0].id).toBe("repeat-id");
    expect(setCall.reminders[0].datetime).toBe(reminder.datetime + MS_PER_DAY);
    expect(browser.alarms.create).toHaveBeenCalledWith("repeat-id", {
      when: reminder.datetime + MS_PER_DAY,
    });
  });
});

const MS_PER_DAY = 24 * 60 * 60 * 1000;
