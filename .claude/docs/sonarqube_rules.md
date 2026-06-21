# SonarQube Rules — Glass Reminder Extension

> File này là **progressive disclosure** cho CLAUDE.md.
> Chỉ đọc khi chạy SonarQube scan hoặc fix Sonar issues.

## Workflow sau khi implement code

> **KHÔNG được báo "xong" trước khi bước này hoàn tất.**

### Bước 1 — Gọi SonarQube MCP analyze

Nếu SonarQube MCP tool `analyze_file_list` có sẵn:
```
analyze_file_list([<danh sách file đã sửa trong task>])
```

Nếu MCP không available (Docker chưa chạy):
- Đọc lại từng file vừa sửa
- Tự check theo 8 rule phổ biến dưới đây

### Bước 2 — Fix TẤT CẢ issues

Không bỏ qua issue nào. Thứ tự ưu tiên:
1. **Security** (S6702, S2068, ...) — fix ngay, không NOSONAR
2. **Bug** (S7764, S1874, ...) — fix code
3. **Code smell** (S6759, S6772, S3516, ...) — fix code
4. **Contrast/CSS** (S7924) — fix màu nếu thật sự sai; NOSONAR nếu false-positive do dark theme

### Bước 3 — Re-analyze đến khi 0 issues

Lặp lại Bước 1 → Bước 2 cho đến khi `analyze_file_list` trả về **0 issues mới**.

## 8 rules hay gặp trong project

| Rule | Mô tả | Cách fix |
|------|--------|----------|
| **S6759** | Props không dùng `Readonly<>` | Bọc interface trong `Readonly<Props>` |
| **S6772** | JSX text literal mơ hồ | Bọc trong `{"text"}` |
| **S7764** | Dùng `window.*` trong extension | Đổi sang `globalThis.*` |
| **S1874** | API deprecated (FormEvent...) | Dùng `SyntheticEvent<HTMLFormElement>` |
| **S3516** | Function luôn return cùng 1 giá trị | Bỏ return thừa |
| **S7924** | CSS contrast thấp | Fix màu hoặc thêm `/* NOSONAR */` nếu dark theme |
| **S6702** | Secret/token hardcode | KHÔNG bao giờ NOSONAR — phải xóa token |
| **S1128** | Import không dùng | Xóa import |

## Ví dụ fix cụ thể

### S6772 — JSX text literal

```tsx
// ❌ Trigger S6772
<p>Chưa có nhắc nhở nào</p>

// ✅ Fix
<p>{"Chưa có nhắc nhở nào"}</p>
```

### S6759 — Readonly props

```tsx
// ❌ Trigger S6759
interface ReminderListProps {
  reminders: Reminder[];
  onDelete: (id: string) => void;
}
export const ReminderList = ({ reminders, onDelete }: ReminderListProps) => { ... };

// ✅ Fix
export const ReminderList = ({ reminders, onDelete }: Readonly<ReminderListProps>) => { ... };
```

### S7764 — window.* trong extension

```typescript
// ❌ Trigger S7764
const w = window.innerWidth;

// ✅ Fix
const w = globalThis.innerWidth;
```

## Related docs

- [code_style.md](code_style.md) — General code style rules
- [architecture.md](architecture.md) — Directory structure
- [../memory/audit_2026-06-21.md](../memory/audit_2026-06-21.md) — Audit findings 21/06/2026
