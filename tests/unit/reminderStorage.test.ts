import { beforeEach, describe, expect, it, vi } from "vitest";

import type { Reminder } from "@/src/shared/types/reminder";
import { chromeMock } from "../mocks/webextension-polyfill";

describe("reminderStorage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal("chrome", chromeMock);
  });

  it("updateReminder() cập nhật field và giữ nguyên id", async () => {
    const storedData: Record<string, unknown> = {};
    const reminder: Reminder = {
      id: "keep-id",
      title: "Standup",
      datetime: Date.now(),
      repeat: "weekly",
      createdAt: 1_700_000_000_000,
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

    const { updateReminder } = await import("@/src/shared/utils/reminderStorage");

    const nextDatetime = reminder.datetime + 7 * 24 * 60 * 60 * 1000;
    const updated = await updateReminder("keep-id", { datetime: nextDatetime });

    expect(updated.id).toBe("keep-id");
    expect(updated.createdAt).toBe(reminder.createdAt);
    expect(updated.datetime).toBe(nextDatetime);

    const stored = storedData.reminders as Reminder[];
    expect(stored).toHaveLength(1);
    expect(stored[0].id).toBe("keep-id");
  });
});
