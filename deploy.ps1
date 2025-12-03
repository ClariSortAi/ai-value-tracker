# AIValue Deployment Script
Write-Host "=== AIValue Deployment ===" -ForegroundColor Cyan

# Step 1: Verify Git status
Write-Host "`n[1/5] Checking Git status..." -ForegroundColor Yellow
$status = git status --short
if ($status) {
    Write-Host "⚠️  Uncommitted changes detected:" -ForegroundColor Red
    Write-Host $status
    $response = Read-Host "Commit these changes? (y/n)"
    if ($response -eq "y") {
        git add .
        git commit -m "chore: Pre-deployment changes"
    }
}

# Step 2: Check for GitHub remote
Write-Host "`n[2/5] Checking GitHub remote..." -ForegroundColor Yellow
$remote = git remote get-url origin 2>$null
if (-not $remote) {
    Write-Host "❌ No GitHub remote found" -ForegroundColor Red
    Write-Host "`nPlease create a GitHub repo and run:" -ForegroundColor Yellow
    Write-Host "  git remote add origin https://github.com/YOUR_USERNAME/ai-value-tracker.git" -ForegroundColor White
    Write-Host "  git push -u origin main" -ForegroundColor White
    exit 1
} else {
    Write-Host "✅ Remote found: $remote" -ForegroundColor Green
}

# Step 3: Push to GitHub
Write-Host "`n[3/5] Pushing to GitHub..." -ForegroundColor Yellow
git push -u origin main
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Push failed" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Pushed to GitHub" -ForegroundColor Green

# Step 4: Deploy to Vercel
Write-Host "`n[4/5] Deploying to Vercel..." -ForegroundColor Yellow
Write-Host "Running: npx vercel --prod" -ForegroundColor Gray
npx vercel --prod --yes

# Step 5: Set environment variables
Write-Host "`n[5/5] Environment variables needed in Vercel:" -ForegroundColor Yellow
Write-Host @"
DATABASE_URL=postgresql://user:password@host:port/database?sslmode=require
PRODUCT_HUNT_TOKEN=your-product-hunt-token
GEMINI_API_KEY=your-gemini-api-key
GITHUB_TOKEN=your-github-token
CRON_SECRET=your-cron-secret
"@ -ForegroundColor White

Write-Host "`n✅ Deployment complete!" -ForegroundColor Green
Write-Host "Add environment variables in Vercel Dashboard → Settings → Environment Variables" -ForegroundColor Yellow

