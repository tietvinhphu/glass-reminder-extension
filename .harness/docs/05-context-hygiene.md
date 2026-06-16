# 05. Context Hygiene — SWE-agent 4 ACI Components

> 4 components tối ưu từ SWE-agent paper (NeurIPS 2024) — mỗi tool mới phải tự enforce 1 trong 4 rule này.

---

## Tại sao Context Hygiene quan trọng

**Vấn đề cốt lõi:** Working memory (context window) là **tài nguyên hữu hạn và đắt đỏ**.

- Model trả tiền theo tokens
- Context bị "ngập" = suy luận kém = output vô dụng
- "Context rot" = khi context dài, model quên instructions ở đầu (Anthropic finding)

**Giải pháp:** Giới hạn output của từng tool, không để tràn.

---

## 4 ACI Components (Agent-Computer Interface)

### 1. SEARCH có giới hạn

**Quy tắc:** Tối đa **50 kết quả/lần**. Vượt thì báo "refine query".

**Tại sao 50?**
- Quá ít (<20): miss relevant results
- Quá nhiều (>100): ngập context, model đọc không hết
- 50 = "Goldilocks" — đủ để cover, ít để analyze

**Áp dụng:**
- File search (Glob): nếu >50 match → narrow glob pattern
- Grep results: nếu >50 → narrow regex hoặc path
- Database query: luôn có LIMIT

**Example:**
```bash
# ✅ Đúng — narrow trước
grep -r "function.*Calendar" src/calendar/ | head -50

# ❌ Sai — tràn context
grep -r "function" src/ | head -500
```

---

### 2. FILE VIEWER có số dòng

**Quy tắc:** Hiển thị **100 dòng/lần**, có số dòng prepend.

**Tại sao 100?**
- 1 màn hình IDE vừa đủ
- Dễ cite "line 42" khi edit
- Tránh đọc cả file 1000 dòng 1 lần

**Áp dụng:**
- Mỗi lần đọc file: dùng `Read` với `offset` + `limit`
- KHÔNG đọc cả file >300 dòng trong 1 lần
- Số dòng ở format `file.ts:42-51` (clickable)

**Example:**
```typescript
// ✅ Đúng — đọc từng phần
const part1 = await Read({ filePath: "src/auth.ts", offset: 1, limit: 100 });
const part2 = await Read({ filePath: "src/auth.ts", offset: 101, limit: 100 });

// ❌ Sai — đọc cả file 1 lần
const whole = await Read({ filePath: "src/auth.ts" });
```

---

### 3. EDITOR tích hợp linter

**Quy tắc:** Sau mỗi edit → auto-run linter. Reject nếu có syntax error.

**Tại sao?**
- Syntax error dẫn đến chain failure (tool sau fail vì tool trước corrupt)
- Lint ngay = debug 1 lần. Lint sau = debug 5 lần.

**Áp dụng:**
- PostToolUse hook cho `Write|Edit|MultiEdit` → auto-lint
- TypeScript: `tsc --noEmit` ngay sau edit
- ESLint: chạy trên file vừa edit
- SonarQube: optional (nặng hơn, chạy cuối)

**Example hook:** `.claude/hooks/check-vi-comment.sh`
```bash
#!/bin/bash
# Sau khi Write/Edit, check file .ts/.tsx có Vietnamese comment không
FILE_PATH=$(echo "$CLAUDE_TOOL_INPUT" | jq -r '.tool_input.file_path // empty')
[[ -z "$FILE_PATH" || ! "$FILE_PATH" =~ \.(ts|tsx)$ ]] && exit 0
HEAD=$(head -10 "$FILE_PATH" 2>/dev/null)
echo "$HEAD" | grep -qE '^\s*//.*[àáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđ]' && exit 0
echo "❌ File .ts/.tsx phải có comment tiếng Việt trong 10 dòng đầu" >&2
exit 2
```

---

### 4. CONTEXT COMPRESSION

**Quy tắc:** Lịch sử >**5 turns** → nén thành summary 1 dòng.

**Tại sao 5?**
- Dưới 5: còn nhớ context rõ
- 5-10: bắt đầu "context rot" (Anthropic finding)
- Trên 10: gần như chắc chắn quên instructions đầu

**Áp dụng:**
- Tự nén trong thinking: "Đã làm A, B, C. Đang ở D."
- PreCompact hook: tự động lưu summary trước khi system compress
- Trong docs/README: luôn có "TL;DR" ở đầu

**Example PreCompact hook:** `.claude/hooks/summarize-mistakes.sh`
```bash
#!/bin/bash
# Trước khi context bị compress, snapshot mistake log vào MEMORY
MISTAKES_COUNT=$(ls .harness/mistakes/*.json 2>/dev/null | wc -l)
RECENT=$(ls -t .harness/mistakes/*.json 2>/dev/null | head -3)
echo "📋 PreCompact: $MISTAKES_COUNT mistakes logged. Recent:"
echo "$RECENT" | while read f; do
  SUMMARY=$(jq -r '.mistake.summary' "$f" 2>/dev/null)
  echo "  - $SUMMARY"
done
```

---

## Áp dụng cho mọi tool mới

Khi tạo skill/tool mới, tự check:

| Rule | Tool có enforce không? |
|---|---|
| Search ≤50 results | ☐ Có / ☐ Không |
| File view ≤100 lines | ☐ Có / ☐ Không |
| Auto-lint after edit | ☐ Có / ☐ Không |
| Compress after 5 turns | ☐ Có / ☐ Không |

Nếu ≥1 rule "Không" → tool chưa sẵn sàng ship, cần engineer trước.

---

## Metric: Context hygiene có tốt không?

Đếm hàng tuần:
- **Avg tokens per turn:** có tăng theo thời gian không? (target: ổn định hoặc giảm)
- **Compactions per session:** bao nhiêu? (target: 1 hoặc 0)
- **Mistakes do "context rot":** có bao nhiêu? (target: 0)

→ Quay lại [`HARNESS.md`](../HARNESS.md).
