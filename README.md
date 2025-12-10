# AI Value Tracker

A transparent, evidence-based scoring system to discover and evaluate **commercial B2B AI SaaS products**. Cut through the noise of daily AI launches and find solutions that deliver real business value.

![AI Value Tracker](https://img.shields.io/badge/Next.js-15-black?style=flat-square&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=flat-square&logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-38B2AC?style=flat-square&logo=tailwind-css)
![Prisma](https://img.shields.io/badge/Prisma-5-2D3748?style=flat-square&logo=prisma)

## 🎯 Project Focus

This tracker focuses on **commercial B2B SaaS products** organized by business function:

| Category | Focus | Examples |
|----------|-------|----------|
| **Marketing** | Content, SEO, social, email | Jasper, Copy.ai, Surfer SEO |
| **Sales** | CRM, intelligence, outreach | Gong, Apollo.io, Outreach |
| **Customer Service** | Support, helpdesk, chatbots | Zendesk AI, Intercom, Freshdesk |
| **Productivity** | Meetings, workflows, docs | Otter.ai, Fireflies.ai, n8n |
| **Developer** | Code, APIs, DevOps | Cursor, v0 by Vercel |

**Open Source tools** (GitHub, Hugging Face) are displayed in a separate "Open Source Spotlight" section.

## ✅ Current Status (December 2024)

### Data Pipeline

| Source | Status | Output | Notes |
|--------|--------|--------|-------|
| **Product Hunt** | ✅ Working | Product table | Primary source, good quality |
| **Tavily Discovery** | ✅ Working | Product table | AI-powered commercial search |
| **FutureTools** | ⚠️ Demo data | Product table | 13 curated products, needs live scraping |
| **There's An AI** | ✅ Working | Product table | AI directory |
| **GitHub** | ✅ Working | OpenSourceTool | 10K+ star repos |
| **Hugging Face** | ✅ Working | OpenSourceTool | Popular Spaces |
| **Hacker News** | ✅ Working | Product table | Heavily filtered for quality |

### AI Gatekeeper

- ✅ Classifies products into `businessCategory` (marketing, sales, customer_service, productivity, developer, other)
- ✅ Detects commercial signals (pricing page, team page, terms of service)
- ✅ Rejects non-commercial items (blog posts, listicles, tutorials, libraries)
- ✅ Powered by Gemini AI

### Database State

- **29 Products** across all business categories
- **150 Open Source Tools** from GitHub + Hugging Face
- Categories populated: productivity (10), sales (6), customer_service (6), marketing (4), developer (2)

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        DATA SOURCES                              │
├─────────────────────────────────────────────────────────────────┤
│  Commercial SaaS                    │  Open Source               │
│  ├─ Product Hunt                    │  ├─ GitHub (10K+ stars)   │
│  ├─ Tavily Search API               │  └─ Hugging Face Spaces   │
│  ├─ FutureTools (demo)              │                            │
│  ├─ There's An AI                   │                            │
│  └─ Hacker News (filtered)          │                            │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      QUALITY PIPELINE                            │
├─────────────────────────────────────────────────────────────────┤
│  1. Rule-Based Filter (engagement, domains, keywords)            │
│  2. AI Gatekeeper (Gemini) - commercial viability + category     │
│  3. Quality Scoring (viability score 0-1)                        │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                        DATABASE                                  │
├─────────────────────────────────────────────────────────────────┤
│  Product Table              │  OpenSourceTool Table             │
│  ├─ businessCategory        │  ├─ likes, downloads              │
│  ├─ viabilityScore          │  ├─ source (GITHUB/HUGGING_FACE)  │
│  ├─ hasPricingPage          │  └─ viabilityScore                │
│  └─ source (PH/TAVILY/etc)  │                                    │
└─────────────────────────────────────────────────────────────────┘
```

## Scoring Categories

| Category | Weight | Description |
|----------|--------|-------------|
| Functional Coverage | 20% | Breadth of use cases and feature completeness |
| Usability | 20% | Ease of learning and using the product |
| Innovation | 20% | Uniqueness and novel capabilities |
| Pricing | 15% | Value for money and pricing transparency |
| Integration | 15% | API availability and ecosystem compatibility |
| Security | 10% | Data protection and compliance |

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4
- **Database**: Neon Postgres (production)
- **ORM**: Prisma 5
- **AI**: Google Gemini (gatekeeper + scoring)
- **Search**: Tavily API (commercial discovery)
- **Charts**: Recharts
- **Deployment**: Vercel

## Getting Started

### Prerequisites

- Node.js 18+
- npm or pnpm

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/ai-value-tracker.git
cd ai-value-tracker

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local

# Initialize the database
npm run db:push

# Seed with demo data
npm run db:seed

# Start development server
npm run dev
```

### Environment Variables

Create a `.env.local` file with:

```env
# Database (Neon PostgreSQL)
DATABASE_URL="postgresql://user:pass@host/db?sslmode=require"

# Google Gemini API (required for gatekeeper + scoring)
GEMINI_API_KEY="your-gemini-api-key"

# Tavily API (required for commercial discovery)
TAVILY_API_KEY="your-tavily-api-key"

# Product Hunt API (optional - improves results)
PRODUCT_HUNT_API_TOKEN="your-product-hunt-token"

# GitHub API (optional - improves rate limits)
GITHUB_TOKEN="your-github-token"

# Cron job protection (for production)
CRON_SECRET="your-secret-key"

# Optional: Vercel Deployment Protection bypass
VERCEL_AUTOMATION_BYPASS_SECRET="your-bypass-token"
```

### Database Commands

```bash
npm run db:push      # Push schema to database
npm run db:seed      # Seed with demo products
npm run db:studio    # Open Prisma Studio
npm run db:reset     # Reset and reseed database
```

### Running the Pipeline Locally

```bash
# Run full pipeline (scrape + assess)
npx tsx scripts/run-pipeline.ts

# Ensure env vars are set first
$env:DATABASE_URL = "your-connection-string"
$env:GEMINI_API_KEY = "your-key"
$env:TAVILY_API_KEY = "your-key"
```

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/products` | GET | List products with filters (businessCategory, role, search) |
| `/api/products/[slug]` | GET | Get product details |
| `/api/open-source` | GET | List open source tools |
| `/api/scrape` | GET/POST | Trigger scraping job |
| `/api/assess` | GET/POST | AI gatekeeper batch assessment |
| `/api/score` | GET/POST | Score pending products |
| `/api/admin/run` | POST | Server-side trigger for pipeline |

## Cron Jobs

Configured in `vercel.json`:

- **Scraping**: Sunday 06:00 UTC (`/api/scrape`)
- **Assessment**: Sunday 07:00 UTC (`/api/assess`)
- **Scoring**: Sunday 08:00 UTC (`/api/score`)

## 🗺️ Roadmap

See [ROADMAP.md](./ROADMAP.md) for the detailed development roadmap.

**Next priorities:**
1. Live FutureTools scraping (replace demo data)
2. G2/Capterra integration for review data
3. Enhanced enrichment with company data
4. User accounts and saved products

## Contributing

Contributions are welcome! Please read our contributing guidelines first.

## License

MIT License - feel free to use this project for any purpose.

## Acknowledgments

- Methodology based on [ISO/IEC 25010](https://www.iso.org/standard/35733.html)
- Commercial discovery powered by [Tavily](https://tavily.com)
- Built with [Next.js](https://nextjs.org), [Tailwind CSS](https://tailwindcss.com), and [Vercel](https://vercel.com)
