# Neon Database Access Reference

## Quick Reference

| Item | Value |
|------|-------|
| Database | `neondb` |
| User | `neondb_owner` |
| Password | `npg_On85abylCRAN` |
| Host (pooled) | `ep-billowing-dawn-ahiq8yu1-pooler.c-3.us-east-1.aws.neon.tech` |
| Host (direct) | `ep-billowing-dawn-ahiq8yu1.c-3.us-east-1.aws.neon.tech` |
| REST API | `https://ep-billowing-dawn-ahiq8yu1.apirest.c-3.us-east-1.aws.neon.tech/neondb/rest/v1` |

---

## Method 1: Direct PostgreSQL Connection (psql)

Use for interactive queries and debugging:

```bash
# Pooled connection (recommended for most uses)
psql "postgresql://neondb_owner:npg_On85abylCRAN@ep-billowing-dawn-ahiq8yu1-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require"

# Direct connection (for migrations, schema changes)
psql "postgresql://neondb_owner:npg_On85abylCRAN@ep-billowing-dawn-ahiq8yu1.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require"
```

### Common Queries

```sql
-- Count all products
SELECT COUNT(*) FROM "Product";

-- List products with their sources
SELECT name, source, "targetAudience", "productType", "viabilityScore" 
FROM "Product" 
ORDER BY "createdAt" DESC 
LIMIT 20;

-- Check product quality breakdown
SELECT source, COUNT(*) as count, AVG("viabilityScore") as avg_viability
FROM "Product"
GROUP BY source;

-- Find products by audience type
SELECT name, category, "targetAudience" 
FROM "Product" 
WHERE "targetAudience" = 'b2b';

-- View scores for a product
SELECT p.name, s."compositeScore", s.confidence, s."functionalCoverage", s.usability
FROM "Product" p
JOIN "Score" s ON p.id = s."productId"
ORDER BY s."compositeScore" DESC
LIMIT 10;
```

---

## Method 2: Neon HTTP Data API (REST)

Use for programmatic access via HTTP requests (useful in Cursor terminal):

### Base URL
```
https://ep-billowing-dawn-ahiq8yu1.apirest.c-3.us-east-1.aws.neon.tech/neondb/rest/v1
```

### Authentication
Use the database password as a Bearer token:
```
Authorization: Bearer npg_On85abylCRAN
```

### Example: Run SQL Query via curl

```powershell
# PowerShell - Query products
$headers = @{
    "Authorization" = "Bearer npg_On85abylCRAN"
    "Content-Type" = "application/json"
}
$body = @{
    "query" = "SELECT name, source, category FROM \"Product\" LIMIT 10"
} | ConvertTo-Json

Invoke-RestMethod -Uri "https://ep-billowing-dawn-ahiq8yu1.apirest.c-3.us-east-1.aws.neon.tech/neondb/rest/v1/sql" -Method POST -Headers $headers -Body $body
```

```bash
# Bash/curl - Query products
curl -X POST "https://ep-billowing-dawn-ahiq8yu1.apirest.c-3.us-east-1.aws.neon.tech/neondb/rest/v1/sql" \
  -H "Authorization: Bearer npg_On85abylCRAN" \
  -H "Content-Type: application/json" \
  -d '{"query": "SELECT name, source, category FROM \"Product\" LIMIT 10"}'
```

### Useful REST API Queries

```powershell
# Count products by source
$body = @{ "query" = "SELECT source, COUNT(*) FROM \"Product\" GROUP BY source" } | ConvertTo-Json
Invoke-RestMethod -Uri "https://ep-billowing-dawn-ahiq8yu1.apirest.c-3.us-east-1.aws.neon.tech/neondb/rest/v1/sql" -Method POST -Headers $headers -Body $body

# Get latest products
$body = @{ "query" = "SELECT name, source, \"createdAt\" FROM \"Product\" ORDER BY \"createdAt\" DESC LIMIT 5" } | ConvertTo-Json
Invoke-RestMethod -Uri "https://ep-billowing-dawn-ahiq8yu1.apirest.c-3.us-east-1.aws.neon.tech/neondb/rest/v1/sql" -Method POST -Headers $headers -Body $body

# Check viability distribution
$body = @{ "query" = "SELECT \"targetAudience\", \"productType\", COUNT(*) FROM \"Product\" GROUP BY \"targetAudience\", \"productType\"" } | ConvertTo-Json
Invoke-RestMethod -Uri "https://ep-billowing-dawn-ahiq8yu1.apirest.c-3.us-east-1.aws.neon.tech/neondb/rest/v1/sql" -Method POST -Headers $headers -Body $body
```

---

## Method 3: Prisma Studio (GUI)

For visual database exploration:

```bash
cd ai-value-tracker
# Set DATABASE_URL first (copy from neon.md)
$env:DATABASE_URL="postgresql://neondb_owner:npg_On85abylCRAN@ep-billowing-dawn-ahiq8yu1-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require"
npx prisma studio
```

Opens a web GUI at `http://localhost:5555` to browse/edit data.

---

## Local Development Setup

To run the app locally with database access:

```powershell
cd ai-value-tracker

# Create .env file with database URL
@"
DATABASE_URL=postgresql://neondb_owner:npg_On85abylCRAN@ep-billowing-dawn-ahiq8yu1-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require
"@ | Out-File -FilePath .env -Encoding utf8

# Generate Prisma client
npx prisma generate

# Run migrations (if schema changed)
npx prisma migrate deploy

# Seed the database
npx prisma db seed

# Start dev server
npm run dev
```

---

## Neon Auth API (Separate from Data API)

The `neon_DB_API.md` file documents the **Neon Auth management API** (for Stack Auth integration), NOT direct database queries. Use this for:

- Managing OAuth providers
- Creating/deleting auth users
- Managing redirect URI whitelists
- Email server configuration

Requires a **Neon API Key** (different from database password). Get from Neon Console → Settings → API Keys.

```bash
# Example: List auth integrations
curl -H "Authorization: Bearer $NEON_API_KEY" \
  "https://console.neon.tech/api/v2/projects/{project_id}/auth/integrations"
```

---

## Files Reference

| File | Purpose |
|------|---------|
| `neon.md` | Database connection strings and credentials |
| `neon_api_endpoint.txt` | REST API base URL |
| `neon_auth.json` | User profile from Neon Auth (not API credentials) |
| `neon_DB_API.md` | Neon Auth management API docs (not data queries) |
| `keys.md` | API keys for external services (Product Hunt, Gemini, GitHub) |

