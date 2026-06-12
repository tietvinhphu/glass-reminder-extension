import { useState } from "react";

import type { ReminderFormData } from "@/src/shared/types/reminder";

interface CreateReminderFormProps {
  onSubmit: (data: ReminderFormData) => void;
  onCancel: () => void;
}

/** Chuyển datetime-local input string thành unix timestamp (ms) */
const toTimestamp = (datetimeLocal: string): number =>
  new Date(datetimeLocal).getTime();

/** Format Date thành chuỗi datetime-local input (YYYY-MM-DDTHH:mm) */
const toDatetimeLocal = (date: Date): string => {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

/** Form tạo reminder mới — validate trước khi submit */
export const CreateReminderForm = ({ onSubmit, onCancel }: CreateReminderFormProps) => {
  // Mặc định thời gian = 1 giờ sau hiện tại
  const defaultDatetime = toDatetimeLocal(new Date(Date.now() + 60 * 60 * 1000));

  const [title, setTitle] = useState("");
  const [datetimeLocal, setDatetimeLocal] = useState(defaultDatetime);
  const [note, setNote] = useState("");
  const [repeat, setRepeat] = useState<ReminderFormData["repeat"]>("none");
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError("Vui lòng nhập tiêu đề");
      return;
    }
    const datetime = toTimestamp(datetimeLocal);
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
    <form className="create-form" onSubmit={handleSubmit}>
      <h2 className="form-title">Tạo nhắc nhở</h2>

      <label className="form-label">
        Tiêu đề <span aria-hidden="true">*</span>
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
        Thời gian <span aria-hidden="true">*</span>
        <input
          className="form-input"
          type="datetime-local"
          value={datetimeLocal}
          onChange={(e) => setDatetimeLocal(e.target.value)}
        />
      </label>

      <label className="form-label">
        Ghi chú
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
        Lặp lại
        <select
          className="form-input"
          value={repeat}
          onChange={(e) => setRepeat(e.target.value as ReminderFormData["repeat"])}
        >
          <option value="none">Không lặp</option>
          <option value="daily">Mỗi ngày</option>
          <option value="weekly">Mỗi tuần</option>
        </select>
      </label>

      {error && <p className="form-error" role="alert">{error}</p>}

      <div className="form-actions">
        <button type="button" className="btn-secondary" onClick={onCancel}>
          Hủy
        </button>
        <button type="submit" className="btn-primary">
          Tạo nhắc nhở
        </button>
      </div>
    </form>
  );
};
