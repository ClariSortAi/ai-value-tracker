@echo off
echo === AIValue Deployment ===
echo.

echo [1/4] Checking Git status...
git status --short
echo.

echo [2/4] Adding GitHub remote...
git remote add origin https://github.com/ClariSortAi/ai-value-tracker.git 2>nul || echo Remote may already exist
git remote -v
echo.

echo [3/4] Pushing to GitHub...
git push -u origin main
echo.

echo [4/4] Deploying to Vercel...
echo Run: npx vercel --prod
npx vercel --prod
echo.

echo === Next Steps ===
echo 1. Add environment variables in Vercel Dashboard
echo 2. See DEPLOYMENT.md for details
echo.

pause

