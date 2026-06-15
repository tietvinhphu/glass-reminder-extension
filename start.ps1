# start.ps1 - Chay moi sang sau khi clone repo ve may moi
# Usage: powershell -ExecutionPolicy Bypass -File .\start.ps1

$ProjectPath = "C:\Users\tiet.vinh-phu1\Downloads\glass-reminder-extension"
$RepoUrl     = "https://github.com/tietvinhphu/glass-reminder-extension.git"

Write-Host "=== Glass Reminder Extension - Morning Setup ===" -ForegroundColor Cyan

if (-not (Test-Path $ProjectPath)) {
    Write-Host "[1/4] Cloning repo..." -ForegroundColor Yellow
    git clone $RepoUrl $ProjectPath
    Set-Location $ProjectPath
} else {
    Write-Host "[1/4] Repo da ton tai - pulling latest..." -ForegroundColor Yellow
    Set-Location $ProjectPath
    git pull origin main
}

Write-Host "[2/4] Installing dependencies..." -ForegroundColor Yellow
npm install

Write-Host "[3/4] Preparing WXT types..." -ForegroundColor Yellow
npx wxt prepare

Write-Host "[4/4] Type check..." -ForegroundColor Yellow
npm run type-check

Write-Host "=== Setup xong! ===" -ForegroundColor Green
Write-Host "Chay dev:  npm run dev"
Write-Host "Chay test: npm test"
Write-Host "Build:     npm run build"
