import { motion } from "framer-motion";
import { Pencil, X } from "lucide-react";

import type { Reminder } from "../../shared/types/reminder";

interface ReminderListProps {
  reminders: Reminder[];
  onDelete: (id: string) => void;
  onEdit: (reminder: Reminder) => void;
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

/** Variants stagger: các card xuất hiện lần lượt từ trên xuống */
const listVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06 } },
};

const cardVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0 },
};

/** Danh sách reminder sắp xếp theo thời gian gần nhất */
export const ReminderList = ({ reminders, onDelete, onEdit }: Readonly<ReminderListProps>) => {
  if (reminders.length === 0) {
    return (
      <motion.div
        className="empty-state"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <p>{"Chưa có nhắc nhở nào"}</p>
        <p className="empty-hint">{"Bấm + để tạo nhắc nhở mới"}</p> {/* S6772: đã bọc expression */}
      </motion.div>
    );
  }

  return (
    <motion.ul
      className="reminder-list"
      variants={listVariants}
      initial="hidden"
      animate="visible"
    >
      {reminders.map((r) => (
        <motion.li key={r.id} className="reminder-card" variants={cardVariants} transition={{ duration: 0.2 }}>
          <div className="reminder-info">
            <span className="reminder-title">{r.title}</span>
            <span className="reminder-time">{formatDatetime(r.datetime)}</span>
            {r.note && <span className="reminder-note">{r.note}</span>}
            {r.repeat !== "none" && (
              <span className="reminder-repeat">{REPEAT_LABEL[r.repeat]}</span>
            )}
          </div>
          <div className="reminder-actions">
            <button
              type="button"
              className="btn-edit"
              aria-label={`Chỉnh sửa "${r.title}"`}
              onClick={() => onEdit(r)}
            >
              <Pencil size={13} />
            </button>
            <button
              type="button"
              className="btn-delete"
              aria-label={`Xóa "${r.title}"`}
              onClick={() => onDelete(r.id)}
            >
              <X size={13} />
            </button>
          </div>
        </motion.li>
      ))}
    </motion.ul>
  );
};
