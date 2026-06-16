# Auto-sync memory + agents skills lên GitHub sau mỗi session (Windows variant)
# Trigger: Claude Code Stop hook (.claude/settings.json)
# Usage: .\sync-memory.ps1 -ProjectDir "C:\path\to\project"

param(
  [Parameter(Mandatory)][string]$ProjectDir
)

Set-Location $ProjectDir
if ($LASTEXITCODE -ne 0) { exit 0 }

# Stage memory + agents config
git add memory/ .agents/ skills-lock.json .hintrc 2>$null

# Chỉ commit nếu có thay đổi
$diff = git diff --cached --quiet 2>&1
if ($LASTEXITCODE -ne 0) {
  $timestamp = Get-Date -Format "HH:mm dd/MM/yyyy"
  git commit -m "chore: auto-sync memory & skills [$timestamp]" 2>$null
  git push origin main 2>$null
}
