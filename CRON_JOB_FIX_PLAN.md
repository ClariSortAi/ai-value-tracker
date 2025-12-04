# Comprehensive Cron Job Fix Plan

## 🔍 Problem Analysis

### Current Symptoms
- Cron jobs don't execute when manually triggered from Vercel Dashboard
- No logs showing cron job execution attempts
- Routes return 401 Unauthorized when accessed

### Root Cause Analysis

#### Issue #1: Authentication Logic Flaw
**Location:** `src/app/api/scrape/route.ts` and `src/app/api/score/route.ts`

**Problem:**
```typescript
const isAuthorized = isVercelCron || (process.env.CRON_SECRET && authHeader === `Bearer ${process.env.CRON_SECRET}`);
```

**Flaw:** If `CRON_SECRET` is NOT set in Vercel environment variables, the condition `process.env.CRON_SECRET && ...` evaluates to `false`, making manual triggers impossible even with correct header.

**Impact:** 
- Manual triggers from Vercel Dashboard fail (no `x-vercel-cron` header, and `CRON_SECRET` check fails)
- Scheduled cron jobs might work IF `x-vercel-cron` header is sent correctly

#### Issue #2: Missing Dynamic Route Configuration
**Location:** Both route files

**Problem:** Next.js App Router may cache route handlers, preventing cron jobs from executing fresh code.

**Impact:** Cron jobs might execute cached/stale versions of the code.

#### Issue #3: Manual Trigger Header Mismatch
**Problem:** Vercel Dashboard "Run Now" button may not send `x-vercel-cron: 1` header - it might send different headers or no special header at all.

**Impact:** Manual triggers fail authentication.

#### Issue #4: Environment Variable Verification
**Problem:** `CRON_SECRET` might not be set in Vercel, or might be set incorrectly.

**Impact:** Authentication fails silently.

---

## 📋 Complete Fix Plan

### Phase 1: Fix Authentication Logic (CRITICAL)

**File:** `src/app/api/scrape/route.ts` and `src/app/api/score/route.ts`

**Changes:**
1. Make authentication more permissive for development/testing
2. Add better logging to debug authentication issues
3. Support multiple authentication methods:
   - Vercel Cron header (`x-vercel-cron: 1`)
   - Manual trigger with `CRON_SECRET` (if set)
   - Development mode (no auth required if `NODE_ENV !== 'production'`)

**New Logic:**
```typescript
// Check if this is a Vercel Cron request
const isVercelCron = request.headers.get("x-vercel-cron") === "1";

// Check for manual trigger with CRON_SECRET
const authHeader = request.headers.get("authorization");
const hasValidSecret = process.env.CRON_SECRET 
  ? authHeader === `Bearer ${process.env.CRON_SECRET}`
  : false;

// Allow in development without auth (for testing)
const isDevelopment = process.env.NODE_ENV !== "production";

// Authorize if: Vercel Cron OR valid secret OR development mode
const isAuthorized = isVercelCron || hasValidSecret || isDevelopment;

if (!isAuthorized) {
  console.error("Unauthorized cron attempt:", {
    hasVercelCronHeader: !!request.headers.get("x-vercel-cron"),
    hasAuthHeader: !!authHeader,
    hasCronSecret: !!process.env.CRON_SECRET,
    nodeEnv: process.env.NODE_ENV,
    allHeaders: Object.fromEntries(request.headers.entries())
  });
  return NextResponse.json({ 
    error: "Unauthorized",
    hint: "Set CRON_SECRET env var or use Vercel Cron"
  }, { status: 401 });
}
```

### Phase 2: Add Dynamic Route Configuration

**File:** Both route files

**Add at top level (after imports):**
```typescript
// Force dynamic execution - prevent caching
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
```

### Phase 3: Improve Error Handling & Logging

**Add comprehensive logging:**
```typescript
console.log("Cron job triggered:", {
  timestamp: new Date().toISOString(),
  isVercelCron,
  hasAuthHeader: !!authHeader,
  hasCronSecret: !!process.env.CRON_SECRET,
  nodeEnv: process.env.NODE_ENV,
  method: request.method,
  url: request.url
});
```

### Phase 4: Verify Vercel Configuration

**Check in Vercel Dashboard:**
1. Go to Project → Settings → Environment Variables
2. Verify `CRON_SECRET` is set for Production environment
3. If not set, either:
   - Set it to a random secure string
   - OR remove the requirement (use development mode logic)

**Check Cron Job Configuration:**
1. Go to Project → Settings → Cron Jobs
2. Verify cron jobs are listed:
   - `/api/scrape` - `0 6 * * 0` (Sundays 6 AM UTC)
   - `/api/score` - `0 8 * * 0` (Sundays 8 AM UTC)
3. Click "Run Now" to test - check logs immediately after

### Phase 5: Test Strategy

**Step 1: Test Locally (Development Mode)**
```powershell
# Should work without auth in dev mode
Invoke-RestMethod -Uri "http://localhost:3000/api/scrape" -Method GET
```

**Step 2: Test with CRON_SECRET**
```powershell
$headers = @{ "Authorization" = "Bearer YOUR_CRON_SECRET" }
Invoke-RestMethod -Uri "https://your-app.vercel.app/api/scrape" -Method GET -Headers $headers
```

**Step 3: Test Manual Trigger from Dashboard**
- Go to Vercel Dashboard → Project → Settings → Cron Jobs
- Click "Run Now" on `/api/scrape`
- Immediately check logs: `vercel logs YOUR_DEPLOYMENT_URL`

**Step 4: Verify Scheduled Execution**
- Wait for scheduled time OR
- Temporarily change schedule to `*/5 * * * *` (every 5 minutes) for testing
- Monitor logs during execution window

---

## 🛠️ Implementation Steps

### Step 1: Update Route Files

Apply the authentication fix to both:
- `src/app/api/scrape/route.ts`
- `src/app/api/score/route.ts`

### Step 2: Add Dynamic Configuration

Add `export const dynamic = 'force-dynamic'` to both route files.

### Step 3: Verify Environment Variables

Check Vercel Dashboard and ensure `CRON_SECRET` is set (or decide to make it optional).

### Step 4: Deploy and Test

1. Commit changes
2. Deploy to Vercel
3. Test manual trigger from dashboard
4. Check logs for authentication details
5. Verify execution

### Step 5: Monitor Scheduled Runs

After fix is deployed, wait for next scheduled run or temporarily adjust schedule for faster testing.

---

## 🔧 Alternative Solutions

### Option A: Remove Authentication Requirement
If cron jobs are only accessible via Vercel Cron (not public URLs), you could remove auth entirely:

```typescript
// Only check for Vercel Cron header
const isVercelCron = request.headers.get("x-vercel-cron") === "1";
if (!isVercelCron) {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}
```

**Pros:** Simpler, works with Vercel Cron
**Cons:** Manual testing requires Vercel Dashboard only

### Option B: Separate Endpoints
Create separate endpoints for manual testing:
- `/api/scrape` - Vercel Cron only (strict auth)
- `/api/scrape/manual` - Manual trigger (CRON_SECRET required)

**Pros:** Clear separation of concerns
**Cons:** More code to maintain

---

## 📊 Success Criteria

After implementing fixes:
- ✅ Manual trigger from Vercel Dashboard executes successfully
- ✅ Logs show authentication details for debugging
- ✅ Scheduled cron jobs execute at correct times
- ✅ No 401 errors for legitimate requests
- ✅ Development mode allows local testing without auth

---

## 🐛 Debugging Commands

```powershell
# Check recent logs
vercel logs YOUR_DEPLOYMENT_URL

# Check specific deployment
vercel inspect YOUR_DEPLOYMENT_URL

# Test endpoint manually
$headers = @{ "Authorization" = "Bearer YOUR_CRON_SECRET" }
Invoke-RestMethod -Uri "https://YOUR_APP.vercel.app/api/scrape" -Method GET -Headers $headers

# Check environment variables (via Vercel CLI)
vercel env ls
```

---

## 📝 Notes

- Vercel Cron sends `x-vercel-cron: 1` header automatically
- Manual triggers from Dashboard may or may not send this header (needs verification)
- `CRON_SECRET` is optional - can be used for manual testing
- Development mode bypasses auth for easier local testing

