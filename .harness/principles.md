# 7 Nguyên tắc cốt lõi của Harness Engineering

> Mỗi nguyên tắc map sang 1 layer trong framework. Khi đưa ra quyết định, hỏi: "Nguyên tắc nào đang bị vi phạm?"

---

## P1. **Mistake → Engineer → Prevent** (Layer L1-L7)
> Mitchell Hashimoto: "Anytime you find an agent makes a mistake, you take the time to engineer a solution such that the agent never makes that mistake again."

**Áp dụng:**
- Mỗi lần agent sai, KHÔNG chỉ fix task đó
- Phải engineer giải pháp ở 1 trong 7 layers để ngăn tái diễn
- Log vào `.harness/mistakes/` (JSON, không Markdown)

**Test:** Sau 3 tháng, có mistake nào bị lặp lại không? Nếu có → layer đó chưa được engineer đúng.

---

## P2. **Model nghĩ, Harness quyết định** (Layer L4)
> Rohit Verma: "The model is what thinks. The harness is what it thinks about."

**Áp dụng:**
- Tách rạch ròi "model muốn làm gì" và "hệ thống cho phép làm gì"
- 40+ tools permission-gate riêng biệt (per Anthropic leak)
- 23 lớp validation cho bash commands
- Hooks reject action không được phép

**Test:** Có bao nhiêu action agent muốn làm mà bị hook reject? Nếu 0 → có thể thiếu guardrail.

---

## P3. **Giới hạn output thay vì để tràn** (Layer L3, L7)
> SWE-agent: search 50 kết quả, file viewer 100 dòng, compress sau 5 turns.

**Áp dụng:**
- Mỗi tool mới phải có "Goldilocks number" — vừa đủ, không thừa
- Working memory là tài nguyên quý → đừng lãng phí
- Batch writes thay vì loop (vd: storage limit 1800 writes/hour)

**Test:** Tool mới có enforce giới hạn output không? Nếu không → chưa sẵn sàng ship.

---

## P4. **JSON cho state, Markdown cho giải thích** (Layer L5)
> Anthropic: model ít tự ý sửa JSON vì cấu trúc cứng.

**Áp dụng:**
- Mistake log, feature list, config: JSON
- README, decisions, principles: Markdown
- State sống sót qua sessions phải ở JSON

**Test:** Có file state nào đang là Markdown mà nên là JSON không? Convert ngay.

---

## P5. **Auto-validate sau mỗi thay đổi** (Layer L4, L7)
> SWE-agent: editor tích hợp linter, reject nếu syntax error.

**Áp dụng:**
- PostToolUse hook: sau Write/Edit → auto-check (linter, comment, type)
- Fail fast — phát hiện lỗi sớm hơn là đuổi bug ma
- Không để agent "tuyên bố chiến thắng" khi chưa verify

**Test:** Mỗi lần edit code có trigger validation không? Có bao nhiêu lần agent phải sửa lại vì hook reject?

---

## P6. **Dùng tool rẻ nhất có thể** (Layer L3)
> Anthropic: "$0 regex thắng $0.01 model call khi accuracy tương đương."

**Áp dụng:**
- Pattern matching đơn giản → regex/bash
- Logic phức tạp nhưng deterministic → shell script
- Logic cần suy luận → LLM call (cuối cùng)

**Test:** Có chỗ nào đang dùng LLM call cho task mà regex xử lý được không? Replace ngay.

---

## P7. **Multi-agent theo vai, không theo tool** (Layer L6)
> Anthropic: Planner → Generator → Evaluator.

**Áp dụng:**
- Planner: think trước khi code (brainstorming, writing-plans skills)
- Generator: build theo sprint, mỗi session 1 feature (TDD)
- Evaluator: verify trước khi done (verification-before-completion)

**Test:** Session này đang ở vai nào? Có đang skip bước nào không?

---

## Tổng kết

7 nguyên tắc = 7 layers. Khi engineer mistake → check layer nào thiếu → apply fix tại layer đó. Khi layer đó đã engineer tốt → mistake sẽ không bao giờ lặp lại.

→ Quay lại [`HARNESS.md`](../HARNESS.md) để xem áp dụng cụ thể.
