# AI Value Tracker Roadmap

## Vision

Build the definitive discovery platform for **commercial B2B AI SaaS products**, helping business users find tools that solve real problems across marketing, sales, customer service, and productivity.

---

## Current State (December 2024)

### ✅ Completed

- **Multi-source scraping pipeline**: Product Hunt, GitHub, Hugging Face, Hacker News, There's An AI
- **Tavily commercial discovery**: AI-powered search for B2B SaaS products
- **AI Gatekeeper**: Gemini-powered classification into business categories
- **Quality filtering**: Rule-based + AI filtering to reject noise (tutorials, libraries, blog posts)
- **Dual-table architecture**: Separate `Product` (commercial) and `OpenSourceTool` tables
- **Business category taxonomy**: marketing, sales, customer_service, productivity, developer
- **Category filter UI**: Filter chips for browsing by business function
- **Open Source Spotlight**: Dedicated section for GitHub/Hugging Face tools

### ⚠️ Partial Implementation

- **FutureTools scraper**: Returns 13 demo products; needs live Firecrawl integration
- **Enrichment pipeline**: Basic enrichment exists but not fully utilized
- **Scoring system**: Implemented but needs re-scoring after category migration

### 📊 Current Metrics

| Metric | Value |
|--------|-------|
| Commercial Products | 29 |
| Open Source Tools | 150 |
| Business Categories | 5 active |
| Data Sources | 7 scrapers |

---

## Phase 1: Foundation Stabilization (1-2 weeks)

### Goals
- Ensure all scrapers work reliably in production
- Increase product volume to 100+ commercial products
- Fix any production issues

### Tasks

#### 1.1 Production Deployment ✅ In Progress
- [ ] Deploy latest changes to Vercel
- [ ] Verify `TAVILY_API_KEY` is set in Vercel environment
- [ ] Test scrape/assess pipeline via production cron or manual trigger
- [ ] Verify UI shows all categories

#### 1.2 FutureTools Live Scraping
- [ ] Add `FIRECRAWL_API_KEY` to environment
- [ ] Implement live scraping in `futuretools.ts`
- [ ] Scrape FutureTools category pages: `/ai/marketing`, `/ai/sales`, etc.
- [ ] Extract: name, tagline, website, category, upvotes
- [ ] Test with small subset before full scrape

#### 1.3 Pipeline Reliability
- [ ] Add retry logic to Tavily scraper for rate limit handling
- [ ] Add error tracking/logging for failed scrapes
- [ ] Implement incremental scraping (skip already-scraped URLs)
- [ ] Add health check endpoint for monitoring

#### 1.4 Data Quality
- [ ] Run assessment on all unassessed products
- [ ] Run scoring on all assessed products
- [ ] Verify businessCategory distribution is balanced
- [ ] Add deduplication for products with similar names/websites

---

## Phase 2: Source Expansion (2-4 weeks)

### Goals
- Add high-quality commercial data sources
- Reach 500+ commercial products
- Improve category coverage (especially sales & customer_service)

### Tasks

#### 2.1 G2 Integration
- [ ] Research G2 API or Apify actor options
- [ ] Create `g2.ts` scraper
- [ ] Map G2 categories to our businessCategory taxonomy
- [ ] Extract: name, description, pricing, ratings, reviews count
- [ ] Handle pagination for large categories

#### 2.2 Capterra Integration
- [ ] Research Capterra scraping options (Firecrawl, Apify)
- [ ] Create `capterra.ts` scraper
- [ ] Focus on AI-specific categories
- [ ] Extract pricing tiers and feature lists

#### 2.3 Additional Discovery Sources
- [ ] Add AI tool directories: ToolPilot, AITopTools, TopAI.tools
- [ ] Add startup databases: Crunchbase AI companies, AngelList AI startups
- [ ] Add industry-specific sources (MarTech for marketing, SalesTech for sales)

#### 2.4 Quality Improvements
- [ ] Implement website validation (check if product URL is live)
- [ ] Add logo fetching from websites (Clearbit, favicon fallback)
- [ ] Detect and merge duplicate products across sources

---

## Phase 3: Enrichment & Intelligence (4-6 weeks)

### Goals
- Rich product profiles with company data, pricing, features
- Intelligent recommendations and comparisons
- User engagement features

### Tasks

#### 3.1 Product Enrichment
- [ ] Integrate Clearbit for company data (size, funding, industry)
- [ ] Add pricing tier extraction (free, starter, pro, enterprise)
- [ ] Extract feature lists from product websites
- [ ] Add integration/API availability detection
- [ ] Add customer logos/testimonials extraction

#### 3.2 AI-Powered Analysis
- [ ] Generate "Best For" recommendations per product
- [ ] Create competitive landscape maps per category
- [ ] Add trend detection (rising products based on engagement velocity)
- [ ] Generate comparison summaries for similar products

#### 3.3 User Features
- [ ] Add user accounts (NextAuth)
- [ ] Implement "Save Product" functionality
- [ ] Add product comparison tool (side-by-side)
- [ ] Email digest for new products in saved categories
- [ ] Add product request form

---

## Phase 4: Community & Feedback (6-8 weeks)

### Goals
- User-generated content and reviews
- Community curation and voting
- Become authoritative source for B2B AI tools

### Tasks

#### 4.1 User Reviews
- [ ] Add review submission system
- [ ] Implement review moderation (AI + manual)
- [ ] Add verified user badges
- [ ] Display review summaries on product cards

#### 4.2 Community Features
- [ ] User upvoting/downvoting on products
- [ ] "Request a product" submissions
- [ ] User-submitted corrections
- [ ] Expert curator program

#### 4.3 Content & SEO
- [ ] Generate category landing pages with AI
- [ ] Create comparison pages (e.g., "Jasper vs Copy.ai")
- [ ] Add blog with AI tool insights
- [ ] Implement structured data for rich snippets

---

## Phase 5: Monetization & Scale (8+ weeks)

### Goals
- Sustainable business model
- Enterprise features
- Scale to 1000+ products

### Tasks

#### 5.1 Monetization Options
- [ ] Sponsored listings (clearly marked)
- [ ] Affiliate partnerships with tools
- [ ] Premium features (API access, export, alerts)
- [ ] Enterprise dashboard for teams

#### 5.2 Technical Scale
- [ ] Move to dedicated database (scale beyond Neon free tier)
- [ ] Implement caching layer (Redis)
- [ ] Add search with Algolia or Typesense
- [ ] Performance optimization for large product counts

#### 5.3 Analytics & Insights
- [ ] Product analytics (views, clicks, conversions)
- [ ] Category trend reports
- [ ] Market research features
- [ ] API for integrations

---

## Technical Debt & Maintenance

### Ongoing Tasks
- [ ] Keep dependencies updated
- [ ] Monitor Vercel/Neon usage (stay within free tier or upgrade)
- [ ] Regular data quality audits
- [ ] Performance monitoring
- [ ] Security updates

### Known Issues to Address
- [ ] FutureTools returns demo data only
- [ ] Some Tavily results are blog posts (gatekeeper rejects, but wastes API quota)
- [ ] Need better deduplication (same product from multiple sources)
- [ ] Category filter could show counts

---

## Success Metrics

### Phase 1 (Foundation)
- 100+ commercial products
- All 5 categories populated with 10+ products each
- 95%+ scraper success rate

### Phase 2 (Expansion)
- 500+ commercial products
- G2 + Capterra integrated
- Balanced category distribution

### Phase 3 (Enrichment)
- 80%+ products have pricing info
- 70%+ products have company data
- Comparison tool launched

### Phase 4 (Community)
- User accounts live
- 100+ user reviews
- 1000+ weekly visitors

### Phase 5 (Scale)
- 1000+ products
- Sustainable revenue
- API launched

---

## Contributing

We welcome contributions! Priority areas:

1. **Scrapers**: New data source integrations
2. **UI/UX**: Category pages, comparison tool, mobile improvements
3. **Data Quality**: Deduplication, validation, enrichment
4. **Documentation**: API docs, contributor guide

See issues tagged `good-first-issue` for starter tasks.

---

*Last updated: December 2024*

