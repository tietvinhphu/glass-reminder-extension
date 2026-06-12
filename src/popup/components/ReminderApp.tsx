import { useState, useEffect, useCallback } from "react";

import type { Reminder, ReminderFormData } from "@/src/shared/types/reminder";
import { getReminders, addReminder, deleteReminder } from "@/src/shared/utils/reminderStorage";
import { scheduleAlarm, cancelAlarm } from "@/src/background/alarmHandler";
import { CreateReminderForm } from "./CreateReminderForm";
import { ReminderList } from "./ReminderList";

/** App chính của popup — quản lý state reminder và điều phối UI */
export const ReminderApp = () => {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Tải danh sách reminder từ storage khi popup mở
  const loadReminders = useCallback(async () => {
    const all = await getReminders();
    // Sắp xếp theo thời gian gần nhất lên đầu
    const sorted = [...all].sort((a, b) => a.datetime - b.datetime);
    setReminders(sorted);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    void loadReminders();
  }, [loadReminders]);

  const handleCreate = async (data: ReminderFormData) => {
    const created = await addReminder(data);
    // Đăng ký alarm trong background để bắn notification đúng giờ
    scheduleAlarm(created.id, created.datetime);
    setShowForm(false);
    await loadReminders();
  };

  const handleDelete = async (id: string) => {
    cancelAlarm(id);
    await deleteReminder(id);
    await loadReminders();
  };

  if (isLoading) {
    return <div className="app-loading">Đang tải...</div>;
  }

  return (
    <div className="reminder-app">
      <header className="app-header">
        <h1 className="app-title">Glass Reminder</h1>
        {!showForm && (
          <button
            className="btn-add"
            aria-label="Tạo nhắc nhở mới"
            onClick={() => setShowForm(true)}
          >
            +
          </button>
        )}
      </header>

      <main className="app-body">
        {showForm ? (
          <CreateReminderForm
            onSubmit={(data) => void handleCreate(data)}
            onCancel={() => setShowForm(false)}
          />
        ) : (
          <ReminderList
            reminders={reminders}
            onDelete={(id) => void handleDelete(id)}
          />
        )}
      </main>
    </div>
  );
};
