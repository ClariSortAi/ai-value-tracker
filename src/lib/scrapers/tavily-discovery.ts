import { ScrapedProduct, ScraperResult } from "./types";

// Tavily API for semantic search-based AI tool discovery
// Free tier: 1,000 searches/month - use wisely
const TAVILY_API_URL = "https://api.tavily.com/search";

// Category-specific discovery queries focused on COMMERCIAL SaaS products
// Each query is designed to find emerging AI tools in specific business categories
const CATEGORY_QUERIES: Record<string, string[]> = {
  marketing: [
    "AI marketing automation tool SaaS pricing",
    "AI content writing tool for marketers 2024",
    "AI email marketing platform startup",
    "AI social media management tool",
    "AI copywriting software for businesses",
    "AI brand management platform",
    "AI marketing analytics tool",
  ],
  sales: [
    "AI sales intelligence platform SaaS",
    "AI CRM tool automation pricing",
    "AI lead generation software startup",
    "AI sales outreach automation tool",
    "AI prospecting software for sales teams",
    "AI revenue intelligence platform",
    "AI pipeline management tool",
  ],
  customer_service: [
    "AI customer support chatbot SaaS",
    "AI helpdesk automation tool pricing",
    "AI ticket routing software",
    "AI customer success platform startup",
    "AI support agent tool for businesses",
    "AI contact center automation",
    "AI customer service analytics",
  ],
  productivity: [
    "AI workflow automation SaaS tool",
    "AI meeting assistant software pricing",
    "AI document processing platform",
    "AI task management tool startup",
    "AI project management automation",
    "AI scheduling assistant for teams",
    "AI collaboration tool for business",
  ],
};

// Domains to prioritize (indicates commercial products)
const PRIORITY_DOMAINS = [
  ".com",
  ".io",
  ".ai",
  ".co",
];

// Domains to exclude (not commercial products)
const EXCLUDED_DOMAINS = [
  "github.com",
  "medium.com",
  "linkedin.com",
  "twitter.com",
  "youtube.com",
  "reddit.com",
  "wikipedia.org",
  "techcrunch.com",
  "forbes.com",
  "g2.com", // Review site, not product
  "capterra.com", // Review site
  "producthunt.com", // Already scraping this
  "theres-an-ai.com", // Already scraping this
  "technologyadvice.com", // Blog/comparison site
  "hiverhq.com", // Their /blog/ articles
  "domo.com", // Their /learn/ articles
  "fritz.ai", // Blog site
  "zapier.com/blog", // Blog content
  "hubspot.com/blog", // Blog content
  "blog.", // Any blog subdomain
];

// URL paths that indicate blog/article content (not products)
const BLOG_URL_PATTERNS = [
  /\/blog\//i,
  /\/article\//i,
  /\/learn\//i,
  /\/resources?\//i,
  /\/guide\//i,
  /\/comparison\//i,
  /\/best-/i,
  /\/top-\d+/i,
  /\/review\//i,
  /\/news\//i,
];

// Title patterns that indicate listicles/articles (not products)
const LISTICLE_PATTERNS = [
  /^(the\s+)?\d+\s+(best|top|great)/i,
  /best\s+[\w\s]+\s+(for|in)\s+\d{4}/i,
  /top\s+\d+\s/i,
  /\d{4}\s+(guide|review|comparison|picks)/i,
  /picks?\s+(for\s+)?\d{4}/i,
  /platforms?\s+to\s+consider/i,
  /:\s*my\s+(top\s+)?\d+/i,
  /software\s+(for|in)\s+\d{4}/i,
  /alternatives?\s+to\s/i,
  /vs\.?\s+/i, // "X vs Y" comparisons
];

interface TavilySearchResult {
  title: string;
  url: string;
  content: string;
  score: number;
}

interface TavilyResponse {
  results: TavilySearchResult[];
}

function isExcludedDomain(url: string): boolean {
  try {
    const hostname = new URL(url).hostname.toLowerCase();
    return EXCLUDED_DOMAINS.some(domain => hostname.includes(domain));
  } catch {
    return true;
  }
}

function isBlogUrl(url: string): boolean {
  return BLOG_URL_PATTERNS.some(pattern => pattern.test(url));
}

function isListicleTitle(title: string): boolean {
  return LISTICLE_PATTERNS.some(pattern => pattern.test(title));
}

function isPriorityDomain(url: string): boolean {
  try {
    const hostname = new URL(url).hostname.toLowerCase();
    return PRIORITY_DOMAINS.some(ext => hostname.endsWith(ext));
  } catch {
    return false;
  }
}

function extractProductName(title: string, url: string): string | null {
  // CRITICAL: Reject listicle titles immediately
  if (isListicleTitle(title)) {
    console.log(`[Tavily] Rejected listicle title: "${title}"`);
    return null;
  }
  
  // Try to extract product name from title patterns
  // Pattern: "ProductName | Something" or "ProductName - Something"
  const pipeMatch = title.match(/^([^|\-\u2013\u2014]+)[\|\-\u2013\u2014]/);
  if (pipeMatch) {
    const candidate = pipeMatch[1].trim();
    // Don't accept generic prefixes
    if (!/^(plans?|pricing|home|about|blog|the|top|best|\d+)/i.test(candidate)) {
      return candidate;
    }
  }
  
  // Pattern: "Something | ProductName" (product name at end)
  const reversePipeMatch = title.match(/[\|\-\u2013\u2014]\s*([^|\-\u2013\u2014]+)$/);
  if (reversePipeMatch) {
    const candidate = reversePipeMatch[1].trim();
    // Don't accept generic suffixes
    if (!/^(ai|tool|platform|software|pricing|official|home|blog)/i.test(candidate)) {
      return candidate;
    }
  }
  
  // Try to extract from URL hostname
  try {
    const hostname = new URL(url).hostname;
    const parts = hostname.replace(/^www\./, '').split('.');
    if (parts.length >= 2) {
      const name = parts[0];
      // Capitalize first letter
      if (name.length >= 2 && name.length <= 20) {
        return name.charAt(0).toUpperCase() + name.slice(1);
      }
    }
  } catch {
    // URL parsing failed
  }
  
  // Clean the title as fallback
  const cleaned = title
    .replace(/\s*[\|\-\u2013\u2014]\s*(AI|Tool|Platform|Software|App|SaaS|Pricing|Review|Home).*$/i, "")
    .replace(/\s*(Official Site|Homepage|Website).*$/i, "")
    .replace(/^(Plans?\s*&?\s*)?Pricing\s*[\|\-]?\s*/i, "") // Remove "Pricing |" prefix
    .trim();
  
  // Reject if still looks like a listicle or generic
  if (cleaned.length < 2 || cleaned.length > 60 || isListicleTitle(cleaned)) {
    return null;
  }
  
  return cleaned;
}

function extractTagline(content: string): string {
  // Get first sentence, max 150 chars
  const firstSentence = content.split(/[.!?]/)[0].trim();
  return firstSentence.length > 150 ? firstSentence.slice(0, 147) + "..." : firstSentence;
}

async function searchTavily(query: string, category: string): Promise<ScrapedProduct[]> {
  const apiKey = process.env.TAVILY_API_KEY;
  
  if (!apiKey) {
    console.log("[Tavily] No API key, skipping search");
    return [];
  }

  try {
    const response = await fetch(TAVILY_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        api_key: apiKey,
        query,
        search_depth: "basic", // Use basic for faster, cheaper searches
        include_domains: [], // No restrictions
        exclude_domains: EXCLUDED_DOMAINS,
        max_results: 5, // Limit results per query to save quota
      }),
    });

    if (!response.ok) {
      console.error(`[Tavily] Search failed: ${response.status} ${response.statusText}`);
      return [];
    }

    const data: TavilyResponse = await response.json();
    const products: ScrapedProduct[] = [];

    for (const result of data.results) {
      // Skip excluded domains (double-check)
      if (isExcludedDomain(result.url)) {
        console.log(`[Tavily] Skipped excluded domain: ${result.url}`);
        continue;
      }

      // Skip blog/article URLs
      if (isBlogUrl(result.url)) {
        console.log(`[Tavily] Skipped blog URL: ${result.url}`);
        continue;
      }

      // Skip low relevance results
      if (result.score < 0.5) {
        continue;
      }

      // Extract product name - this may return null for listicles
      const name = extractProductName(result.title, result.url);
      if (!name) {
        console.log(`[Tavily] Could not extract valid product name from: "${result.title}"`);
        continue;
      }

      const tagline = extractTagline(result.content);

      // Skip if name is still invalid
      if (name.length < 2 || name.length > 50) {
        continue;
      }

      // Additional validation: check content doesn't indicate a listicle
      const contentLower = result.content.toLowerCase();
      if (contentLower.includes("top 10") || contentLower.includes("best tools") || 
          contentLower.includes("ranked") || contentLower.includes("alternatives to")) {
        console.log(`[Tavily] Skipped listicle content for: "${name}"`);
        continue;
      }

      products.push({
        name,
        tagline,
        description: result.content.slice(0, 500),
        website: result.url,
        category: mapCategoryToDisplay(category),
        tags: [category.replace("_", " "), "AI", "SaaS"],
        launchDate: new Date(), // Use current date as discovery date
        source: "TAVILY",
        sourceUrl: result.url,
        sourceId: `tavily-${Buffer.from(result.url).toString("base64").slice(0, 20)}`,
        upvotes: isPriorityDomain(result.url) ? 50 : 20, // Give priority domains a boost
      });
    }

    return products;

  } catch (error) {
    console.error(`[Tavily] Search error for query "${query}":`, error);
    return [];
  }
}

function mapCategoryToDisplay(category: string): string {
  const mapping: Record<string, string> = {
    marketing: "Marketing",
    sales: "Sales",
    customer_service: "Customer Service",
    productivity: "Productivity",
  };
  return mapping[category] || "AI Tools";
}

// Main scraper function - discovers commercial AI tools via Tavily search
export async function scrapeTavilyDiscovery(
  categoriesToSearch: string[] = ["marketing", "sales", "customer_service", "productivity"],
  queriesPerCategory: number = 2 // Limit queries to conserve API quota
): Promise<ScraperResult> {
  const apiKey = process.env.TAVILY_API_KEY;
  
  if (!apiKey) {
    console.log("[Tavily] No TAVILY_API_KEY set, returning empty results");
    return {
      success: true,
      products: [],
      error: "TAVILY_API_KEY not configured",
    };
  }

  console.log(`[Tavily] Starting discovery for categories: ${categoriesToSearch.join(", ")}`);

  try {
    const allProducts: ScrapedProduct[] = [];
    const seenUrls = new Set<string>();

    for (const category of categoriesToSearch) {
      const queries = CATEGORY_QUERIES[category];
      if (!queries) continue;

      // Take first N queries for each category
      const selectedQueries = queries.slice(0, queriesPerCategory);
      
      for (const query of selectedQueries) {
        console.log(`[Tavily] Searching: "${query}"`);
        
        const products = await searchTavily(query, category);
        
        for (const product of products) {
          // Dedupe by URL
          if (product.website && seenUrls.has(product.website)) {
            continue;
          }
          if (product.website) {
            seenUrls.add(product.website);
          }
          allProducts.push(product);
        }

        // Rate limiting - be respectful of the API
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    console.log(`[Tavily] Discovered ${allProducts.length} unique products`);

    return {
      success: true,
      products: allProducts,
    };

  } catch (error) {
    console.error("[Tavily] Discovery error:", error);
    return {
      success: false,
      products: [],
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// Export category queries for testing
export { CATEGORY_QUERIES };


