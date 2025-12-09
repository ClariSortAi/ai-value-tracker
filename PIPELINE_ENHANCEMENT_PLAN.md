# AI Value Tracker: Radical Pipeline Enhancement Plan

> **Mission**: Transform the AI Value Tracker into the definitive leader in discovering, surfacing, and describing AI-based tools through intelligent agentic orchestration, MCP integration, and multi-source data fusion.

**Document Version**: 1.0
**Date**: December 2025
**Target**: Next implementing agent

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Current Architecture Analysis](#current-architecture-analysis)
3. [Strategic Enhancement Vision](#strategic-enhancement-vision)
4. [MCP Server Integration Strategy](#mcp-server-integration-strategy)
5. [Agentic Architecture Design](#agentic-architecture-design)
6. [Data Source Expansion](#data-source-expansion)
7. [AI-Powered Enrichment Pipeline](#ai-powered-enrichment-pipeline)
8. [Search & Discovery APIs](#search--discovery-apis)
9. [Implementation Phases](#implementation-phases)
10. [Technical Specifications](#technical-specifications)
11. [Cost Optimization Strategy](#cost-optimization-strategy)
12. [Success Metrics](#success-metrics)

---

## Executive Summary

### The Opportunity

The current AI Value Tracker operates on a **weekly batch pipeline** with 5 data sources. To become the market leader in AI tools discovery, we must evolve into a **continuous, intelligent, multi-source discovery engine** that:

- **Discovers** AI tools in real-time from 15+ sources
- **Enriches** product data with comprehensive metadata
- **Assesses** commercial viability with multi-dimensional AI evaluation
- **Surfaces** high-quality tools with semantic understanding
- **Describes** tools in ways that resonate with target audiences

### Key Innovation: Agentic MCP Architecture

The breakthrough approach is to leverage the **Model Context Protocol (MCP)** ecosystem—released by Anthropic in November 2024—combined with **agentic AI frameworks** (CrewAI, LangGraph) to create autonomous discovery agents that can:

1. Dynamically discover and use new data extraction tools
2. Reason about which sources to query based on gaps in coverage
3. Automatically adapt to anti-bot measures and site changes
4. Enrich products with contextual understanding, not just raw data

### Constraints Preserved

- ✅ **Vercel deployment** (serverless functions, edge runtime)
- ✅ **Neon DB free tier** (0.5GB, 1000 product limit)
- ✅ **Minimal/free tier services** wherever possible
- ✅ **Existing Next.js 16 + Prisma architecture**

---

## Current Architecture Analysis

### Existing Pipeline Flow

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   5 Scrapers    │────▶│  Quality Filter │────▶│  AI Gatekeeper  │────▶│   AI Scorer     │
│  (Weekly Cron)  │     │  (Rule-based)   │     │  (Gemini 2.0)   │     │  (Gemini 2.0)   │
└─────────────────┘     └─────────────────┘     └─────────────────┘     └─────────────────┘
       │                       │                       │                       │
       ▼                       ▼                       ▼                       ▼
  Product Hunt           60+ quality             Commercial            6-dimension
  GitHub                 score threshold         viability             ISO-25010
  Hacker News            Domain blocklist        B2B/B2C/Dev           scoring
  There's An AI          Pattern matching        classification
  Hugging Face
```

### Current Strengths

| Aspect | Current State | Rating |
|--------|---------------|--------|
| Scraper diversity | 5 sources | ⭐⭐⭐ |
| Quality filtering | 3-layer system | ⭐⭐⭐⭐ |
| AI assessment | Gemini gatekeeper | ⭐⭐⭐⭐ |
| Scoring methodology | ISO-25010 inspired | ⭐⭐⭐⭐⭐ |
| Automation | Weekly cron | ⭐⭐ |
| Data freshness | 7-day lag | ⭐⭐ |

### Current Gaps

| Gap | Impact | Priority |
|-----|--------|----------|
| **Limited discovery sources** | Missing 60%+ of new AI tools | 🔴 Critical |
| **No real-time monitoring** | Late to surface trending tools | 🔴 Critical |
| **Static scraping** | Breaks when sites change | 🟠 High |
| **No semantic discovery** | Can't find tools by capability | 🟠 High |
| **Basic enrichment** | Limited product understanding | 🟠 High |
| **No user signal integration** | Missing usage/review data | 🟡 Medium |

---

## Strategic Enhancement Vision

### The "AI Tools Radar" Concept

Transform from a **batch collector** to an **intelligent radar** that continuously scans the AI landscape:

```
                         ┌─────────────────────────────────┐
                         │      AI TOOLS RADAR             │
                         │   (Continuous Discovery Engine) │
                         └─────────────────────────────────┘
                                        │
         ┌──────────────────────────────┼──────────────────────────────┐
         │                              │                              │
         ▼                              ▼                              ▼
┌─────────────────┐          ┌─────────────────┐          ┌─────────────────┐
│  SCOUT AGENTS   │          │ ENRICHMENT LAYER│          │  QUALITY GATE   │
│                 │          │                 │          │                 │
│ • MCP Scrapers  │─────────▶│ • Product Intel │─────────▶│ • AI Gatekeeper │
│ • Search APIs   │          │ • Tech Stack    │          │ • Multi-model   │
│ • Social Listen │          │ • Pricing Data  │          │ • Confidence    │
│ • RSS/Feeds     │          │ • Reviews/Buzz  │          │ • Human-in-loop │
└─────────────────┘          └─────────────────┘          └─────────────────┘
         │                              │                              │
         └──────────────────────────────┼──────────────────────────────┘
                                        ▼
                         ┌─────────────────────────────────┐
                         │       PRESENTATION LAYER        │
                         │                                 │
                         │  • Semantic search & filtering  │
                         │  • Personalized recommendations │
                         │  • Trend analysis & insights    │
                         │  • Comparison tools             │
                         └─────────────────────────────────┘
```

---

## MCP Server Integration Strategy

### What is MCP?

The **Model Context Protocol (MCP)**, released by Anthropic in November 2024, is an open standard that allows LLMs to invoke external tools through a standardized interface. Think of it as "USB-C for AI" — plug in any data source or tool without custom integrations.

### Recommended MCP Servers

#### Tier 1: Essential (Implement First)

| MCP Server | Purpose | Why Essential | Cost |
|------------|---------|---------------|------|
| **[Firecrawl MCP](https://github.com/firecrawl/firecrawl-mcp-server)** | Universal web scraping | Handles JS rendering, anti-bot bypassing, structured extraction | Free tier available |
| **[Playwright MCP](https://github.com/microsoft/playwright-mcp)** | Browser automation | Official Microsoft server, 12K+ GitHub stars, handles complex interactions | Free (self-hosted) |
| **[Apify MCP](https://github.com/apify/apify-mcp-server)** | 4,000+ pre-built scrapers | Dynamic tool discovery, scrapers for LinkedIn, Amazon, Reddit, etc. | Free tier: $5/month credits |
| **[Tavily MCP](https://tavily.com)** | AI-optimized search | Returns cleaned, summarized results ready for LLM context | Free tier: 1,000 searches/month |

#### Tier 2: Enhancement (Phase 2)

| MCP Server | Purpose | Benefit | Cost |
|------------|---------|---------|------|
| **[Bright Data MCP](https://brightdata.com)** | Enterprise scraping | 150M+ IP proxy network, anti-detection | Pay-as-you-go |
| **[Exa AI](https://exa.ai)** | Semantic search | Neural search understands meaning, not just keywords | Free tier available |
| **[Serper MCP](https://serper.dev)** | Google SERP API | Real-time Google results, 2,500 free queries | Free tier |
| **[Perplexity Sonar](https://sonar.perplexity.ai)** | AI search with citations | Best factuality scores, grounded responses | $5/1,000 searches |

#### Tier 3: Specialized (Phase 3)

| MCP Server | Purpose | Use Case |
|------------|---------|----------|
| **YouTube Transcript MCP** | Video content extraction | Extract insights from AI tool demos |
| **GitHub MCP** | Repository intelligence | Track AI project momentum, issues, releases |
| **RSS/Feed MCP** | Blog/news monitoring | Track AI news sites, company blogs |

### MCP Integration Architecture

```typescript
// Proposed: src/lib/mcp/client.ts

import { MCPClient } from '@anthropic/mcp-client';

export const mcpClient = new MCPClient({
  servers: {
    firecrawl: {
      transport: 'http',
      url: process.env.FIRECRAWL_MCP_URL,
      apiKey: process.env.FIRECRAWL_API_KEY
    },
    apify: {
      transport: 'http',
      url: 'https://actors-mcp.apify.com',
      apiKey: process.env.APIFY_API_KEY
    },
    tavily: {
      transport: 'http',
      url: process.env.TAVILY_MCP_URL,
      apiKey: process.env.TAVILY_API_KEY
    }
  }
});

// Dynamic tool discovery
export async function discoverTools() {
  const tools = await mcpClient.listTools();
  return tools.filter(t => t.category === 'web-scraping');
}

// Universal scrape with fallback
export async function intelligentScrape(url: string, schema: object) {
  try {
    // Try Firecrawl first (best for modern JS sites)
    return await mcpClient.call('firecrawl', 'scrape', { url, schema });
  } catch (e) {
    // Fallback to Playwright for complex interactions
    return await mcpClient.call('playwright', 'scrape', { url, selectors: schema });
  }
}
```

---

## Agentic Architecture Design

### Why Agentic?

Traditional scrapers are **brittle** and **reactive**. Agentic systems are **adaptive** and **proactive**:

| Traditional Scraping | Agentic Discovery |
|---------------------|-------------------|
| Fixed selectors break | LLM adapts to page changes |
| Manual source addition | Agent discovers new sources |
| Batch processing | Continuous monitoring |
| Rule-based filtering | Reasoning-based curation |

### Recommended Framework: CrewAI + LangGraph

**[CrewAI](https://crewai.com)** is ideal because:
- Lean Python framework (no LangChain dependency)
- Role-based agent collaboration
- Production-ready (used by PwC, PepsiCo)
- 800M+ monthly automations in production

### Agent Crew Design

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        AI TOOLS DISCOVERY CREW                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │   SCOUT     │  │  ANALYST    │  │  ENRICHER   │  │   CURATOR   │        │
│  │   Agent     │  │   Agent     │  │   Agent     │  │   Agent     │        │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘        │
│         │                │                │                │                │
│         ▼                ▼                ▼                ▼                │
│  • Search web for      • Assess      • Fetch pricing   • Apply quality    │
│    new AI tools          commercial    • Get reviews      gate criteria    │
│  • Monitor feeds         viability    • Tech stack      • Score products   │
│  • Track launches      • Classify      analysis        • Deduplicate      │
│  • Discover via          target       • Competitor      • Rank & surface   │
│    semantic search       audience      mapping                             │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Agent Specifications

#### 1. Scout Agent

```python
# Conceptual: agents/scout.py

scout_agent = Agent(
    role="AI Tools Scout",
    goal="Discover new AI tools and products before they go mainstream",
    backstory="""You are an expert at finding emerging AI tools. You monitor
    Product Hunt, Hacker News, GitHub trending, Twitter/X, Reddit, and AI
    directories. You have an intuition for tools that will become important.""",
    tools=[
        TavilySearchTool(),          # Semantic web search
        FirecrawlScrapeTool(),       # Universal scraping
        ApifyActorsTool(),           # Pre-built scrapers
        RSSFeedTool(),               # Blog/news monitoring
        GitHubTrendingTool()         # Repository tracking
    ],
    llm=gemini_flash  # Use existing Gemini for cost efficiency
)
```

#### 2. Analyst Agent

```python
analyst_agent = Agent(
    role="AI Product Analyst",
    goal="Assess commercial viability and classify AI products accurately",
    backstory="""You are a seasoned product analyst who understands B2B SaaS,
    developer tools, and AI product-market fit. You can quickly identify if a
    tool has commercial potential or is a hobby project.""",
    tools=[
        WebContentAnalyzer(),        # Deep page analysis
        CompetitorLookup(),          # Market positioning
        PricingExtractor()           # Business model analysis
    ],
    llm=gemini_flash
)
```

#### 3. Enricher Agent

```python
enricher_agent = Agent(
    role="Product Data Enricher",
    goal="Gather comprehensive metadata about AI products",
    backstory="""You specialize in building complete product profiles. You find
    pricing details, integration capabilities, user reviews, and technical
    specifications that help users make informed decisions.""",
    tools=[
        HunterIOEnrichment(),        # Company data
        G2ReviewsScraper(),          # User reviews
        StackShareTool(),            # Tech stack detection
        SimilarWebTool()             # Traffic estimates
    ],
    llm=gemini_flash
)
```

#### 4. Curator Agent

```python
curator_agent = Agent(
    role="Quality Curator",
    goal="Ensure only high-quality, relevant AI tools are surfaced",
    backstory="""You are the final gatekeeper. You apply rigorous quality
    standards, remove duplicates, score products consistently, and ensure
    the collection represents the best AI tools available.""",
    tools=[
        DeduplicationTool(),         # Fuzzy matching
        QualityScorer(),             # Multi-dimensional scoring
        CategoryClassifier()         # Taxonomy assignment
    ],
    llm=gemini_flash
)
```

### Workflow Orchestration with LangGraph

```python
from langgraph.graph import StateGraph, END

# Define the discovery workflow
workflow = StateGraph(DiscoveryState)

# Add nodes
workflow.add_node("scout", scout_agent.run)
workflow.add_node("analyze", analyst_agent.run)
workflow.add_node("enrich", enricher_agent.run)
workflow.add_node("curate", curator_agent.run)
workflow.add_node("save", save_to_database)

# Define edges (flow)
workflow.add_edge("scout", "analyze")
workflow.add_conditional_edge(
    "analyze",
    lambda state: "enrich" if state.is_viable else END
)
workflow.add_edge("enrich", "curate")
workflow.add_edge("curate", "save")

# Compile
discovery_pipeline = workflow.compile()
```

---

## Data Source Expansion

### Current Sources (5)

1. Product Hunt (GraphQL API)
2. GitHub (REST API)
3. Hacker News (Algolia API)
4. There's An AI For That (Web scraping)
5. Hugging Face Spaces (REST API)

### Proposed Sources (15+ Total)

#### Category 1: Launch Platforms

| Source | Type | Signals | Priority |
|--------|------|---------|----------|
| **Product Hunt** | ✅ Existing | Votes, comments | Keep |
| **Hacker News** | ✅ Existing | Points, comments | Keep |
| **BetaList** | 🆕 New | Early-stage launches | High |
| **Microlaunch** | 🆕 New | Indie maker products | Medium |
| **DevHunt** | 🆕 New | Developer tools | High |

#### Category 2: Code Repositories

| Source | Type | Signals | Priority |
|--------|------|---------|----------|
| **GitHub** | ✅ Existing | Stars, forks | Keep |
| **Hugging Face** | ✅ Existing | Likes, downloads | Keep |
| **GitLab Explore** | 🆕 New | Stars, activity | Medium |
| **Replicate** | 🆕 New | ML model runs | High |

#### Category 3: AI Directories

| Source | Type | Data Quality | Priority |
|--------|------|--------------|----------|
| **There's An AI** | ✅ Existing | High | Keep |
| **FutureTools.io** | 🆕 New | Curated | High |
| **AI Tool List** | 🆕 New | Community | Medium |
| **ToolList.ai** | 🆕 New | Comprehensive | Medium |

#### Category 4: Social & News

| Source | Type | Signal Type | Priority |
|--------|------|-------------|----------|
| **Twitter/X** | 🆕 New | Viral AI tools | High |
| **Reddit** | 🆕 New | r/artificial, r/MachineLearning | High |
| **AI newsletters** | 🆕 New | Curated picks | Medium |
| **TechCrunch AI** | 🆕 New | Funding news | Medium |

#### Category 5: Open Data Sources

| Source | URL | Update Frequency |
|--------|-----|------------------|
| **awesome-ai-tools** | github.com/mahseema/awesome-ai-tools | Weekly |
| **awesome-AI-toolkit** | github.com/balavenkatesh3322/awesome-AI-toolkit | Monthly |
| **AI tools JSON** | github.com/topics/ai-tools-directory | Community |

### Source Integration Code

```typescript
// Proposed: src/lib/sources/registry.ts

export const sourceRegistry: DataSource[] = [
  // Tier 1: API-based (most reliable)
  { id: 'product_hunt', type: 'api', priority: 1, rateLimit: '100/hour' },
  { id: 'github', type: 'api', priority: 1, rateLimit: '5000/hour' },
  { id: 'huggingface', type: 'api', priority: 1, rateLimit: '1000/hour' },
  { id: 'replicate', type: 'api', priority: 2, rateLimit: '100/hour' },

  // Tier 2: MCP-scraped (flexible)
  { id: 'theres_an_ai', type: 'mcp_scrape', priority: 2, server: 'firecrawl' },
  { id: 'futuretools', type: 'mcp_scrape', priority: 2, server: 'firecrawl' },
  { id: 'betalist', type: 'mcp_scrape', priority: 2, server: 'playwright' },

  // Tier 3: Search-discovered (semantic)
  { id: 'tavily_discover', type: 'semantic_search', priority: 3,
    queries: ['new AI tool launched', 'AI startup product'] },
  { id: 'exa_discover', type: 'semantic_search', priority: 3,
    queries: ['AI SaaS tool', 'machine learning product'] },

  // Tier 4: Social signals
  { id: 'twitter_ai', type: 'social', priority: 4, server: 'apify' },
  { id: 'reddit_ai', type: 'social', priority: 4, server: 'apify' }
];
```

---

## AI-Powered Enrichment Pipeline

### Current Enrichment

- Basic: name, tagline, description, website, logo
- Engagement: upvotes, comments, stars
- Classification: viabilityScore, targetAudience, productType

### Enhanced Enrichment Schema

```typescript
// Proposed: prisma/schema.prisma additions

model Product {
  // ... existing fields ...

  // NEW: Enhanced metadata
  pricing           Json?      // { model: 'freemium', tiers: [...] }
  techStack         String[]   // ['React', 'Python', 'OpenAI']
  integrations      String[]   // ['Slack', 'Zapier', 'API']
  useCases          String[]   // ['Writing', 'Coding', 'Analysis']

  // NEW: Company intelligence
  companyName       String?
  companySize       String?    // startup, smb, enterprise
  fundingStage      String?    // seed, series-a, etc.
  foundedYear       Int?
  headquarters      String?

  // NEW: Social proof
  g2Rating          Float?     // 0-5
  g2ReviewCount     Int?
  captureRating     Float?
  monthlyVisits     Int?       // SimilarWeb estimate
  twitterFollowers  Int?

  // NEW: Content analysis
  keyFeatures       String[]   // AI-extracted features
  limitations       String[]   // AI-extracted limitations
  bestFor           String[]   // AI-extracted ideal users
  alternatives      String[]   // Competitor product slugs

  // NEW: Freshness signals
  lastUpdated       DateTime?  // Product's last update
  launchMomentum    Float?     // Calculated trend score
  trendingScore     Float?     // Real-time popularity
}
```

### Enrichment Pipeline Design

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         ENRICHMENT PIPELINE                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Stage 1: Basic Scrape          Stage 2: Company Intel                      │
│  ┌─────────────────────┐        ┌─────────────────────┐                    │
│  │ Firecrawl MCP       │───────▶│ Hunter.io API       │                    │
│  │ • Homepage content  │        │ • Company profile   │                    │
│  │ • Pricing page      │        │ • Employee count    │                    │
│  │ • Features list     │        │ • Tech stack        │                    │
│  └─────────────────────┘        └─────────────────────┘                    │
│           │                              │                                  │
│           ▼                              ▼                                  │
│  Stage 3: Social Proof          Stage 4: AI Analysis                       │
│  ┌─────────────────────┐        ┌─────────────────────┐                    │
│  │ Apify Actors        │───────▶│ Gemini 2.0 Flash    │                    │
│  │ • G2 reviews        │        │ • Feature extract   │                    │
│  │ • Twitter metrics   │        │ • Use case infer    │                    │
│  │ • Reddit mentions   │        │ • Limitation detect │                    │
│  └─────────────────────┘        └─────────────────────┘                    │
│                                          │                                  │
│                                          ▼                                  │
│                                 ┌─────────────────────┐                    │
│                                 │ ENRICHED PRODUCT    │                    │
│                                 │ Ready for scoring   │                    │
│                                 └─────────────────────┘                    │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### AI-Powered Feature Extraction

```typescript
// Proposed: src/lib/ai/feature-extractor.ts

const FEATURE_EXTRACTION_PROMPT = `
Analyze this AI product and extract structured information.

Product: {name}
Website Content: {content}

Extract:
1. KEY_FEATURES: List 5-8 main features (be specific, not generic)
2. USE_CASES: Who would use this and for what? (3-5 specific scenarios)
3. LIMITATIONS: What are the downsides or constraints? (2-4 items)
4. BEST_FOR: Who is the ideal user? (2-3 personas)
5. PRICING_MODEL: freemium/free/paid/enterprise/usage-based
6. TECH_STACK: What technologies does it use/integrate with?
7. DIFFERENTIATOR: What makes this unique vs alternatives?

Return as JSON.
`;

export async function extractFeatures(product: Product): Promise<EnrichedProduct> {
  const pageContent = await mcpClient.call('firecrawl', 'scrape', {
    url: product.website,
    formats: ['markdown']
  });

  const analysis = await gemini.generateContent({
    prompt: FEATURE_EXTRACTION_PROMPT
      .replace('{name}', product.name)
      .replace('{content}', pageContent.markdown)
  });

  return JSON.parse(analysis);
}
```

---

## Search & Discovery APIs

### Recommended Search APIs

#### 1. Tavily (Primary Recommendation)

**Why Tavily?**
- Built specifically for LLMs and AI agents
- Returns cleaned, summarized content (not raw HTML)
- Reduces hallucinations with grounded responses
- Free tier: 1,000 searches/month

```typescript
// Proposed: src/lib/search/tavily.ts

import { tavily } from '@tavily/core';

export async function discoverNewTools(): Promise<DiscoveredTool[]> {
  const queries = [
    'new AI tool launched this week',
    'AI startup product announcement',
    'best new AI tools December 2025',
    'AI tool for business productivity'
  ];

  const results = await Promise.all(
    queries.map(q => tavily.search({
      query: q,
      search_depth: 'advanced',
      include_domains: ['producthunt.com', 'techcrunch.com', 'venturebeat.com'],
      max_results: 10
    }))
  );

  return deduplicateAndParse(results.flat());
}
```

#### 2. Exa (Semantic Search)

**Why Exa?**
- Neural search understands meaning, not just keywords
- Can find tools by capability ("tool that does X")
- Independent index (not Google wrapper)
- Highest accuracy for complex queries

```typescript
// Proposed: src/lib/search/exa.ts

import Exa from 'exa-js';

const exa = new Exa(process.env.EXA_API_KEY);

export async function semanticToolSearch(capability: string): Promise<Tool[]> {
  const results = await exa.search({
    query: `AI tool that ${capability}`,
    type: 'neural',
    category: 'company',
    numResults: 20,
    startPublishedDate: '2024-01-01'
  });

  return results.results.map(parseExaResult);
}

// Example: Find tools for specific use cases
await semanticToolSearch('helps marketers write better email copy');
await semanticToolSearch('automates code review for Python');
await semanticToolSearch('transcribes meetings and extracts action items');
```

#### 3. Serper (Google SERP)

**Why Serper?**
- Real-time Google results
- 2,500 free queries
- Fast (1-2 second response)
- All Google verticals (News, Images, etc.)

```typescript
// Proposed: src/lib/search/serper.ts

export async function googleNewsSearch(topic: string): Promise<NewsResult[]> {
  const response = await fetch('https://google.serper.dev/news', {
    method: 'POST',
    headers: {
      'X-API-KEY': process.env.SERPER_API_KEY,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      q: `${topic} AI tool launch`,
      num: 20
    })
  });

  return (await response.json()).news;
}
```

#### 4. Perplexity Sonar (AI Search with Citations)

**Why Sonar?**
- Best factuality (85.8 F-score on SimpleQA)
- Returns cited, grounded answers
- Ideal for competitive analysis queries

```typescript
// Proposed: src/lib/search/perplexity.ts

export async function competitorAnalysis(product: string): Promise<Analysis> {
  const response = await fetch('https://api.perplexity.ai/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.PERPLEXITY_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'sonar-pro',
      messages: [{
        role: 'user',
        content: `What are the main competitors to ${product}?
                  Compare features, pricing, and target audience.
                  Include citations.`
      }]
    })
  });

  return await response.json();
}
```

---

## Implementation Phases

### Phase 1: Foundation (Week 1-2)

**Goal**: Establish MCP infrastructure and expand data sources

| Task | Priority | Effort | Dependencies |
|------|----------|--------|--------------|
| Set up Firecrawl MCP client | 🔴 P0 | 4h | API key |
| Add Tavily search integration | 🔴 P0 | 4h | API key |
| Expand to 3 new directory sources | 🔴 P0 | 8h | Firecrawl |
| Implement source registry pattern | 🟠 P1 | 6h | None |
| Add retry/fallback logic | 🟠 P1 | 4h | Sources |

**Deliverables**:
- MCP client abstraction layer
- 8 total data sources (up from 5)
- Robust error handling

### Phase 2: Intelligence (Week 3-4)

**Goal**: Add semantic search and AI enrichment

| Task | Priority | Effort | Dependencies |
|------|----------|--------|--------------|
| Integrate Exa semantic search | 🔴 P0 | 6h | API key |
| Build feature extraction pipeline | 🔴 P0 | 8h | Firecrawl |
| Enhance product schema | 🟠 P1 | 4h | Prisma |
| Add pricing extraction | 🟠 P1 | 6h | AI pipeline |
| Implement use case classification | 🟠 P1 | 4h | AI pipeline |

**Deliverables**:
- Semantic tool discovery
- Rich product metadata
- Enhanced schema with 15+ new fields

### Phase 3: Agentic (Week 5-6)

**Goal**: Deploy autonomous discovery agents

| Task | Priority | Effort | Dependencies |
|------|----------|--------|--------------|
| Set up CrewAI framework | 🔴 P0 | 8h | Python worker |
| Implement Scout agent | 🔴 P0 | 8h | CrewAI |
| Implement Analyst agent | 🟠 P1 | 6h | CrewAI |
| Build LangGraph workflow | 🟠 P1 | 6h | Agents |
| Add Apify actor integration | 🟠 P1 | 4h | API key |

**Deliverables**:
- Autonomous discovery crew
- Continuous monitoring capability
- Adaptive scraping

### Phase 4: Polish (Week 7-8)

**Goal**: Quality refinement and presentation

| Task | Priority | Effort | Dependencies |
|------|----------|--------|--------------|
| Implement social proof gathering | 🟠 P1 | 6h | Apify |
| Build trending score algorithm | 🟠 P1 | 4h | Data |
| Add comparison features | 🟡 P2 | 6h | UI |
| Implement personalization | 🟡 P2 | 8h | User data |
| Performance optimization | 🟡 P2 | 4h | All |

**Deliverables**:
- Social proof signals
- Trend detection
- Comparison tools

---

## Technical Specifications

### Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              VERCEL EDGE                                     │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                         Next.js 16 App                               │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                 │   │
│  │  │   /api/     │  │  /api/      │  │  /api/      │                 │   │
│  │  │   scrape    │  │  discover   │  │  enrich     │                 │   │
│  │  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘                 │   │
│  │         │                │                │                         │   │
│  │         └────────────────┼────────────────┘                         │   │
│  │                          ▼                                          │   │
│  │              ┌─────────────────────┐                               │   │
│  │              │   MCP Client Layer  │                               │   │
│  │              │  (src/lib/mcp/)     │                               │   │
│  │              └──────────┬──────────┘                               │   │
│  └─────────────────────────┼───────────────────────────────────────────┘   │
│                            │                                               │
└────────────────────────────┼───────────────────────────────────────────────┘
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
        ▼                    ▼                    ▼
┌───────────────┐    ┌───────────────┐    ┌───────────────┐
│  Firecrawl    │    │    Tavily     │    │    Apify      │
│  MCP Server   │    │  Search API   │    │  MCP Server   │
└───────────────┘    └───────────────┘    └───────────────┘
        │                    │                    │
        └────────────────────┼────────────────────┘
                             │
                             ▼
                    ┌───────────────┐
                    │  Neon Postgres│
                    │  (0.5GB free) │
                    └───────────────┘
```

### Environment Variables

```bash
# .env.local additions

# MCP Servers
FIRECRAWL_API_KEY=fc-xxxxx          # Firecrawl.dev
APIFY_API_KEY=apify_api_xxxxx       # Apify.com

# Search APIs
TAVILY_API_KEY=tvly-xxxxx           # Tavily.com (1k free/mo)
EXA_API_KEY=xxxxx                   # Exa.ai (free tier)
SERPER_API_KEY=xxxxx                # Serper.dev (2.5k free)
PERPLEXITY_API_KEY=pplx-xxxxx       # Perplexity (optional)

# Enrichment
HUNTER_API_KEY=xxxxx                # Hunter.io (free tier)

# Existing
DATABASE_URL=postgresql://...       # Neon
GEMINI_API_KEY=xxxxx               # Google AI
PRODUCT_HUNT_TOKEN=xxxxx           # Product Hunt
GITHUB_TOKEN=xxxxx                 # GitHub
CRON_SECRET=xxxxx                  # Auth
```

### New API Endpoints

```typescript
// Proposed new endpoints

// GET/POST /api/discover
// Semantic search for new AI tools
// Query params: q (search query), sources (array)

// GET/POST /api/enrich/[slug]
// Trigger enrichment for a specific product
// Returns enriched product data

// GET/POST /api/agents/run
// Trigger agentic discovery workflow
// Body: { crew: 'discovery', task: 'weekly_scan' }

// GET /api/trends
// Get trending AI tools based on social signals
// Query params: timeframe (day, week, month)

// GET /api/compare
// Compare multiple products
// Query params: slugs (comma-separated)
```

### Database Capacity Management

```typescript
// Enhanced capacity management for 1000 product limit

const CAPACITY_CONFIG = {
  maxProducts: 1000,
  reserveSlots: 50,        // Keep 50 slots for high-priority discoveries
  maxAgeMonths: 6,         // Prune products older than 6 months
  minQualityScore: 65,     // Remove products below this score
  pruneOrder: [
    'low_engagement',      // Stars < 100, upvotes < 20
    'no_recent_activity',  // No updates in 3 months
    'duplicate_category',  // Too many similar tools
    'low_score'            // Composite score < 60
  ]
};

export async function manageCapacity(): Promise<void> {
  const count = await prisma.product.count();

  if (count > CAPACITY_CONFIG.maxProducts - CAPACITY_CONFIG.reserveSlots) {
    // Intelligent pruning based on priority order
    for (const strategy of CAPACITY_CONFIG.pruneOrder) {
      await pruneByStrategy(strategy, 50);
      if (await prisma.product.count() < CAPACITY_CONFIG.maxProducts - CAPACITY_CONFIG.reserveSlots) {
        break;
      }
    }
  }
}
```

---

## Cost Optimization Strategy

### Free Tier Utilization

| Service | Free Tier | Monthly Limit | Strategy |
|---------|-----------|---------------|----------|
| **Neon DB** | 0.5GB storage | ~1000 products | Aggressive pruning |
| **Vercel** | 100GB bandwidth | Sufficient | Edge caching |
| **Gemini Flash** | 15 RPM | ~21,600/day | Batch processing |
| **Tavily** | 1,000 searches/mo | 33/day | Strategic queries |
| **Serper** | 2,500 searches | One-time | Targeted news search |
| **Firecrawl** | 500 credits/mo | 16/day | Priority scraping |
| **Apify** | $5 credits/mo | ~100 runs | Pre-built actors |
| **Hunter.io** | 25 searches/mo | Limited | Company enrichment |
| **Exa** | Free tier | Limited | Semantic discovery |

### Cost-Aware Pipeline

```typescript
// Proposed: src/lib/cost/budget.ts

export const monthlyBudget = {
  tavily: { limit: 1000, used: 0, cost_per: 0 },
  serper: { limit: 2500, used: 0, cost_per: 0 },
  firecrawl: { limit: 500, used: 0, cost_per: 0 },
  apify: { limit: 100, used: 0, cost_per: 0.05 },
  gemini: { limit: 21600, used: 0, cost_per: 0 }
};

export function canAfford(service: string, count: number = 1): boolean {
  const budget = monthlyBudget[service];
  return budget.used + count <= budget.limit;
}

export function trackUsage(service: string, count: number = 1): void {
  monthlyBudget[service].used += count;
  // Persist to KV or DB for cross-request tracking
}

// Use in pipeline
if (canAfford('tavily', 1)) {
  const results = await tavily.search(query);
  trackUsage('tavily', 1);
}
```

### Tiered Processing Strategy

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         COST-TIERED PROCESSING                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Tier 1: FREE (Always run)                                                  │
│  ├── GitHub API (5k/hour)                                                   │
│  ├── Product Hunt API (with token)                                          │
│  ├── Hacker News Algolia (unlimited)                                        │
│  └── Hugging Face API (generous limits)                                     │
│                                                                             │
│  Tier 2: FREEMIUM (Run with budget check)                                   │
│  ├── Tavily search (1k/month)                                               │
│  ├── Firecrawl scrape (500/month)                                           │
│  ├── Serper news (2.5k one-time)                                            │
│  └── Gemini assessment (15 RPM)                                             │
│                                                                             │
│  Tier 3: PAID-FALLBACK (Only if budget allows)                             │
│  ├── Apify actors ($5/month)                                                │
│  ├── Exa deep search (usage-based)                                          │
│  └── Perplexity Sonar (usage-based)                                         │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Success Metrics

### Key Performance Indicators

| Metric | Current | Target (3 months) | Measurement |
|--------|---------|-------------------|-------------|
| **Discovery Rate** | ~20 tools/week | 100+ tools/week | Unique products added |
| **Data Sources** | 5 | 15+ | Active sources |
| **Time to Surface** | 7 days | <24 hours | Launch date → in DB |
| **Data Completeness** | 60% | 90% | Fields populated |
| **User Engagement** | Baseline | +50% | Session duration, pages/session |
| **Search Success** | N/A | 80% | Users find relevant tool |

### Quality Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| **False Positive Rate** | <5% | Non-AI tools that slip through |
| **Duplicate Rate** | <2% | Same tool from different sources |
| **Stale Data Rate** | <10% | Products with outdated info |
| **Coverage Completeness** | >80% | Known AI tools we have listed |

### Health Monitoring

```typescript
// Proposed: src/lib/health/metrics.ts

export interface PipelineHealth {
  lastRun: Date;
  sourcesActive: number;
  sourcesFailed: string[];
  productsDiscovered: number;
  productsEnriched: number;
  productsScored: number;
  avgProcessingTime: number;
  errorRate: number;
  budgetUtilization: Record<string, number>;
}

// Expose via /api/health endpoint for monitoring
```

---

## Appendix

### A. Reference Links

**MCP Servers**
- [Firecrawl MCP](https://docs.firecrawl.dev/mcp-server) - Universal web scraping
- [Playwright MCP](https://github.com/microsoft/playwright-mcp) - Browser automation
- [Apify MCP](https://github.com/apify/apify-mcp-server) - 4,000+ pre-built scrapers
- [Awesome MCP Servers](https://github.com/punkpeye/awesome-mcp-servers) - Comprehensive list
- [MCP Servers Directory](https://mcpservers.org) - Discover MCP servers

**Search APIs**
- [Tavily](https://tavily.com) - AI-optimized search
- [Exa AI](https://exa.ai) - Semantic search
- [Serper](https://serper.dev) - Google SERP API
- [Perplexity Sonar](https://sonar.perplexity.ai) - AI search with citations

**Agentic Frameworks**
- [CrewAI](https://crewai.com) - Multi-agent orchestration
- [LangGraph](https://langchain-ai.github.io/langgraph/) - Stateful agent workflows
- [LangChain](https://python.langchain.com) - LLM application framework

**Data Sources**
- [FutureTools.io](https://futuretools.io) - AI tools directory
- [There's An AI For That](https://theresanaiforthat.com) - Comprehensive AI directory
- [BetaList](https://betalist.com) - Startup launches
- [DevHunt](https://devhunt.org) - Developer tools

**Enrichment APIs**
- [Hunter.io](https://hunter.io) - Company enrichment
- [BuiltWith](https://builtwith.com) - Tech stack detection

### B. Glossary

| Term | Definition |
|------|------------|
| **MCP** | Model Context Protocol - Anthropic's standard for LLM tool integration |
| **Agentic** | AI systems that can autonomously plan, reason, and act |
| **RAG** | Retrieval-Augmented Generation - grounding LLMs with external data |
| **Semantic Search** | Search based on meaning rather than keyword matching |
| **CrewAI** | Framework for orchestrating multiple AI agents |
| **LangGraph** | Framework for building stateful agent workflows |

### C. Risk Mitigation

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| API rate limits exceeded | Medium | High | Budget tracking, fallbacks |
| Scraper breakage | High | Medium | Multiple MCP servers, fallbacks |
| Data quality degradation | Medium | High | Multi-stage validation |
| Cost overruns | Low | Medium | Hard budget caps |
| Neon DB capacity | Medium | High | Aggressive pruning |

---

## Next Steps for Implementing Agent

1. **Start with Phase 1**: Set up MCP infrastructure
2. **Get API keys**: Firecrawl, Tavily, Serper (all have free tiers)
3. **Implement MCP client**: `src/lib/mcp/client.ts`
4. **Expand sources incrementally**: Add FutureTools, BetaList first
5. **Test thoroughly**: Validate data quality at each step
6. **Monitor costs**: Track API usage from day one

**Estimated Total Effort**: 6-8 weeks for full implementation

---

*This plan was generated by analyzing the existing AI Value Tracker codebase, researching MCP servers and agentic frameworks, and designing a comprehensive enhancement strategy that preserves the existing architecture while dramatically expanding capabilities.*
