# AI Value Tracker

A transparent, evidence-based scoring system to discover and evaluate AI products. Cut through the noise of daily AI launches and find solutions that deliver real value.

![AI Value Tracker](https://img.shields.io/badge/Next.js-15-black?style=flat-square&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=flat-square&logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-38B2AC?style=flat-square&logo=tailwind-css)
![Prisma](https://img.shields.io/badge/Prisma-5-2D3748?style=flat-square&logo=prisma)

## Features

- **Multi-Source Data Collection**: Aggregates AI products from Product Hunt, GitHub, Hacker News, There's An AI, and Hugging Face
- **AI-Powered Scoring**: Uses Google Gemini to evaluate products across 6 key categories
- **Transparent Methodology**: Based on ISO/IEC 25010 and industry best practices
- **Beautiful UI**: Apple/OpenAI-grade design with glassmorphism, animations, and dark mode
- **Compare Products**: Side-by-side comparison tool
- **Free to Run**: Designed for Vercel free tier with SQLite/Neon Postgres

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
- **Styling**: Tailwind CSS v4 + Framer Motion
- **Database**: SQLite (dev) / Neon Postgres (prod)
- **ORM**: Prisma 5
- **AI**: Google Gemini 1.5 Flash
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
# Database (SQLite for local dev)
DATABASE_URL="file:./prisma/dev.db"

# Google Gemini API (optional for dev - uses fallback scoring)
GEMINI_API_KEY="your-gemini-api-key"

# Product Hunt API (optional - uses demo data if not set)
PRODUCT_HUNT_API_TOKEN="your-product-hunt-token"

# GitHub API (optional - improves rate limits)
GITHUB_TOKEN="your-github-token"

# Cron job protection (for production)
CRON_SECRET="your-secret-key"
```

### Database Commands

```bash
npm run db:push      # Push schema to database
npm run db:seed      # Seed with demo products
npm run db:studio    # Open Prisma Studio
npm run db:reset     # Reset and reseed database
```

## Project Structure

```
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── products/     # Products REST API
│   │   │   ├── scrape/       # Scraping cron endpoint
│   │   │   └── score/        # Scoring cron endpoint
│   │   ├── products/         # Products list & detail pages
│   │   ├── compare/          # Comparison tool
│   │   ├── about/            # Methodology page
│   │   └── page.tsx          # Landing page
│   ├── components/
│   │   ├── ui/               # Base UI components
│   │   ├── product-card.tsx  # Product card component
│   │   ├── score-badge.tsx   # Score visualization
│   │   └── score-radar.tsx   # Radar chart component
│   └── lib/
│       ├── scrapers/         # Data source scrapers
│       ├── ai/               # Gemini scoring logic
│       ├── db.ts             # Prisma client
│       └── utils.ts          # Utility functions
├── prisma/
│   ├── schema.prisma         # Database schema
│   └── seed.ts               # Seed script
└── vercel.json               # Vercel cron configuration
```

## Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Import to Vercel
3. Add environment variables:
   - `DATABASE_URL` - Neon Postgres connection string
   - `GEMINI_API_KEY` - Google Gemini API key
   - `CRON_SECRET` - Secret for cron job authentication
4. Deploy!

### Production Database (Neon)

1. Create a free Neon project at [neon.tech](https://neon.tech)
2. Update `prisma/schema.prisma`:
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```
3. Update environment variables with Neon connection string

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/products` | GET | List products with filters |
| `/api/products/[slug]` | GET | Get product details |
| `/api/scrape` | GET/POST | Trigger scraping job |
| `/api/score` | GET | Score pending products |
| `/api/score` | POST | Score specific product |

## Cron Jobs

Configured in `vercel.json`:

- **Scraping**: Every 12 hours
- **Scoring**: Daily at 1 AM UTC

## Contributing

Contributions are welcome! Please read our contributing guidelines first.

## License

MIT License - feel free to use this project for any purpose.

## Acknowledgments

- Methodology based on [ISO/IEC 25010](https://www.iso.org/standard/35733.html)
- Design inspired by Apple and OpenAI
- Built with [Next.js](https://nextjs.org), [Tailwind CSS](https://tailwindcss.com), and [Vercel](https://vercel.com)
