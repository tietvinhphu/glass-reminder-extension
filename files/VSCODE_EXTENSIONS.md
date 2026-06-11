# VSCode Extensions — Glass Reminder Extension
> Recommended extensions cho dev workflow: Edge extension + React + TypeScript + TDD

---

## ✅ Extensions anh đề xuất — Đánh giá

| Extension | Phù hợp? | Lý do |
|-----------|----------|-------|
| **Auto Rename Tag** | ✅ Giữ | Đổi tên JSX tag tự động — cần thiết cho React |
| **ESLint** | ✅ Giữ | Bắt buộc — enforce code standards trong spec |
| **Flake8** | ❌ Bỏ | Python-only linter — project này không có Python |
| **Prettier** | ✅ Giữ | Bắt buộc — format code nhất quán |

**Thay Flake8 bằng:** SonarLint (xem bên dưới)

---

## 🔧 Extensions bắt buộc thêm vào

### Code Quality & Security
```
SonarLint
  ID: SonarSource.sonarlint-vscode
  Lý do: TypeScript security analysis, detect SQL injection, XSS, hardcoded secrets
  → Thay thế Flake8 cho TypeScript/React

Error Lens
  ID: usernamehw.errorlens
  Lý do: Hiển thị ESLint errors + TypeScript errors ngay inline trên dòng code
  → Không cần hover mới thấy lỗi, developer experience tốt hơn nhiều
```

### TypeScript & React
```
TypeScript Importer
  ID: pmneo.tsimporter
  Lý do: Auto-import TypeScript modules, đúng với import ordering trong spec

Pretty TypeScript Errors
  ID: yoavbls.pretty-ts-errors
  Lý do: Làm TypeScript error messages dễ đọc hơn (TS errors mặc định rất khó hiểu)
```

### Styling (Tailwind CSS v4)
```
Tailwind CSS IntelliSense
  ID: bradlc.vscode-tailwindcss
  Lý do: Autocomplete + lint Tailwind classes — BẮT BUỘC khi dùng Tailwind v4
```

### Testing (TDD workflow)
```
Vitest
  ID: vitest.explorer
  Lý do: Chạy/xem test results ngay trong VSCode sidebar
         Thấy 🔴 Red / 🟢 Green trực quan mà không cần terminal

Coverage Gutters
  ID: ryanluker.vscode-coverage-gutters
  Lý do: Hiển thị test coverage ngay trên từng dòng code (xanh = covered, đỏ = not covered)
         Biết ngay chỗ nào chưa có test
```

### Git & Branch Workflow
```
GitLens
  ID: eamodio.gitlens
  Lý do: Xem blame, branch history, PR review ngay trong VSCode
         Hỗ trợ GitHub Flow (feat branches → main)

GitHub Pull Requests
  ID: GitHub.vscode-pull-request-github
  Lý do: Review PR trực tiếp trong VSCode, không cần mở browser
```

### API Development
```
Thunder Client
  ID: rangav.vscode-thunder-client
  Lý do: Test Google Calendar API calls trực tiếp trong VSCode (nhẹ hơn Postman)
         Dùng để verify API response trước khi viết code
```

### Browser Extension Development
```
WXT DevTools (nếu có)
  ID: Kiểm tra marketplace — WXT chưa có official extension
  Thay thế: Dùng Edge DevTools built-in

Edge DevTools for VS Code
  ID: ms-edgedevtools.vscode-edge-devtools
  Lý do: Debug extension trực tiếp trong VSCode thay vì mở DevTools trong Edge
         Xem network requests, console, DOM của popup extension
```

---

## 📦 File extensions.json cho repo

Tạo file `.vscode/extensions.json` trong repo để VSCode tự suggest khi team member clone:

```json
{
  "recommendations": [
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "formulahendry.auto-rename-tag",
    "bradlc.vscode-tailwindcss",
    "SonarSource.sonarlint-vscode",
    "usernamehw.errorlens",
    "yoavbls.pretty-ts-errors",
    "vitest.explorer",
    "ryanluker.vscode-coverage-gutters",
    "eamodio.gitlens",
    "GitHub.vscode-pull-request-github",
    "rangav.vscode-thunder-client",
    "ms-edgedevtools.vscode-edge-devtools",
    "pmneo.tsimporter"
  ],
  "unwantedRecommendations": [
    "ms-python.flake8"
  ]
}
```

---

## ⚙️ VSCode Settings cho project

Tạo file `.vscode/settings.json`:

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": "explicit"
  },
  "typescript.tsdk": "node_modules/typescript/lib",
  "typescript.enablePromptUseWorkspaceTsdk": true,
  "tailwindCSS.experimental.classRegex": [
    ["clsx\\(([^)]*)\\)", "(?:'|\"|`)([^']*)(?:'|\"|`)"],
    ["cn\\(([^)]*)\\)", "(?:'|\"|`)([^']*)(?:'|\"|`)"]
  ],
  "vitest.enable": true,
  "coverage-gutters.showGutterCoverage": true,
  "sonarlint.rules": {
    "typescript:S2068": { "level": "on" },
    "typescript:S5122": { "level": "on" }
  },
  "files.associations": {
    "*.css": "tailwindcss"
  }
}
```

---

## 🔍 Tóm tắt theo tiêu chí spec

| Tiêu chí từ spec | Extension đảm bảo |
|-----------------|-------------------|
| Code security (no hardcoded secrets, XSS) | SonarLint |
| Clean code (lint, format) | ESLint + Prettier + Error Lens |
| TypeScript strict | Pretty TS Errors + TypeScript Importer |
| TDD Red/Green visible | Vitest + Coverage Gutters |
| Tailwind v4 | Tailwind CSS IntelliSense |
| Branch/PR workflow | GitLens + GitHub Pull Requests |
| Edge debugging | Edge DevTools for VS Code |
| API testing | Thunder Client |
| JSX auto-rename | Auto Rename Tag |
