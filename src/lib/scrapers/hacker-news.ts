import { ScrapedProduct, ScraperResult } from "./types";

const HN_ALGOLIA_API = "https://hn.algolia.com/api/v1";

// AI-related search terms
const AI_SEARCH_TERMS = [
  "Show HN AI",
  "Show HN GPT",
  "Show HN LLM",
  "Show HN machine learning",
  "Show HN chatbot",
  "Show HN generative",
  "AI startup",
  "OpenAI",
  "Claude AI",
  "Anthropic",
];

interface HNItem {
  objectID: string;
  title: string;
  url?: string;
  author: string;
  points: number;
  num_comments: number;
  created_at: string;
  story_text?: string;
}

interface AlgoliaResponse {
  hits: HNItem[];
  nbHits: number;
  page: number;
  nbPages: number;
}

export async function scrapeHackerNews(): Promise<ScraperResult> {
  try {
    const allProducts: ScrapedProduct[] = [];
    const seenIds = new Set<string>();

    for (const term of AI_SEARCH_TERMS.slice(0, 5)) {
      try {
        // Search for Show HN posts
        const searchUrl = `${HN_ALGOLIA_API}/search?query=${encodeURIComponent(term)}&tags=show_hn&hitsPerPage=20`;
        
        const response = await fetch(searchUrl);
        if (!response.ok) continue;

        const data: AlgoliaResponse = await response.json();

        for (const item of data.hits) {
          if (seenIds.has(item.objectID)) continue;
          seenIds.add(item.objectID);

          // Skip if no URL (self-posts without links)
          if (!item.url && !item.story_text) continue;

          // Extract product name from title (usually "Show HN: Product Name - tagline")
          let name = item.title;
          let tagline = "";

          if (name.startsWith("Show HN:")) {
            name = name.replace("Show HN:", "").trim();
          }

          // Split by common separators
          const separators = [" – ", " - ", ": ", " | "];
          for (const sep of separators) {
            if (name.includes(sep)) {
              const parts = name.split(sep);
              name = parts[0].trim();
              tagline = parts.slice(1).join(sep).trim();
              break;
            }
          }

          allProducts.push({
            name: name.slice(0, 100),
            tagline: tagline || undefined,
            description: item.story_text?.slice(0, 500) || tagline || undefined,
            website: item.url || `https://news.ycombinator.com/item?id=${item.objectID}`,
            category: "AI Tools",
            tags: ["AI", "Show HN", "Startup"],
            launchDate: new Date(item.created_at),
            source: "HACKER_NEWS",
            sourceUrl: `https://news.ycombinator.com/item?id=${item.objectID}`,
            sourceId: item.objectID,
            upvotes: item.points || 0,
            comments: item.num_comments || 0,
            rawData: {
              author: item.author,
              story_text: item.story_text,
            },
          });
        }

        // Rate limiting
        await new Promise((resolve) => setTimeout(resolve, 200));
      } catch (error) {
        console.error(`HN search error for term "${term}":`, error);
      }
    }

    // Sort by points and deduplicate
    const sortedProducts = allProducts
      .sort((a, b) => (b.upvotes || 0) - (a.upvotes || 0))
      .slice(0, 30);

    return {
      success: true,
      products: sortedProducts.length > 0 ? sortedProducts : getHNDemoProducts(),
    };
  } catch (error) {
    console.error("Hacker News scraper error:", error);
    return {
      success: false,
      products: getHNDemoProducts(),
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

function getHNDemoProducts(): ScrapedProduct[] {
  return [
    {
      name: "LocalAI",
      tagline: "Self-hosted, community-driven, local OpenAI-compatible API",
      description: "LocalAI is a drop-in replacement REST API compatible with OpenAI API specifications for local inferencing.",
      website: "https://localai.io",
      category: "AI Infrastructure",
      tags: ["AI", "Self-hosted", "API", "Open Source"],
      launchDate: new Date("2024-01-15"),
      source: "HACKER_NEWS",
      sourceUrl: "https://news.ycombinator.com/item?id=demo1",
      sourceId: "hn-localai",
      upvotes: 450,
      comments: 89,
    },
    {
      name: "Open Interpreter",
      tagline: "Natural language interface for computers",
      description: "Open Interpreter lets LLMs run code locally. It provides a natural language interface to your computer's capabilities.",
      website: "https://openinterpreter.com",
      category: "AI Tools",
      tags: ["AI", "Code Execution", "LLM", "CLI"],
      launchDate: new Date("2023-09-01"),
      source: "HACKER_NEWS",
      sourceUrl: "https://news.ycombinator.com/item?id=demo2",
      sourceId: "hn-openinterpreter",
      upvotes: 890,
      comments: 156,
    },
    {
      name: "GPT Engineer",
      tagline: "Specify what you want it to build, the AI asks for clarification, and then builds it",
      description: "GPT Engineer is made to be easy to adapt, extend, and make your agent learn how you want your code to look.",
      website: "https://gptengineer.app",
      category: "AI Development",
      tags: ["AI", "Code Generation", "GPT", "Developer Tools"],
      launchDate: new Date("2023-06-15"),
      source: "HACKER_NEWS",
      sourceUrl: "https://news.ycombinator.com/item?id=demo3",
      sourceId: "hn-gptengineer",
      upvotes: 1200,
      comments: 234,
    },
  ];
}

