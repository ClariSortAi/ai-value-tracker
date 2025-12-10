import { ScrapedProduct, ScraperResult } from "./types";

// FutureTools.io AI directory scraper
// This is a curated AI tools directory with good category classification

// Category mappings from FutureTools to our businessCategory
const FUTURETOOLS_CATEGORIES: Record<string, { category: string; businessCategory: string; queries: string[] }> = {
  marketing: {
    category: "Marketing",
    businessCategory: "marketing",
    queries: [
      "marketing",
      "copywriting",
      "social-media",
      "email",
      "seo",
      "content-writing",
      "advertising",
    ],
  },
  sales: {
    category: "Sales",
    businessCategory: "sales",
    queries: [
      "sales",
      "lead-generation",
      "crm",
      "outreach",
    ],
  },
  customer_service: {
    category: "Customer Service",
    businessCategory: "customer_service",
    queries: [
      "customer-support",
      "chatbots",
      "chat",
      "support",
    ],
  },
  productivity: {
    category: "Productivity",
    businessCategory: "productivity",
    queries: [
      "productivity",
      "automation",
      "workflow",
      "writing",
      "documents",
      "spreadsheets",
      "scheduling",
      "meetings",
    ],
  },
};

// Demo products with realistic data structure
// In production, this would be replaced with actual scraping
// FutureTools requires JavaScript rendering, so we'd use Firecrawl or Playwright
function getDemoProducts(): ScrapedProduct[] {
  return [
    // Marketing tools
    {
      name: "Jasper",
      tagline: "AI content platform that helps teams create high-quality content faster",
      description: "Jasper is an AI marketing platform that helps teams create on-brand content 10x faster. Write blog posts, social media, ads, emails, and more with AI that understands your brand voice.",
      website: "https://jasper.ai",
      logo: "https://jasper.ai/favicon.ico",
      category: "Marketing",
      tags: ["marketing", "copywriting", "AI", "content"],
      launchDate: new Date("2021-01-15"),
      source: "THERES_AN_AI",
      sourceUrl: "https://futuretools.io/tools/jasper",
      sourceId: "futuretools-jasper",
      upvotes: 500,
    },
    {
      name: "Copy.ai",
      tagline: "AI-powered copywriting and content creation platform",
      description: "Copy.ai helps marketers and writers create compelling copy in seconds. Generate blog posts, social media content, ad copy, and more using AI.",
      website: "https://copy.ai",
      logo: "https://copy.ai/favicon.ico",
      category: "Marketing",
      tags: ["marketing", "copywriting", "AI", "content"],
      launchDate: new Date("2020-11-01"),
      source: "THERES_AN_AI",
      sourceUrl: "https://futuretools.io/tools/copy-ai",
      sourceId: "futuretools-copyai",
      upvotes: 450,
    },
    {
      name: "Surfer SEO",
      tagline: "AI-powered SEO tool for optimizing content and improving rankings",
      description: "Surfer SEO helps you write content that ranks. Analyze your competitors, get AI-powered suggestions, and optimize your content for search engines.",
      website: "https://surferseo.com",
      logo: "https://surferseo.com/favicon.ico",
      category: "Marketing",
      tags: ["marketing", "SEO", "AI", "content optimization"],
      launchDate: new Date("2019-06-01"),
      source: "THERES_AN_AI",
      sourceUrl: "https://futuretools.io/tools/surfer-seo",
      sourceId: "futuretools-surferseo",
      upvotes: 380,
    },
    // Sales tools
    {
      name: "Apollo.io",
      tagline: "Sales intelligence and engagement platform powered by AI",
      description: "Apollo.io is a sales intelligence platform with accurate data on 275M+ contacts. Find leads, enrich your CRM, and automate outreach with AI.",
      website: "https://apollo.io",
      logo: "https://apollo.io/favicon.ico",
      category: "Sales",
      tags: ["sales", "lead generation", "AI", "CRM"],
      launchDate: new Date("2015-01-01"),
      source: "THERES_AN_AI",
      sourceUrl: "https://futuretools.io/tools/apollo",
      sourceId: "futuretools-apollo",
      upvotes: 420,
    },
    {
      name: "Gong",
      tagline: "Revenue intelligence platform that captures customer interactions",
      description: "Gong captures and analyzes customer interactions to help sales teams win more deals. AI-powered insights on what works and what doesn't.",
      website: "https://gong.io",
      logo: "https://gong.io/favicon.ico",
      category: "Sales",
      tags: ["sales", "revenue intelligence", "AI", "analytics"],
      launchDate: new Date("2015-05-01"),
      source: "THERES_AN_AI",
      sourceUrl: "https://futuretools.io/tools/gong",
      sourceId: "futuretools-gong",
      upvotes: 480,
    },
    {
      name: "Outreach",
      tagline: "AI-powered sales engagement platform",
      description: "Outreach helps sales teams automate and optimize outreach sequences. AI suggests the best times, channels, and messaging for each prospect.",
      website: "https://outreach.io",
      logo: "https://outreach.io/favicon.ico",
      category: "Sales",
      tags: ["sales", "outreach", "AI", "engagement"],
      launchDate: new Date("2014-01-01"),
      source: "THERES_AN_AI",
      sourceUrl: "https://futuretools.io/tools/outreach",
      sourceId: "futuretools-outreach",
      upvotes: 400,
    },
    // Customer Service tools
    {
      name: "Intercom",
      tagline: "AI-first customer service platform",
      description: "Intercom is a customer service platform with AI chatbots, help desk, and proactive support. Resolve more issues with less effort using Fin AI.",
      website: "https://intercom.com",
      logo: "https://intercom.com/favicon.ico",
      category: "Customer Service",
      tags: ["customer service", "chatbot", "AI", "support"],
      launchDate: new Date("2011-08-01"),
      source: "THERES_AN_AI",
      sourceUrl: "https://futuretools.io/tools/intercom",
      sourceId: "futuretools-intercom",
      upvotes: 520,
    },
    {
      name: "Zendesk AI",
      tagline: "AI-powered customer service and support platform",
      description: "Zendesk AI helps support teams resolve issues faster. Automatic ticket routing, AI agents, and intelligent suggestions for agents.",
      website: "https://zendesk.com",
      logo: "https://zendesk.com/favicon.ico",
      category: "Customer Service",
      tags: ["customer service", "helpdesk", "AI", "support"],
      launchDate: new Date("2007-11-01"),
      source: "THERES_AN_AI",
      sourceUrl: "https://futuretools.io/tools/zendesk-ai",
      sourceId: "futuretools-zendesk",
      upvotes: 490,
    },
    {
      name: "Freshdesk",
      tagline: "AI-powered helpdesk software for customer support",
      description: "Freshdesk helps support teams manage tickets and automate responses with AI. Freddy AI handles common queries and assists agents.",
      website: "https://freshdesk.com",
      logo: "https://freshdesk.com/favicon.ico",
      category: "Customer Service",
      tags: ["customer service", "helpdesk", "AI", "ticketing"],
      launchDate: new Date("2010-06-01"),
      source: "THERES_AN_AI",
      sourceUrl: "https://futuretools.io/tools/freshdesk",
      sourceId: "futuretools-freshdesk",
      upvotes: 350,
    },
    // Productivity tools
    {
      name: "Notion AI",
      tagline: "AI-powered workspace for notes, docs, and project management",
      description: "Notion AI helps teams work faster with AI writing, summarization, and task automation. Build docs, wikis, and projects with AI assistance.",
      website: "https://notion.so",
      logo: "https://notion.so/favicon.ico",
      category: "Productivity",
      tags: ["productivity", "AI", "workspace", "docs"],
      launchDate: new Date("2016-01-01"),
      source: "THERES_AN_AI",
      sourceUrl: "https://futuretools.io/tools/notion-ai",
      sourceId: "futuretools-notion",
      upvotes: 600,
    },
    {
      name: "Otter.ai",
      tagline: "AI meeting assistant that records and transcribes meetings",
      description: "Otter.ai automatically transcribes meetings and generates summaries. Never miss action items with AI-powered meeting notes.",
      website: "https://otter.ai",
      logo: "https://otter.ai/favicon.ico",
      category: "Productivity",
      tags: ["productivity", "meetings", "AI", "transcription"],
      launchDate: new Date("2016-01-01"),
      source: "THERES_AN_AI",
      sourceUrl: "https://futuretools.io/tools/otter-ai",
      sourceId: "futuretools-otter",
      upvotes: 450,
    },
    {
      name: "Fireflies.ai",
      tagline: "AI meeting assistant for transcription and analysis",
      description: "Fireflies.ai automatically joins meetings, transcribes conversations, and extracts action items. AI search across all your meetings.",
      website: "https://fireflies.ai",
      logo: "https://fireflies.ai/favicon.ico",
      category: "Productivity",
      tags: ["productivity", "meetings", "AI", "transcription"],
      launchDate: new Date("2016-06-01"),
      source: "THERES_AN_AI",
      sourceUrl: "https://futuretools.io/tools/fireflies",
      sourceId: "futuretools-fireflies",
      upvotes: 420,
    },
    {
      name: "Mem",
      tagline: "AI-powered note-taking app that organizes your thoughts",
      description: "Mem uses AI to automatically organize your notes and surface relevant information when you need it. No folders, no tags - just write.",
      website: "https://mem.ai",
      logo: "https://mem.ai/favicon.ico",
      category: "Productivity",
      tags: ["productivity", "notes", "AI", "knowledge management"],
      launchDate: new Date("2020-01-01"),
      source: "THERES_AN_AI",
      sourceUrl: "https://futuretools.io/tools/mem",
      sourceId: "futuretools-mem",
      upvotes: 320,
    },
  ];
}

// Main scraper function
// Currently returns demo data; in production would use Firecrawl or Playwright
// to actually scrape FutureTools.io pages
export async function scrapeFutureTools(
  categories: string[] = ["marketing", "sales", "customer_service", "productivity"]
): Promise<ScraperResult> {
  console.log(`[FutureTools] Starting scrape for categories: ${categories.join(", ")}`);

  try {
    // Check if we have Firecrawl API key for live scraping
    const firecrawlKey = process.env.FIRECRAWL_API_KEY;
    
    if (firecrawlKey) {
      console.log("[FutureTools] Live scraping with Firecrawl (not implemented yet)");
      // TODO: Implement live scraping with Firecrawl
      // For now, fall through to demo data
    }

    // Return demo products for selected categories
    const demoProducts = getDemoProducts();
    const filteredProducts = demoProducts.filter(p => {
      const productCategory = p.category?.toLowerCase() || "";
      return categories.some(c => {
        const config = FUTURETOOLS_CATEGORIES[c];
        return config && (
          productCategory.includes(c.replace("_", " ")) ||
          config.category.toLowerCase() === productCategory
        );
      });
    });

    console.log(`[FutureTools] Returning ${filteredProducts.length} products`);

    return {
      success: true,
      products: filteredProducts,
    };

  } catch (error) {
    console.error("[FutureTools] Scrape error:", error);
    return {
      success: false,
      products: getDemoProducts(), // Fall back to demo on error
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// Export categories for testing
export { FUTURETOOLS_CATEGORIES };


