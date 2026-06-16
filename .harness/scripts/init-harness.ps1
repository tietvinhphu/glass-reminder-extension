# Khởi tạo project mới từ Harness Framework templates (Windows)
# Usage: .\init-harness.ps1 -ProjectName "my-app" -Stack "Next.js" -Purpose "SaaS dashboard" [-DeployTarget "Vercel"]

param(
  [Parameter(Mandatory = $true)][string]$ProjectName,
  [Parameter(Mandatory = $true)][string]$Stack,
  [Parameter(Mandatory = $true)][string]$Purpose,
  [string]$DeployTarget = "Vercel"
)

$ErrorActionPreference = "Continue"
$Date = Get-Date -Format "yyyy-MM-dd"
$UUID = [guid]::NewGuid().ToString()

# Determine source directory (work khi chay qua powershell -File hoac dot-source)
$ScriptDir = if ($PSCommandPath) { Split-Path -Parent $PSCommandPath } else { Split-Path -Parent $MyInvocation.MyCommand.Path }
$HarnessRoot = Split-Path -Parent $ScriptDir

# Determine target directory
$TargetDir = Join-Path (Get-Location) $ProjectName

if (Test-Path $TargetDir) {
  Write-Host "Directory $ProjectName da ton tai" -ForegroundColor Red
  exit 1
}

Write-Host "Bootstrapping $ProjectName tu Harness Framework..." -ForegroundColor Cyan
Write-Host "   Stack: $Stack"
Write-Host "   Purpose: $Purpose"
Write-Host "   Deploy: $DeployTarget"
Write-Host ""

# 1. Tao thu muc + git init
New-Item -ItemType Directory -Path $TargetDir -Force | Out-Null
Push-Location $TargetDir

# Suppress errors tu git neu moi truong chua config user (test mode)
git init 2>$null | Out-Null

# 2. Copy + substitute templates
$Templates = @(
  @{Src = "CLAUDE.template.md"; Dst = "CLAUDE.md" },
  @{Src = "AGENTS.template.md"; Dst = "AGENTS.md" },
  @{Src = "INSTRUCTIONS.template.md"; Dst = "INSTRUCTIONS.md" },
  @{Src = ".cursorrules.template"; Dst = ".cursorrules" },
  @{Src = "settings.template.json"; Dst = ".claude\settings.json" },
  @{Src = "MEMORY.template.md"; Dst = "memory\MEMORY.md" },
  @{Src = "mistake-log.template.json"; Dst = ".harness\mistakes\template.json" },
  @{Src = "sync-memory.template.sh"; Dst = ".claude\hooks\sync-memory.sh" },
  @{Src = "sync-memory.template.ps1"; Dst = ".claude\hooks\sync-memory.ps1" }
)

foreach ($tpl in $Templates) {
  $src = Join-Path "$HarnessRoot\templates" $tpl.Src
  $dest = Join-Path (Get-Location) $tpl.Dst
  $destDir = Split-Path -Parent $dest
  if (-not (Test-Path $destDir)) {
    New-Item -ItemType Directory -Path $destDir -Force | Out-Null
  }
  if (-not (Test-Path $src)) {
    Write-Host "  Template khong ton tai: $src" -ForegroundColor Yellow
    continue
  }
  $content = Get-Content $src -Raw
  $content = $content -replace "\{\{PROJECT_NAME\}\}", $ProjectName
  $content = $content -replace "\{\{STACK\}\}", $Stack
  $content = $content -replace "\{\{PURPOSE\}\}", $Purpose
  $content = $content -replace "\{\{DEPLOY_TARGET\}\}", $DeployTarget
  $content = $content -replace "\{\{DATE\}\}", $Date
  $content = $content -replace "\{\{UUID\}\}", $UUID
  $Utf8NoBom = New-Object System.Text.UTF8Encoding $False
  [System.IO.File]::WriteAllText($dest, $content, $Utf8NoBom)
  Write-Host "  OK $($tpl.Dst)" -ForegroundColor Green
}

# 3. Copy mistake log example vao .harness/mistakes/
$MistakesTarget = Join-Path (Get-Location) ".harness\mistakes"
if (-not (Test-Path $MistakesTarget)) {
  New-Item -ItemType Directory -Path $MistakesTarget -Force | Out-Null
}
if (Test-Path "$HarnessRoot\mistakes") {
  Copy-Item -Path "$HarnessRoot\mistakes\*" -Destination $MistakesTarget -Recurse -Force
}

# 4. First commit (khong fail neu chua config git user - user se tu fix)
git add -A 2>$null | Out-Null
try {
  git commit -m "chore: bootstrap $ProjectName from harness framework v1.0" 2>&1 | Out-Null
} catch {
  Write-Host "  First commit skipped (chua config git user? chay: git config user.name 'Anh' && git config user.email 'anh@example.com')" -ForegroundColor Yellow
}

Pop-Location

Write-Host ""
Write-Host "Project $ProjectName da duoc bootstrap thanh cong!" -ForegroundColor Green
Write-Host "Location: $TargetDir"
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "   cd $ProjectName"
Write-Host "   code ."
Write-Host ""
