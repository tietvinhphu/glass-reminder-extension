# Memory Index

> Đây là "bộ não" của Claude cho project này.
> Được lưu trong GitHub — tồn tại xuyên suốt mọi session dù máy bị xóa dữ liệu.
> Tự động sync sau mỗi task qua Stop hook.

- [User Profile](user_profile.md) — Solo founder học qua AI, workflow Cursor Agent → VSCode → GitHub
- [Project Status](project_status.md) — Checkpoint 3 tiếp theo: CalendarView + Google Calendar API v3
- [Code Style Rules](feedback_code_style.md) — Comment tiếng Việt bắt buộc, TypeScript strict, security rules
- [Skills Installed](reference_skills.md) — find-skills, google-calendar, vitest-testing đã cài vào .agents/skills/
- [Harness Framework](reference_harness_framework.md) — Harness Engineering framework: 7 layers, mistake loop, templates, custom skills
- [Session Log 16/06/2026](session_log_2026-06-16.md) — Tóm tắt session 16/06: bootstrap framework + landing page + subagent patterns
- [Push Restriction](feedback_push_restriction.md) — Auto mode block push lên main, phải để user push manually
- [Subagent Patterns](reference_subagent_patterns.md) — 3 patterns tổ chức subagent + 6 subagents adapt từ mrgoonie
- [Audit Findings 21/06/2026](audit_2026-06-21.md) — Findings từ claude-md-improver audit 21/06: 4 file có drift version, MEMORY.md có entry trỏ tới file ma
- [WXT/Vite Prepare Gotcha](wxt-vite-prepare-gotcha.md) — `tsc --noEmit` pass KHÔNG đảm bảo `wxt prepare` pass. ViteNodeRunner dùng context riêng. Bắt buộc chạy quality gate script sau config change