import { beforeEach, describe, expect, it, vi } from "vitest";

import type { Reminder } from "@/src/shared/types/reminder";
import {
  addReminder,
  getReminders,
  updateReminder,
} from "@/src/shared/utils/reminderStorage";
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

const sampleReminder = (): Reminder => ({
  id: "reminder-1",
  title: "Họp team",
  datetime: Date.now() + 60_000,
  repeat: "daily",
  createdAt: Date.now(),
});

describe("reminderStorage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPersistentStorage();
  });

  it("updateReminder giữ nguyên id khi đổi datetime cho repeat", async () => {
    const existing = sampleReminder();
    mockPersistentStorage({ [STORAGE_KEY]: [existing] });

    const updated = await updateReminder(existing.id, {
      datetime: existing.datetime + 86_400_000,
    });

    expect(updated).toMatchObject({
      id: existing.id,
      title: existing.title,
      repeat: "daily",
      datetime: existing.datetime + 86_400_000,
    });
    expect(chromeMock.storage.local.set).toHaveBeenCalledWith({
      [STORAGE_KEY]: [updated],
    });
  });

  it("updateReminder trả null khi id không tồn tại", async () => {
    mockPersistentStorage({ [STORAGE_KEY]: [] });

    const updated = await updateReminder("missing-id", { datetime: Date.now() });

    expect(updated).toBeNull();
    expect(chromeMock.storage.local.set).not.toHaveBeenCalled();
  });

  it("addReminder luôn tạo id mới", async () => {
    const created = await addReminder({
      title: "Deadline",
      datetime: Date.now() + 120_000,
      repeat: "none",
    });

    expect(created.id).toBeTruthy();
    expect(await getReminders()).toEqual([created]);
  });
});
