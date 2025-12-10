import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { GoogleGenerativeAI } from "@google/generative-ai";

const prisma = new PrismaClient();
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

// Tavily API for live search
const TAVILY_API_URL = "https://api.tavily.com/search";

interface DiscoveryResult {
  id: string;
  name: string;
  tagline: string | null;
  description: string | null;
  website: string | null;
  category: string | null;
  businessCategory: string | null;
  source: string;
  relevanceScore: number;
  relevanceReason: string;
  isOpenSource: boolean;
  logo?: string | null;
  upvotes?: number;
  stars?: number;
}

interface TavilyResult {
  title: string;
  url: string;
  content: string;
  score: number;
}

interface CapabilitySignals {
  hasIntegrationVerb: boolean;
  hasProvider: boolean;
  hasUnifiedView: boolean;
  verbs: string[];
  providers: string[];
  evidenceSnippet: string;
}

const INTEGRATION_VERBS = [
  "connect", "sync", "integrate", "aggregate", "merge", "unify", "consolidate", "centralize", "combine", "import"
];

const CALENDAR_PROVIDERS = [
  "google calendar", "outlook", "icloud", "exchange", "office 365", "caldav", "ics", "apple calendar", "multiple calendars"
];

const UNIFIED_VIEW_TERMS = [
  "one calendar", "single view", "unified calendar", "master calendar", "all your calendars", "one place"
];

// Stricter AI prompt
const RELEVANCE_PROMPT = `You are a strict software capability evaluator. Your job is to verify if a tool ACTUALLY does what the user needs, not just if it's related.

USER NEED: "{userNeed}"

CANDIDATE TOOL:
Name: {toolName}
Tagline: {toolTagline}
Description/Content: {toolDescription}
Detected Capabilities: {signals}

INSTRUCTIONS:
1. Score from 0-100 based on FUNCTIONAL FIT.
2. If the user asks for "integration" or "aggregation" (e.g. "put all calendars in one"):
   - Score >= 85 ONLY if the tool explicitly supports syncing/merging external sources (Google/Outlook/etc) into a single view.
   - Score < 40 if it's just a standalone planner or simple calendar that doesn't mention integration.
3. Be skeptical of vague marketing. Look for specific keywords like "sync", "connect", "consolidate".

Output JSON:
{
  "score": number,
  "reason": "One short sentence explaining WHY it fits or fails based on specific evidence."
}`;

interface ProductResult {
  id: string;
  name: string;
  tagline: string | null;
  description: string | null;
  website: string | null;
  category: string | null;
  businessCategory: string | null;
  source: string;
  logo: string | null;
  upvotes: number;
}

interface OpenSourceResult {
  id: string;
  name: string;
  tagline: string | null;
  description: string | null;
  website: string | null;
  source: string;
  logo: string | null;
  likes: number | null;
}

function extractCapabilitySignals(text: string): CapabilitySignals {
  const lower = text.toLowerCase();
  
  const foundVerbs = INTEGRATION_VERBS.filter(v => lower.includes(v));
  const foundProviders = CALENDAR_PROVIDERS.filter(p => lower.includes(p));
  const foundUnified = UNIFIED_VIEW_TERMS.some(t => lower.includes(t));

  return {
    hasIntegrationVerb: foundVerbs.length > 0,
    hasProvider: foundProviders.length > 0,
    hasUnifiedView: foundUnified,
    verbs: foundVerbs,
    providers: foundProviders,
    evidenceSnippet: text.slice(0, 200) // For logging/debugging
  };
}

async function searchExistingProducts(query: string, includeOpenSource: boolean): Promise<{
  products: ProductResult[];
  openSourceTools: OpenSourceResult[];
}> {
  // Search commercial products
  const products = await prisma.product.findMany({
    where: {
      OR: [
        { name: { contains: query, mode: "insensitive" } },
        { tagline: { contains: query, mode: "insensitive" } },
        { description: { contains: query, mode: "insensitive" } },
        { tags: { contains: query, mode: "insensitive" } },
      ],
    },
    select: {
      id: true,
      name: true,
      tagline: true,
      description: true,
      website: true,
      category: true,
      businessCategory: true,
      source: true,
      logo: true,
      upvotes: true,
    },
    take: 20,
  });

  let openSourceTools: OpenSourceResult[] = [];
  
  if (includeOpenSource) {
    const openSourceRaw = await prisma.openSourceTool.findMany({
      where: {
        OR: [
          { name: { contains: query, mode: "insensitive" } },
          { tagline: { contains: query, mode: "insensitive" } },
          { description: { contains: query, mode: "insensitive" } },
          { tags: { contains: query, mode: "insensitive" } },
        ],
      },
      select: {
        id: true,
        name: true,
        tagline: true,
        description: true,
        repoUrl: true,
        spaceUrl: true,
        source: true,
        logo: true,
        likes: true,
      },
      take: 20,
    });
    openSourceTools = openSourceRaw.map(t => ({
      id: t.id,
      name: t.name,
      tagline: t.tagline,
      description: t.description,
      website: t.repoUrl || t.spaceUrl,
      source: t.source,
      logo: t.logo,
      likes: t.likes,
    }));
  }

  return { products, openSourceTools };
}

// Directory search constants
const DIRECTORY_DOMAINS = [
  "topai.tools",
  "toolpilot.ai",
  "futuretools.io",
  "theresanaiforthat.com"
];

async function searchDirectories(userNeed: string): Promise<TavilyResult[]> {
  const apiKey = process.env.TAVILY_API_KEY;
  if (!apiKey) return [];

  try {
    // Search specifically within high-quality directories
    const searchQuery = `site:${DIRECTORY_DOMAINS.join(" OR site:")} ${userNeed}`;
    
    const response = await fetch(TAVILY_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: apiKey,
        query: searchQuery,
        search_depth: "basic",
        include_raw_content: false,
        max_results: 5, // Focused search
      }),
    });

    if (!response.ok) return [];

    const data = await response.json();
    return data.results || [];
  } catch (error) {
    console.error("[Discover] Directory search error:", error);
    return [];
  }
}

async function searchTavily(userNeed: string): Promise<TavilyResult[]> {
  const apiKey = process.env.TAVILY_API_KEY;
  if (!apiKey) return [];

  try {
    // Convert user need into a search query
    const searchQuery = `${userNeed} software SaaS`;
    
    const response = await fetch(TAVILY_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: apiKey,
        query: searchQuery,
        search_depth: "basic",
        include_raw_content: false, // We just need snippets
        exclude_domains: [
          "github.com", "medium.com", "linkedin.com", "twitter.com",
          "youtube.com", "reddit.com", "wikipedia.org", "techcrunch.com",
          "forbes.com", "g2.com", "capterra.com", "pinterest.com"
        ],
        max_results: 10,
      }),
    });

    if (!response.ok) return [];

    const data = await response.json();
    return data.results || [];
  } catch (error) {
    console.error("[Discover] Tavily search error:", error);
    return [];
  }
}

async function scoreWithAI(
  userNeed: string,
  tools: { name: string; tagline: string | null; description: string | null; signals?: CapabilitySignals }[]
): Promise<Map<string, { score: number; reason: string }>> {
  const results = new Map<string, { score: number; reason: string }>();
  
  if (!process.env.GEMINI_API_KEY || tools.length === 0) {
    // Fallback: basic keyword matching + heuristic boost
    const keywords = userNeed.toLowerCase().split(/\s+/);
    for (const tool of tools) {
      const text = `${tool.name} ${tool.tagline || ""} ${tool.description || ""}`.toLowerCase();
      let matches = keywords.filter(k => k.length > 3 && text.includes(k)).length;
      
      // Heuristic boost if we have signals
      if (tool.signals?.hasIntegrationVerb && tool.signals?.hasProvider) {
        matches += 3;
      }

      const score = Math.min(90, 30 + matches * 15);
      results.set(tool.name, { score, reason: "Keyword match (fallback)" });
    }
    return results;
  }

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    
    // Process tools in batches to avoid token limits (though 2.0 has large context)
    // For now, simple loop is fine as we have max ~30 items
    for (const tool of tools) {
        const signalsStr = tool.signals ? 
            `Integration Verbs: [${tool.signals.verbs.join(", ")}], Providers: [${tool.signals.providers.join(", ")}]` : 
            "None detected";

        const prompt = RELEVANCE_PROMPT
            .replace("{userNeed}", userNeed)
            .replace("{toolName}", tool.name)
            .replace("{toolTagline}", tool.tagline || "N/A")
            .replace("{toolDescription}", (tool.description || "").slice(0, 1000)) // Pass more context
            .replace("{signals}", signalsStr);

        try {
            const result = await model.generateContent(prompt);
            const responseText = result.response.text();
            // Clean up code blocks if present
            const cleanJson = responseText.replace(/```json/g, "").replace(/```/g, "").trim();
            const parsed = JSON.parse(cleanJson);
            results.set(tool.name, { score: parsed.score, reason: parsed.reason });
        } catch (e) {
            console.error(`[Discover] Failed to score ${tool.name}:`, e);
            results.set(tool.name, { score: 40, reason: "Scoring failed" });
        }
    }

  } catch (error) {
    console.error("[Discover] AI scoring error:", error);
    // Fallback to basic scoring
    for (const tool of tools) {
      results.set(tool.name, { score: 50, reason: "Could not score with AI" });
    }
  }

  return results;
}

function extractProductFromTavily(result: TavilyResult): {
  name: string;
  tagline: string;
  website: string;
  description: string;
} | null {
  // Skip listicles
  const listiclePatterns = [
    /^(the\s+)?\d+\s+(best|top)/i,
    /best\s+[\w\s]+\s+(for|in)\s+\d{4}/i,
    /top\s+\d+/i,
  ];
  
  if (listiclePatterns.some(p => p.test(result.title))) {
    return null;
  }

  // Skip blog URLs
  if (/\/(blog|article|learn|guide|comparison)\//i.test(result.url)) {
    return null;
  }

  // Extract name from title
  const name = result.title
    .replace(/\s*[\|\-\u2013\u2014]\s*(AI|Tool|Platform|Software|Pricing|Home).*$/i, "")
    .replace(/\s*(Official Site|Homepage).*$/i, "")
    .trim();

  if (name.length < 2 || name.length > 50) return null;

  return {
    name,
    tagline: result.content.split(/[.!?]/)[0].trim().slice(0, 150),
    website: result.url,
    description: result.content // Keep full content for AI
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { query, includeOpenSource = false, searchLive = true } = body;

    if (!query || typeof query !== "string" || query.length < 3) {
      return NextResponse.json(
        { error: "Query must be at least 3 characters" },
        { status: 400 }
      );
    }

    console.log(`[Discover] Query: "${query}", includeOpenSource: ${includeOpenSource}`);

    // Step 1: Search existing database
    const { products, openSourceTools } = await searchExistingProducts(query, includeOpenSource);
    console.log(`[Discover] Found ${products.length} products, ${openSourceTools.length} open source tools`);

    // Step 2: Optionally search Tavily for live results (General + Directories)
    let tavilyResults: TavilyResult[] = [];
    let directoryResults: TavilyResult[] = [];
    
    if (searchLive && process.env.TAVILY_API_KEY) {
      // Run general and directory searches in parallel
      const [general, directories] = await Promise.all([
        searchTavily(query),
        searchDirectories(query)
      ]);
      tavilyResults = general;
      directoryResults = directories;
      console.log(`[Discover] Found ${tavilyResults.length} general + ${directoryResults.length} directory results`);
    }

    // Step 3: Combine all tools for AI scoring
    const allTools: { 
        name: string; 
        tagline: string | null; 
        description: string | null; 
        source: string;
        signals: CapabilitySignals 
    }[] = [];
    
    // Add database products
    for (const p of products) {
      const fullText = `${p.name} ${p.tagline || ""} ${p.description || ""}`;
      allTools.push({
        name: p.name,
        tagline: p.tagline,
        description: p.description,
        source: "database",
        signals: extractCapabilitySignals(fullText)
      });
    }

    // Add open source tools
    for (const t of openSourceTools) {
      const fullText = `${t.name} ${t.tagline || ""} ${t.description || ""}`;
      allTools.push({
        name: t.name,
        tagline: t.tagline,
        description: t.description,
        source: "opensource",
        signals: extractCapabilitySignals(fullText)
      });
    }

    // Add Tavily results (extract product info)
    const processedUrls = new Set<string>();
    const tavilyProducts: { name: string; tagline: string; website: string; description: string; signals: CapabilitySignals; source: string }[] = [];
    
    // Helper to process raw results
    const processRawResults = (results: TavilyResult[], source: string) => {
      for (const r of results) {
        const extracted = extractProductFromTavily(r);
        if (extracted) {
          // Don't add duplicates (check URL and name)
          const isDupe = processedUrls.has(extracted.website) || 
            allTools.some(t => t.name.toLowerCase() === extracted.name.toLowerCase()) ||
            products.some(p => p.website === extracted.website);
            
          if (!isDupe) {
              processedUrls.add(extracted.website);
              const signals = extractCapabilitySignals(`${extracted.name} ${extracted.tagline} ${extracted.description}`);
              tavilyProducts.push({ ...extracted, signals, source });
              allTools.push({
                  name: extracted.name,
                  tagline: extracted.tagline,
                  description: extracted.description,
                  source,
                  signals
              });
          }
        }
      }
    };

    processRawResults(tavilyResults, "TAVILY_LIVE");
    processRawResults(directoryResults, "DIRECTORY"); // We'll map this to a label in UI

    // Step 4: Score with AI (Parallel + Heuristics)
    const scores = await scoreWithAI(query, allTools);

    // Step 5: Build final results
    const results: DiscoveryResult[] = [];

    // Add database products
    for (const p of products) {
      const scoreData = scores.get(p.name) || { score: 50, reason: "No AI scoring" };
      results.push({
        id: p.id,
        name: p.name,
        tagline: p.tagline,
        description: p.description,
        website: p.website,
        category: p.category,
        businessCategory: p.businessCategory,
        source: p.source,
        relevanceScore: scoreData.score,
        relevanceReason: scoreData.reason,
        isOpenSource: false,
        logo: p.logo,
        upvotes: p.upvotes || undefined,
      });
    }

    // Add open source tools
    for (const t of openSourceTools) {
      const scoreData = scores.get(t.name) || { score: 50, reason: "No AI scoring" };
      results.push({
        id: t.id,
        name: t.name,
        tagline: t.tagline,
        description: t.description,
        website: t.website,
        category: null,
        businessCategory: null,
        source: t.source,
        relevanceScore: scoreData.score,
        relevanceReason: scoreData.reason,
        isOpenSource: true,
        logo: t.logo,
        stars: t.likes || undefined,
      });
    }

    // Add Tavily/Directory discoveries
    for (const t of tavilyProducts) {
      const scoreData = scores.get(t.name) || { score: 50, reason: "No AI scoring" };
      results.push({
        id: `tavily-${Buffer.from(t.website).toString("base64").slice(0, 10)}`,
        name: t.name,
        tagline: t.tagline,
        description: t.description, // Return fuller description for UI context
        website: t.website,
        category: null,
        businessCategory: null,
        source: t.source,
        relevanceScore: scoreData.score,
        relevanceReason: scoreData.reason,
        isOpenSource: false,
      });
    }

    // Sort by relevance score
    results.sort((a, b) => b.relevanceScore - a.relevanceScore);

    // Filter to only relevant results (score >= 40)
    // Stricter filtering for top results
    const relevantResults = results.filter(r => r.relevanceScore >= 40);

    return NextResponse.json({
      query,
      totalResults: relevantResults.length,
      results: relevantResults.slice(0, 15), // Top 15 results
      includesOpenSource: includeOpenSource,
      searchedLive: searchLive && !!process.env.TAVILY_API_KEY,
    });

  } catch (error) {
    console.error("[Discover] Error:", error);
    return NextResponse.json(
      { error: "Discovery failed" },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: "Use POST with { query: string, includeOpenSource?: boolean }",
  });
}