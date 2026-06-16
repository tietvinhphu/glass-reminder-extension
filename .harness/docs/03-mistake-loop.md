# 03. Mistake Loop — Hashimoto Operationalized

> Đây là **trái tim** của framework. Mỗi lần agent sai, ta chạy 4 bước. Không skip bước nào.

---

## Tại sao loop này quan trọng

**Mitchell Hashimoto (cha đẻ Terraform, founder HashiCorp, 2/2026):**
> *"Anytime you find an agent makes a mistake, you take the time to engineer a solution such that the agent never makes that mistake again."*

**Nếu không có loop:**
- Agent lặp lại cùng lỗi qua nhiều sessions
- Mỗi lần fix tốn effort mà không tích lũy
- Harness không cải thiện theo thời gian → mất lợi thế 64% (SWE-agent)

**Nếu có loop:**
- Mỗi mistake = 1 entry trong mistake log
- Mỗi entry = 1 layer được engineer tốt hơn
- Sau N mistakes, harness gần như "perfect" cho context của anh

---

## 4 bước của Loop

```
┌──────────────────────────────────────────────────────────────┐
│  1. DETECT  →  2. LOG  →  3. ENGINEER FIX  →  4. VERIFY    │
└──────────────────────────────────────────────────────────────┘
```

### Bước 1 — DETECT

**Ai phát hiện?**
- **User** nói: "log mistake này", "agent sai rồi", "fix xong rồi nhưng phải đảm bảo không lặp lại"
- **Hook tự phát hiện:** PostToolUse check syntax, format, security
- **Agent tự detect:** so sánh output với acceptance criteria

**Ví dụ phát hiện:**
```
User: "agent vừa tạo function calculateTotal() mà không có comment tiếng Việt"
Hook: PostToolUse check .ts file → không tìm thấy Vietnamese regex → reject
Agent: "Tôi thấy file thiếu comment, hãy log mistake này"
```

---

### Bước 2 — LOG

**Skill dùng:** `harness-mistake-log`

**File location:** `.harness/mistakes/{{YYYY-MM-DD}}-{{slug}}.json`

**Schema (JSON, không phải Markdown):**
```json
{
  "id": "uuid-v4",
  "date": "2026-06-16",
  "category": "code-style | security | perf | workflow | context",
  "mistake": {
    "summary": "Mô tả ngắn lỗi agent mắc",
    "context": "Task nào, file nào, điều kiện gì",
    "evidence": "Quote từ output hoặc file path:line"
  },
  "root_cause": "Tại sao agent sai — thiếu memory, thiếu skill, thiếu guardrail?",
  "harness_fix": {
    "layer": "L1|L2|L3|L4|L5|L6|L7",
    "type": "skill|hook|template|memory|script|rule",
    "description": "Cụ thể sửa gì",
    "files_changed": ["path1", "path2"]
  },
  "prevention": "Cơ chế nào ngăn lỗi lặp lại (vd: hook reject khi missing comment)",
  "verified_at": "2026-06-16T14:30:00Z",
  "verified_by": "user | hook-name | test-name",
  "tags": ["comment", "vietnamese", "code-style"]
}
```

**Tại sao JSON?**
- Model ít tự ý sửa JSON (theo Anthropic leak)
- Có thể validate bằng `jq` hoặc schema validator
- Tìm kiếm dễ: `jq '.[] | select(.category=="security")' mistakes/*.json`

---

### Bước 3 — ENGINEER FIX

**Xác định layer bị thiếu (L1-L7), rồi engineer tại layer đó.**

| Root cause | Layer cần engineer | Action |
|---|---|---|
| Không biết domain | L1 Identity | Cập nhật HARNESS.md, INSTRUCTIONS.md |
| Không nhớ convention | L2 Memory | Thêm file memory mới |
| Không biết workflow | L3 Skills | Tạo/cập nhật skill |
| Không bị chặn | L4 Hooks | Thêm PostToolUse hook |
| State bị corrupt | L5 State | Convert sang JSON + schema |
| Bước bị skip | L6 Workflows | Tạo/sửa script |
| Quality gate miss | L7 Quality Gates | Thêm ESLint/SonarQube/Vitest rule |

**ĐỪNG fix chỉ task hiện tại. PHẢI engineer fix để lỗi không lặp lại.**

Ví dụ cụ thể: [`examples/mistake-to-hook.md`](../examples/mistake-to-hook.md)

---

### Bước 4 — VERIFY

**Cách verify:**

1. **Manual:** Thử reproduce mistake sau khi đã apply fix → confirm fix hoạt động
2. **Auto:** Hook tự động reject action vi phạm (vd: edit .ts thiếu comment → exit 2)
3. **Test:** Thêm test case mô tả mistake, confirm test pass sau fix
4. **Time-based:** Đợi 1 tuần, check mistake log có entry mới cùng loại không

**Sau khi verify pass:**
- Set `verified_at` và `verified_by` trong mistake log
- Commit: `chore(harness): log mistake {{slug}} + apply fix`
- Nếu có lesson learned mới → cập nhật `principles.md` hoặc `HARNESS.md`

**Nếu verify FAIL:**
- Quay lại bước 3, engineer fix khác
- Có thể cần engineer ở layer khác (vd: không chỉ L4 hook, mà cả L3 skill)

---

## Anti-patterns

### ❌ "Fix xong rồi, lần sau sẽ nhớ"
- Sai. Agent không có memory giữa sessions
- Phải engineer guardrail (L4) hoặc memory (L2)

### ❌ "Ghi vào Markdown cho dễ đọc"
- Sai. Model sẽ tự ý sửa Markdown
- State phải là JSON, có schema

### ❌ "Mistake này chỉ xảy ra 1 lần, không cần log"
- Sai. "Chỉ 1 lần" là do ta chưa thấy pattern
- Mỗi mistake đều đáng log — pattern chỉ lộ ra sau 5-10 entries

### ❌ "Đã log rồi, không cần apply fix"
- Sai. Log không = fix
- Mỗi mistake PHẢI dẫn đến 1 engineer action ở 1 layer

### ❌ "Tốn thời gian quá, skip loop lần này"
- Sai. Skip loop = mất compound learning
- Đây là **khoản đầu tư** cho tương lai, không phải chi phí

---

## Metric: Loop có hiệu quả không?

Sau 1 tháng, đếm:
- **Mistakes logged:** bao nhiêu?
- **Mistakes recurred:** có mistake nào lặp lại không? (target: 0)
- **Layer coverage:** có layer nào chưa bao giờ được engineer không? (target: cân bằng)
- **Time saved:** thời gian fix mistakes (ước lượng) — nếu loop work, con số giảm

→ Quay lại [`HARNESS.md`](../HARNESS.md) hoặc đọc tiếp [`04-multi-agent-patterns.md`](04-multi-agent-patterns.md).
