/** Một reminder được lưu trong local storage */
export interface Reminder {
  id: string;
  title: string;
  /** Unix timestamp (ms) — thời điểm bắn notification */
  datetime: number;
  note?: string;
  repeat: "none" | "daily" | "weekly";
  createdAt: number;
}

/** Dữ liệu form khi tạo/sửa reminder — không có id và createdAt */
export type ReminderFormData = Omit<Reminder, "id" | "createdAt">;
