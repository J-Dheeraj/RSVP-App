# Run this script once to install dependencies and set up the database.
# Open PowerShell in this folder and run: .\setup.ps1

Write-Host "Checking Node.js..." -ForegroundColor Cyan
$node = Get-Command node -ErrorAction SilentlyContinue
if (-not $node) {
    Write-Host "Node.js not found. Install from https://nodejs.org (LTS version)" -ForegroundColor Red
    Write-Host "After installing, re-open this terminal and run .\setup.ps1 again."
    exit 1
}
Write-Host "Node $(node --version) found." -ForegroundColor Green

# Copy .env if it doesn't exist
if (-not (Test-Path ".env")) {
    Copy-Item ".env.example" ".env"
    Write-Host ".env created from .env.example — edit it to set NEXTAUTH_SECRET before deploying." -ForegroundColor Yellow
}

Write-Host "Installing dependencies..." -ForegroundColor Cyan
npm install
if ($LASTEXITCODE -ne 0) { Write-Host "npm install failed." -ForegroundColor Red; exit 1 }

Write-Host "Creating database schema..." -ForegroundColor Cyan
npx prisma db push
if ($LASTEXITCODE -ne 0) { Write-Host "prisma db push failed." -ForegroundColor Red; exit 1 }

Write-Host "Seeding initial data..." -ForegroundColor Cyan
npx tsx prisma/seed.ts
if ($LASTEXITCODE -ne 0) { Write-Host "Seed failed." -ForegroundColor Red; exit 1 }

Write-Host ""
Write-Host "Setup complete!" -ForegroundColor Green
Write-Host "  Run:        npm run dev"
Write-Host "  Admin:      http://localhost:3000/admin/login"
Write-Host "  Email:      admin@royaltaj.sg"
Write-Host "  Password:   admin123"
Write-Host "  Sample RSVP: http://localhost:3000/rsvp/royal-taj-gala-2026"
Write-Host ""
Write-Host "Next: go to Settings -> enable MFA before going live." -ForegroundColor Yellow
