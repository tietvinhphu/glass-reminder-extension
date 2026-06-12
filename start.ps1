# start.ps1 — Chạy mỗi sáng sau khi clone repo về máy mới
# Usage: .\start.ps1

$ProjectPath = "C:\Users\tiet.vinh-phu1\Downloads\glass-reminder-extension"
$RepoUrl     = "https://github.com/tietvinhphu/glass-reminder-extension.git"

Write-Host "`n=== Glass Reminder Extension — Morning Setup ===" -ForegroundColor Cyan

# Bước 1: Clone nếu chưa có, pull nếu đã có
if (-not (Test-Path $ProjectPath)) {
    Write-Host "`n[1/4] Cloning repo..." -ForegroundColor Yellow
    git clone $RepoUrl $ProjectPath
} else {
    Write-Host "`n[1/4] Repo da ton tai — pulling latest..." -ForegroundColor Yellow
    Set-Location $ProjectPath
    git pull origin main
}

Set-Location $ProjectPath

# Bước 2: Cài dependencies
Write-Host "`n[2/4] Installing dependencies (npm install)..." -ForegroundColor Yellow
npm install

# Bước 3: WXT prepare (tạo .wxt/ type definitions)
Write-Host "`n[3/4] Preparing WXT types..." -ForegroundColor Yellow
npx wxt prepare

# Bước 4: Kiểm tra nhanh
Write-Host "`n[4/4] Quick check..." -ForegroundColor Yellow
npm run type-check

Write-Host "`n=== Setup xong! ===" -ForegroundColor Green
Write-Host "Chay dev:   npm run dev" -ForegroundColor White
Write-Host "Chay test:  npm test" -ForegroundColor White
Write-Host "Build:      npm run build" -ForegroundColor White
Write-Host ""
