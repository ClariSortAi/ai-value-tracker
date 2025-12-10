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

// AI prompt to score relevance
const RELEVANCE_PROMPT = `You are a product recommendation expert. Given a user's need and a list of AI tools, score each tool's relevance to that need.

USER'S NEED: {userNeed}

TOOLS TO EVALUATE:
{toolsList}

For each tool, provide:
1. A relevance score from 0-100 (100 = perfect match)
2. A brief reason (1 sentence) why it does or doesn't match

Response format (JSON array):
[
  {"name": "ToolName", "score": 85, "reason": "Directly addresses meeting notes with AI transcription"},
  ...
]

Be strict but fair. Only high scores (70+) for tools that genuinely solve the user's stated need.`;

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

async function searchTavily(userNeed: string): Promise<TavilyResult[]> {
  const apiKey = process.env.TAVILY_API_KEY;
  if (!apiKey) return [];

  try {
    // Convert user need into a search query
    const searchQuery = `${userNeed} AI tool software SaaS`;
    
    const response = await fetch(TAVILY_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: apiKey,
        query: searchQuery,
        search_depth: "basic",
        exclude_domains: [
          "github.com", "medium.com", "linkedin.com", "twitter.com",
          "youtube.com", "reddit.com", "wikipedia.org", "techcrunch.com",
          "forbes.com", "g2.com", "capterra.com"
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
  tools: { name: string; tagline: string | null; description: string | null }[]
): Promise<Map<string, { score: number; reason: string }>> {
  const results = new Map<string, { score: number; reason: string }>();
  
  if (!process.env.GEMINI_API_KEY || tools.length === 0) {
    // Fallback: basic keyword matching
    const keywords = userNeed.toLowerCase().split(/\s+/);
    for (const tool of tools) {
      const text = `${tool.name} ${tool.tagline || ""} ${tool.description || ""}`.toLowerCase();
      const matches = keywords.filter(k => k.length > 3 && text.includes(k)).length;
      const score = Math.min(90, 30 + matches * 15);
      results.set(tool.name, { score, reason: "Keyword match" });
    }
    return results;
  }

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    
    const toolsList = tools.map((t, i) => 
      `${i + 1}. ${t.name}: ${t.tagline || t.description?.slice(0, 100) || "No description"}`
    ).join("\n");

    const prompt = RELEVANCE_PROMPT
      .replace("{userNeed}", userNeed)
      .replace("{toolsList}", toolsList);

    const result = await model.generateContent(prompt);
    const response = result.response.text();
    
    const jsonMatch = response.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      for (const item of parsed) {
        results.set(item.name, { score: item.score, reason: item.reason });
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

    // Step 2: Optionally search Tavily for live results
    let tavilyResults: TavilyResult[] = [];
    if (searchLive && process.env.TAVILY_API_KEY) {
      tavilyResults = await searchTavily(query);
      console.log(`[Discover] Found ${tavilyResults.length} Tavily results`);
    }

    // Step 3: Combine all tools for AI scoring
    const allTools: { name: string; tagline: string | null; description: string | null; source: string }[] = [];
    
    // Add database products
    for (const p of products) {
      allTools.push({
        name: p.name,
        tagline: p.tagline,
        description: p.description,
        source: "database",
      });
    }

    // Add open source tools
    for (const t of openSourceTools) {
      allTools.push({
        name: t.name,
        tagline: t.tagline,
        description: t.description,
        source: "opensource",
      });
    }

    // Add Tavily results (extract product info)
    const tavilyProducts: { name: string; tagline: string; website: string }[] = [];
    for (const r of tavilyResults) {
      const extracted = extractProductFromTavily(r);
      if (extracted) {
        // Don't add duplicates
        const isDupe = allTools.some(t => 
          t.name.toLowerCase() === extracted.name.toLowerCase() ||
          products.some(p => p.website === extracted.website)
        );
        if (!isDupe) {
          tavilyProducts.push(extracted);
          allTools.push({
            name: extracted.name,
            tagline: extracted.tagline,
            description: null,
            source: "tavily",
          });
        }
      }
    }

    // Step 4: Score with AI
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

    // Add Tavily discoveries
    for (const t of tavilyProducts) {
      const scoreData = scores.get(t.name) || { score: 50, reason: "No AI scoring" };
      results.push({
        id: `tavily-${Buffer.from(t.website).toString("base64").slice(0, 10)}`,
        name: t.name,
        tagline: t.tagline,
        description: null,
        website: t.website,
        category: null,
        businessCategory: null,
        source: "TAVILY_LIVE",
        relevanceScore: scoreData.score,
        relevanceReason: scoreData.reason,
        isOpenSource: false,
      });
    }

    // Sort by relevance score
    results.sort((a, b) => b.relevanceScore - a.relevanceScore);

    // Filter to only relevant results (score >= 40)
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

