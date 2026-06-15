import { useState } from "react";
import {
  Calendar,
  CalendarGrid,
  CalendarGridBody,
  CalendarGridHeader,
  CalendarHeaderCell,
  CalendarCell,
  Heading,
  Button as AriaButton,
} from "react-aria-components";
import type { CalendarDate } from "@internationalized/date";
import { today, getLocalTimeZone, toCalendarDate, fromDate } from "@internationalized/date";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface CalendarPickerProps {
  /** Unix timestamp (ms) — giá trị ngày giờ hiện tại từ form */
  value: number;
  /** Callback khi user xác nhận — trả về unix timestamp (ms) đã chọn */
  onConfirm: (ts: number) => void;
  /** Callback khi user hủy bỏ — quay về form */
  onCancel: () => void;
}

/** Tạo className cho ô ngày dựa trên trạng thái react-aria */
const cellClassName = (isSelected: boolean, isToday: boolean, isOutsideVisibleRange: boolean, isDisabled: boolean): string => {
  const cls = ["cal-cell"];
  if (isSelected) cls.push("cal-cell--selected");
  if (isToday) cls.push("cal-cell--today");
  if (isOutsideVisibleRange) cls.push("cal-cell--outside");
  if (isDisabled) cls.push("cal-cell--disabled");
  return cls.join(" ");
};

/** Calendar picker dùng react-aria-components — chọn ngày và giờ phút */
export const CalendarPicker = ({ value, onConfirm, onCancel }: Readonly<CalendarPickerProps>) => {
  const tz = getLocalTimeZone();
  const initial = new Date(value);

  /** Khởi tạo ngày được chọn từ timestamp truyền vào */
  const [selectedDate, setSelectedDate] = useState<CalendarDate>(
    toCalendarDate(fromDate(initial, tz)),
  );
  const [hour, setHour] = useState(initial.getHours());
  const [minute, setMinute] = useState(initial.getMinutes());

  /** Kết hợp ngày từ calendar với giờ phút để tạo timestamp và gọi onConfirm */
  const handleConfirm = () => {
    const date = new Date(
      selectedDate.year,
      selectedDate.month - 1,
      selectedDate.day,
      hour,
      minute,
      0,
      0,
    );
    onConfirm(date.getTime());
  };

  return (
    <div className="cal-wrapper">
      <h2 className="cal-title">{"Chọn ngày giờ"}</h2>

      <Calendar
        className="cal-root"
        value={selectedDate}
        onChange={setSelectedDate}
        minValue={today(tz)}
      >
        <header className="cal-header">
          <AriaButton slot="previous" className="cal-nav-btn">
            <ChevronLeft size={14} />
          </AriaButton>
          <Heading className="cal-heading" />
          <AriaButton slot="next" className="cal-nav-btn">
            <ChevronRight size={14} />
          </AriaButton>
        </header>

        <CalendarGrid className="cal-grid">
          <CalendarGridHeader>
            {(day) => (
              <CalendarHeaderCell className="cal-week-header">
                {day}
              </CalendarHeaderCell>
            )}
          </CalendarGridHeader>
          <CalendarGridBody>
            {(date) => (
              <CalendarCell
                date={date}
                className={({ isSelected, isToday, isOutsideVisibleRange, isDisabled }) =>
                  cellClassName(isSelected, isToday, isOutsideVisibleRange, isDisabled)
                }
              >
                {/* Wrap số ngày trong span để CSS .cal-cell > * có target element */}
                <span aria-hidden="true">{date.day}</span>
              </CalendarCell>
            )}
          </CalendarGridBody>
        </CalendarGrid>
      </Calendar>

      {/* Chọn giờ và phút */}
      <div className="cal-time">
        <span className="cal-time-label">{"Giờ"}</span>
        <div className="cal-time-inputs">
          <select
            className="cal-time-select"
            value={hour}
            onChange={(e) => setHour(Number(e.target.value))}
            aria-label="Giờ"
          >
            {Array.from({ length: 24 }, (_, i) => (
              <option key={i} value={i}>{String(i).padStart(2, "0")}</option>
            ))}
          </select>
          <span className="cal-time-sep" aria-hidden="true">{":"}</span>
          <select
            className="cal-time-select"
            value={minute}
            onChange={(e) => setMinute(Number(e.target.value))}
            aria-label="Phút"
          >
            {Array.from({ length: 60 }, (_, i) => (
              <option key={i} value={i}>{String(i).padStart(2, "0")}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="form-actions">
        <button type="button" className="btn-secondary" onClick={onCancel}>
          {"Hủy"}
        </button>
        <button type="button" className="btn-primary" onClick={handleConfirm}>
          {"Xác nhận"}
        </button>
      </div>
    </div>
  );
};
