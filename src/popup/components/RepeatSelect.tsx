import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { ChevronDown, Check } from "lucide-react";

import type { ReminderFormData } from "../../shared/types/reminder";

type RepeatValue = ReminderFormData["repeat"];

interface RepeatSelectProps {
  /** Giá trị hiện tại của tùy chọn lặp lại */
  value: RepeatValue;
  /** Callback khi user chọn tùy chọn mới */
  onChange: (value: RepeatValue) => void;
}

const OPTIONS: { value: RepeatValue; label: string }[] = [
  { value: "none", label: "Không lặp" },
  { value: "daily", label: "Mỗi ngày" },
  { value: "weekly", label: "Mỗi tuần" },
];

/** Dropdown chọn chế độ lặp lại — dùng Radix DropdownMenu, style pure CSS không Tailwind */
export const RepeatSelect = ({ value, onChange }: Readonly<RepeatSelectProps>) => {
  const current = OPTIONS.find((o) => o.value === value) ?? OPTIONS[0];

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger className="repeat-trigger" aria-label="Chọn chế độ lặp lại">
        <span>{current.label}</span>
        <ChevronDown size={14} aria-hidden="true" className="repeat-trigger-icon" />
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          className="repeat-content"
          sideOffset={4}
          align="start"
          avoidCollisions
        >
          <DropdownMenu.RadioGroup
            value={value}
            onValueChange={(v) => onChange(v as RepeatValue)}
          >
            {OPTIONS.map((opt) => (
              <DropdownMenu.RadioItem
                key={opt.value}
                value={opt.value}
                className="repeat-item"
              >
                {/* Wrapper cố định 16px — luôn chiếm không gian dù chưa chọn */}
                <span className="repeat-item-indicator-wrap" aria-hidden="true">
                  <DropdownMenu.ItemIndicator>
                    <Check size={12} strokeWidth={2.5} />
                  </DropdownMenu.ItemIndicator>
                </span>
                {opt.label}
              </DropdownMenu.RadioItem>
            ))}
          </DropdownMenu.RadioGroup>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
};
