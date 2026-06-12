import type { Reminder } from "@/src/shared/types/reminder";

interface ReminderListProps {
  reminders: Reminder[];
  onDelete: (id: string) => void;
}

/** Format unix timestamp (ms) thành chuỗi ngày giờ dễ đọc */
const formatDatetime = (ms: number): string => {
  return new Date(ms).toLocaleString("vi-VN", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const REPEAT_LABEL: Record<Reminder["repeat"], string> = {
  none: "",
  daily: "Mỗi ngày",
  weekly: "Mỗi tuần",
};

/** Danh sách reminder sắp xếp theo thời gian gần nhất */
export const ReminderList = ({ reminders, onDelete }: ReminderListProps) => {
  if (reminders.length === 0) {
    return (
      <div className="empty-state">
        <p>Chưa có nhắc nhở nào</p>
        <p className="empty-hint">Bấm + để tạo nhắc nhở mới</p>
      </div>
    );
  }

  return (
    <ul className="reminder-list">
      {reminders.map((r) => (
        <li key={r.id} className="reminder-card">
          <div className="reminder-info">
            <span className="reminder-title">{r.title}</span>
            <span className="reminder-time">{formatDatetime(r.datetime)}</span>
            {r.note && <span className="reminder-note">{r.note}</span>}
            {r.repeat !== "none" && (
              <span className="reminder-repeat">{REPEAT_LABEL[r.repeat]}</span>
            )}
          </div>
          <button
            className="btn-delete"
            aria-label={`Xóa "${r.title}"`}
            onClick={() => onDelete(r.id)}
          >
            ✕
          </button>
        </li>
      ))}
    </ul>
  );
};
