import { ScrapedProduct, ScraperResult } from "./types";

const PRODUCT_HUNT_API = "https://api.producthunt.com/v2/api/graphql";

// AI-related topics to filter
const AI_TOPICS = [
  "artificial-intelligence",
  "machine-learning",
  "chatgpt",
  "openai",
  "generative-ai",
  "llm",
  "ai-tools",
  "ai-assistant",
  "deep-learning",
  "natural-language-processing",
  "computer-vision",
  "ai-writing",
  "ai-image-generation",
];

interface ProductHuntPost {
  id: string;
  name: string;
  tagline: string;
  description: string;
  url: string;
  website: string;
  thumbnail?: {
    url: string;
  };
  topics: {
    edges: Array<{
      node: {
        slug: string;
        name: string;
      };
    }>;
  };
  votesCount: number;
  commentsCount: number;
  createdAt: string;
}

const POSTS_QUERY = `
  query GetPosts($first: Int!, $after: String, $topic: String) {
    posts(first: $first, after: $after, topic: $topic) {
      edges {
        node {
          id
          name
          tagline
          description
          url
          website
          thumbnail {
            url
          }
          topics {
            edges {
              node {
                slug
                name
              }
            }
          }
          votesCount
          commentsCount
          createdAt
        }
        cursor
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
`;

export async function scrapeProductHunt(): Promise<ScraperResult> {
  const apiToken = process.env.PRODUCT_HUNT_TOKEN;
  
  if (!apiToken) {
    console.log("[ProductHunt] No API token found, using demo data");
    return {
      success: true,
      products: getDemoProducts(),
    };
  }

  console.log("[ProductHunt] Fetching AI products from API...");

  try {
    const allProducts: ScrapedProduct[] = [];

    // Scrape AI-related topics
    for (const topic of AI_TOPICS.slice(0, 3)) { // Limit to avoid rate limits
      const response = await fetch(PRODUCT_HUNT_API, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiToken}`,
        },
        body: JSON.stringify({
          query: POSTS_QUERY,
          variables: {
            first: 20,
            topic,
          },
        }),
      });

      if (!response.ok) {
        console.error(`Product Hunt API error for topic ${topic}:`, response.statusText);
        continue;
      }

      const data = await response.json();
      const posts = data.data?.posts?.edges || [];

      for (const { node: post } of posts as Array<{ node: ProductHuntPost }>) {
        const topics = post.topics.edges.map((e) => e.node.name);
        
        // Filter for AI-related products
        const isAI = post.topics.edges.some(
          (e) => AI_TOPICS.includes(e.node.slug) || 
                 e.node.name.toLowerCase().includes("ai") ||
                 post.tagline.toLowerCase().includes("ai") ||
                 post.name.toLowerCase().includes("ai")
        );

        if (!isAI) continue;

        allProducts.push({
          name: post.name,
          tagline: post.tagline,
          description: post.description,
          website: post.website,
          logo: post.thumbnail?.url,
          category: topics[0] || "AI Tools",
          tags: topics.slice(0, 5),
          launchDate: new Date(post.createdAt),
          source: "PRODUCT_HUNT",
          sourceUrl: post.url,
          sourceId: post.id,
          upvotes: post.votesCount,
          comments: post.commentsCount,
          rawData: post as unknown as Record<string, unknown>,
        });
      }

      // Rate limiting
      await new Promise((resolve) => setTimeout(resolve, 200));
    }

    // Deduplicate by sourceId
    const uniqueProducts = Array.from(
      new Map(allProducts.map((p) => [p.sourceId, p])).values()
    );

    return {
      success: true,
      products: uniqueProducts,
    };
  } catch (error) {
    console.error("Product Hunt scraper error:", error);
    return {
      success: false,
      products: [],
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// Demo products for development/demo
function getDemoProducts(): ScrapedProduct[] {
  return [
    {
      name: "Claude AI",
      tagline: "AI assistant that's helpful, harmless, and honest",
      description: "Claude is an AI assistant created by Anthropic to be helpful, harmless, and honest. It can help with analysis, writing, coding, math, and more.",
      website: "https://claude.ai",
      logo: "https://ph-files.imgix.net/claude-logo.png",
      category: "AI Assistants",
      tags: ["AI", "Assistant", "LLM", "Chatbot"],
      launchDate: new Date("2024-03-01"),
      source: "PRODUCT_HUNT",
      sourceUrl: "https://www.producthunt.com/products/claude-ai",
      sourceId: "demo-claude",
      upvotes: 2500,
      comments: 340,
    },
    {
      name: "Cursor",
      tagline: "The AI-first code editor",
      description: "Cursor is a code editor built for programming with AI. It features AI-powered code completion, chat, and editing capabilities.",
      website: "https://cursor.com",
      logo: "https://ph-files.imgix.net/cursor-logo.png",
      category: "Developer Tools",
      tags: ["AI", "Code Editor", "IDE", "Programming"],
      launchDate: new Date("2024-01-15"),
      source: "PRODUCT_HUNT",
      sourceUrl: "https://www.producthunt.com/products/cursor",
      sourceId: "demo-cursor",
      upvotes: 3200,
      comments: 450,
    },
    {
      name: "Midjourney",
      tagline: "AI-powered image generation",
      description: "Midjourney is an AI-powered tool that generates images from natural language descriptions. Create stunning artwork with simple prompts.",
      website: "https://midjourney.com",
      logo: "https://ph-files.imgix.net/midjourney-logo.png",
      category: "AI Image Generation",
      tags: ["AI", "Image Generation", "Art", "Creative"],
      launchDate: new Date("2023-06-01"),
      source: "PRODUCT_HUNT",
      sourceUrl: "https://www.producthunt.com/products/midjourney",
      sourceId: "demo-midjourney",
      upvotes: 5600,
      comments: 890,
    },
    {
      name: "Perplexity AI",
      tagline: "AI-powered search engine",
      description: "Perplexity is an AI search engine that provides accurate answers with cited sources. Get answers, not just links.",
      website: "https://perplexity.ai",
      logo: "https://ph-files.imgix.net/perplexity-logo.png",
      category: "AI Search",
      tags: ["AI", "Search", "Research", "Knowledge"],
      launchDate: new Date("2024-02-10"),
      source: "PRODUCT_HUNT",
      sourceUrl: "https://www.producthunt.com/products/perplexity-ai",
      sourceId: "demo-perplexity",
      upvotes: 4100,
      comments: 520,
    },
    {
      name: "v0 by Vercel",
      tagline: "Generate UI with AI",
      description: "v0 is a generative user interface system by Vercel. Describe what you want to build, and v0 generates code using open-source tools.",
      website: "https://v0.dev",
      logo: "https://ph-files.imgix.net/v0-logo.png",
      category: "AI Development",
      tags: ["AI", "UI", "Code Generation", "React"],
      launchDate: new Date("2024-04-01"),
      source: "PRODUCT_HUNT",
      sourceUrl: "https://www.producthunt.com/products/v0",
      sourceId: "demo-v0",
      upvotes: 2800,
      comments: 310,
    },
  ];
}

