import { useState, useEffect, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Bell, Plus, Settings } from "lucide-react";
import browser from "webextension-polyfill";

import type { Reminder, ReminderFormData } from "@/src/shared/types/reminder";
import { getReminders, addReminder, deleteReminder, updateReminder } from "@/src/shared/utils/reminderStorage";
import { scheduleAlarm, cancelAlarm } from "@/src/background/alarmHandler";
import { CreateReminderForm } from "./CreateReminderForm";
import { ReminderList } from "./ReminderList";

/** App chính của popup — quản lý state reminder và điều phối UI */
export const ReminderApp = () => {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingReminder, setEditingReminder] = useState<Reminder | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  /** Tải danh sách reminder từ storage khi popup mở */
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
    handleCloseForm();
    await loadReminders();
  };

  const handleDelete = async (id: string) => {
    cancelAlarm(id);
    await deleteReminder(id);
    await loadReminders();
  };

  const handleEditStart = (reminder: Reminder) => {
    setEditingReminder(reminder);
    setShowForm(true);
  };

  /** Cập nhật reminder: hủy alarm cũ → lưu data mới → đăng ký alarm mới */
  const handleUpdate = async (id: string, data: ReminderFormData) => {
    cancelAlarm(id);
    await updateReminder(id, data);
    scheduleAlarm(id, data.datetime);
    handleCloseForm();
    await loadReminders();
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingReminder(null);
  };

  /** Mở trang cài đặt Edge để user bật 'Tiếp tục chạy nền' cho extension */
  const openBackgroundSettings = () => {
    browser.tabs.create({ url: "edge://settings/system/manageSystem" }).catch(console.error);
  };

  if (isLoading) {
    return (
      <div className="reminder-app">
        <div className="app-loading">{"Đang tải..."}</div>
      </div>
    );
  }

  return (
    <div className="reminder-app">
      <header className="app-header">
        <div className="app-brand">
          <span className="app-brand-icon" aria-hidden="true">
            <Bell size={18} />
          </span>
          <h1 className="app-title">{"Nhắc Lịch"}</h1>
        </div>
        {!showForm && (
          <button
            type="button"
            className="btn-add"
            aria-label="Tạo nhắc nhở mới"
            onClick={() => setShowForm(true)}
          >
            <Plus size={14} />
          </button>
        )}
      </header>

      <main className="app-body">
        <AnimatePresence mode="wait" initial={false}>
          {showForm ? (
            <motion.div
              key="form"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
            >
              <CreateReminderForm
                initialData={editingReminder ?? undefined}
                onSubmit={(data) => {
                  if (editingReminder) {
                    void handleUpdate(editingReminder.id, data);
                  } else {
                    void handleCreate(data);
                  }
                }}
                onCancel={handleCloseForm}
              />
            </motion.div>
          ) : (
            <motion.div
              key="list"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <ReminderList
                reminders={reminders}
                onDelete={(id) => void handleDelete(id)}
                onEdit={handleEditStart}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <footer className="app-footer">
        <button
          type="button"
          className="footer-settings-btn"
          onClick={openBackgroundSettings}
        >
          <span className="footer-icon" aria-hidden="true">
            <Settings size={13} />
          </span>
          <span>{"Bật 'Tiếp tục chạy nền' để nhận nhắc nhở khi đóng Edge"}</span>
        </button>
      </footer>
    </div>
  );
};
