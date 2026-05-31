# Run this script once to install dependencies and seed the database
# Open PowerShell in this folder and run: .\setup.ps1

Write-Host "Checking Node.js..." -ForegroundColor Cyan
$node = Get-Command node -ErrorAction SilentlyContinue
if (-not $node) {
    Write-Host "Node.js not found. Please install it from https://nodejs.org (LTS version)" -ForegroundColor Red
    Write-Host "After installing, re-open this terminal and run .\setup.ps1 again."
    exit 1
}

Write-Host "Node $(node --version) found." -ForegroundColor Green

Write-Host "Installing dependencies..." -ForegroundColor Cyan
npm install
if ($LASTEXITCODE -ne 0) { Write-Host "npm install failed." -ForegroundColor Red; exit 1 }

Write-Host "Creating database..." -ForegroundColor Cyan
npx prisma db push
if ($LASTEXITCODE -ne 0) { Write-Host "prisma db push failed." -ForegroundColor Red; exit 1 }

Write-Host "Seeding sample data..." -ForegroundColor Cyan
npx tsx prisma/seed.ts
if ($LASTEXITCODE -ne 0) { Write-Host "Seed failed." -ForegroundColor Red; exit 1 }

Write-Host ""
Write-Host "Setup complete!" -ForegroundColor Green
Write-Host "Run 'npm run dev' to start the app."
Write-Host "Admin login: admin@rsvp.local / admin123"
Write-Host "RSVP sample: http://localhost:3000/rsvp/sarah-and-john-2026"
