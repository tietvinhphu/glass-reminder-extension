import { useState, type SyntheticEvent } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Calendar as CalendarIcon } from "lucide-react";

import type { Reminder, ReminderFormData } from "../../shared/types/reminder";
import { CalendarPicker } from "./CalendarPicker";
import { RepeatSelect } from "./RepeatSelect";

interface CreateReminderFormProps {
  onSubmit: (data: ReminderFormData) => void;
  onCancel: () => void;
  /** Có giá trị khi đang ở chế độ chỉnh sửa — pre-fill form với data hiện tại */
  initialData?: Reminder;
}

/** Format unix timestamp (ms) thành chuỗi ngày giờ dễ đọc cho nút chọn ngày */
const formatDateDisplay = (ts: number): string =>
  new Date(ts).toLocaleString("vi-VN", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

/** Variants animation cho transition giữa form và calendar */
const slideLeft = {
  initial: { opacity: 0, x: -24 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -24 },
};

const slideRight = {
  initial: { opacity: 0, x: 24 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: 24 },
};

/** Form tạo / chỉnh sửa reminder — validate trước khi submit, có calendar picker */
export const CreateReminderForm = ({ onSubmit, onCancel, initialData }: Readonly<CreateReminderFormProps>) => {
  const isEditing = initialData !== undefined;

  const [title, setTitle] = useState(initialData?.title ?? "");
  /** Unix timestamp (ms) của ngày giờ được chọn */
  const [datetime, setDatetime] = useState<number>(
    initialData?.datetime ?? Date.now() + 60 * 60 * 1000,
  );
  const [note, setNote] = useState(initialData?.note ?? "");
  const [repeat, setRepeat] = useState<ReminderFormData["repeat"]>(initialData?.repeat ?? "none");
  const [error, setError] = useState("");
  /** Điều khiển hiển thị calendar picker thay cho form chính */
  const [showCalendar, setShowCalendar] = useState(false);

  const handleSubmit = (e: SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!title.trim()) {
      setError("Vui lòng nhập tiêu đề");
      return;
    }
    if (datetime <= Date.now()) {
      setError("Thời gian phải ở tương lai");
      return;
    }
    onSubmit({
      title: title.trim(),
      datetime,
      note: note.trim() || undefined,
      repeat,
    });
  };

  return (
    <AnimatePresence mode="wait" initial={false}>
      {showCalendar ? (
        <motion.div
          key="calendar"
          {...slideRight}
          transition={{ duration: 0.2, ease: "easeOut" }}
        >
          <CalendarPicker
            value={datetime}
            onConfirm={(ts) => {
              setDatetime(ts);
              setShowCalendar(false);
            }}
            onCancel={() => setShowCalendar(false)}
          />
        </motion.div>
      ) : (
        <motion.form
          key="form"
          className="create-form"
          onSubmit={handleSubmit}
          {...slideLeft}
          transition={{ duration: 0.2, ease: "easeOut" }}
        >
          <h2 className="form-title">{isEditing ? "Chỉnh sửa nhắc nhở" : "Tạo nhắc nhở"}</h2> {/* S6772: JSX text đã qua expression, OK */}

          <label className="form-label">
            {"Tiêu đề"} <span aria-hidden="true">{"*"}</span>
            <input
              className="form-input"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Họp team, deadline báo cáo..."
              maxLength={100}
              autoFocus
            />
          </label>

          <label className="form-label">
            {"Thời gian"} <span aria-hidden="true">{"*"}</span>
            <button
              type="button"
              className="form-datetime-btn"
              onClick={() => setShowCalendar(true)}
            >
              <CalendarIcon size={14} className="form-datetime-icon" aria-hidden="true" />
              {formatDateDisplay(datetime)}
            </button>
          </label>

          <label className="form-label">
            {"Ghi chú"}
            <textarea
              className="form-input form-textarea"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Tùy chọn..."
              maxLength={300}
              rows={2}
            />
          </label>

          <label className="form-label">
            {"Lặp lại"}
            <RepeatSelect value={repeat} onChange={setRepeat} />
          </label>

          {error && <p className="form-error" role="alert">{error}</p>}

          <div className="form-actions">
            <button type="button" className="btn-secondary" onClick={onCancel}>
              {"Hủy"}
            </button>
            <button type="submit" className="btn-primary">
              {isEditing ? "Cập nhật" : "Tạo nhắc nhở"}
            </button>
          </div>
        </motion.form>
      )}
    </AnimatePresence>
  );
};
