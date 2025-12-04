# Deployment Guide

## ✅ Pre-Deployment Checklist

All API keys have been validated:
- ✅ GitHub Token: Valid (ClariSortAi)
- ✅ Product Hunt Token: Valid (fetched posts)
- ✅ Gemini API Key: Valid (models accessible)
- ✅ Neon Database: Valid (tables created)

## Step 1: Create GitHub Repository

If not already created, run:

```powershell
# Create repo via GitHub API
$headers = @{
    Authorization="Bearer YOUR_GITHUB_TOKEN"
    "Accept"="application/vnd.github.v3+json"
}
$body = @{
    name="ai-value-tracker"
    description="AI tool discovery platform with automated scoring"
    private=$false
} | ConvertTo-Json

Invoke-RestMethod -Uri "https://api.github.com/user/repos" -Method POST -Headers $headers -Body $body
```

Or create manually at: https://github.com/new

## Step 2: Push to GitHub

```powershell
# Add remote (if not already added)
git remote add origin https://github.com/ClariSortAi/ai-value-tracker.git

# Push code
git push -u origin main
```

## Step 3: Deploy to Vercel

### Option A: Via Vercel CLI

```powershell
# Install Vercel CLI (if not installed)
npm install -g vercel

# Login to Vercel
vercel login

# Deploy
vercel --prod
```

### Option B: Via Vercel Dashboard

1. Go to https://vercel.com/new
2. Import repository: `ClariSortAi/ai-value-tracker`
3. Configure project:
   - Framework Preset: Next.js
   - Root Directory: `./`
   - Build Command: `npm run build`
   - Output Directory: `.next`
4. Add Environment Variables (see below)
5. Deploy!

## Step 4: Environment Variables

Add these in Vercel Dashboard → Settings → Environment Variables:

```
DATABASE_URL=postgresql://user:password@host:port/database?sslmode=require
PRODUCT_HUNT_TOKEN=your-product-hunt-token
GEMINI_API_KEY=your-gemini-api-key
GITHUB_TOKEN=your-github-token
CRON_SECRET=your-cron-secret
# Optional: if Deployment Protection is on
VERCEL_AUTOMATION_BYPASS_SECRET=your-bypass-token
```

**Important:** Set these for **Production**, **Preview**, and **Development** environments.

## Step 5: Verify Cron Jobs

After deployment, cron jobs will run:
- **Scrape**: Sunday 06:00 UTC (`/api/scrape`)
- **Score**: Sunday 08:00 UTC (`/api/score`)

You can manually trigger them:
```bash
curl -X POST https://your-app.vercel.app/api/scrape
curl -X POST https://your-app.vercel.app/api/score
```

Or use the server-side trigger:
```bash
curl -X POST https://your-app.vercel.app/api/admin/run \
  -H "Content-Type: application/json" \
  -d '{ "action": "scrape" }'
```

## Step 6: First Scrape

Once deployed, trigger the first scrape:

```bash
# Via curl
curl -X POST https://your-app.vercel.app/api/scrape

# Or via Vercel CLI
vercel env pull .env.local
# Then visit: https://your-app.vercel.app/api/scrape
```

## Troubleshooting

### Build Fails
- Ensure `DATABASE_URL` is set in Vercel
- Check build logs for Prisma errors
- Verify all dependencies in `package.json`

### Cron Jobs Not Running
- Check Vercel Dashboard → Settings → Cron Jobs
- Verify `CRON_SECRET` is set
- Check function logs in Vercel Dashboard

### Database Connection Issues
- Verify `DATABASE_URL` uses pooled connection (ends with `-pooler`)
- Check Neon dashboard for connection limits
- Ensure SSL mode is `require`

## Post-Deployment

1. ✅ Verify homepage loads
2. ✅ Check `/api/scrape` returns data
3. ✅ Verify products appear on homepage
4. ✅ Test role filtering
5. ✅ Test search functionality

---

**Ready to deploy!** 🚀

