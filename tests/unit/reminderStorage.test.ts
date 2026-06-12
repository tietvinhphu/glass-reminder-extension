import { beforeEach, describe, expect, it, vi } from "vitest";

import browser from "webextension-polyfill";

import type { Reminder } from "@/src/shared/types/reminder";
import {
  addReminder,
  deleteReminder,
  getReminderById,
  getReminders,
  updateReminder,
} from "@/src/shared/utils/reminderStorage";

const STORAGE_KEY = "reminders";

const seedReminders = (reminders: Reminder[]): void => {
  vi.mocked(browser.storage.local.get).mockResolvedValue({
    [STORAGE_KEY]: reminders,
  });
};

describe("reminderStorage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(browser.storage.local.get).mockResolvedValue({});
    vi.mocked(browser.storage.local.set).mockResolvedValue(undefined);
  });

  it("updateReminder keeps id and writes one storage update", async () => {
    const existing: Reminder = {
      id: "keep-id",
      title: "Daily standup",
      datetime: 1_000,
      repeat: "daily",
      createdAt: 500,
    };
    seedReminders([existing]);

    const updated = await updateReminder("keep-id", { datetime: 9_000 });

    expect(updated).toEqual({ ...existing, datetime: 9_000 });
    expect(browser.storage.local.set).toHaveBeenCalledWith({
      [STORAGE_KEY]: [{ ...existing, datetime: 9_000 }],
    });
  });

  it("updateReminder returns null when reminder is missing", async () => {
    seedReminders([]);

    const updated = await updateReminder("missing", { datetime: 9_000 });

    expect(updated).toBeNull();
    expect(browser.storage.local.set).not.toHaveBeenCalled();
  });

  it("addReminder appends reminder with generated id", async () => {
    const existing: Reminder = {
      id: "existing",
      title: "Old",
      datetime: 1,
      repeat: "none",
      createdAt: 1,
    };
    seedReminders([existing]);

    const created = await addReminder({
      title: "New",
      datetime: 2,
      repeat: "none",
    });

    expect(created.id).toEqual(expect.any(String));
    expect(created.id).not.toBe("existing");
    expect(browser.storage.local.set).toHaveBeenCalledWith({
      [STORAGE_KEY]: [existing, created],
    });
  });

  it("deleteReminder removes only matching id", async () => {
    const keep: Reminder = {
      id: "keep",
      title: "Keep",
      datetime: 1,
      repeat: "none",
      createdAt: 1,
    };
    const remove: Reminder = {
      id: "remove",
      title: "Remove",
      datetime: 2,
      repeat: "none",
      createdAt: 2,
    };
    seedReminders([keep, remove]);

    await deleteReminder("remove");

    expect(browser.storage.local.set).toHaveBeenCalledWith({
      [STORAGE_KEY]: [keep],
    });
  });

  it("getReminderById returns stored reminder", async () => {
    const reminder: Reminder = {
      id: "one",
      title: "One",
      datetime: 1,
      repeat: "none",
      createdAt: 1,
    };
    seedReminders([reminder]);

    await expect(getReminderById("one")).resolves.toEqual(reminder);
    await expect(getReminders()).resolves.toEqual([reminder]);
  });
});
