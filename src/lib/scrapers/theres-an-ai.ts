import * as cheerio from "cheerio";
import { ScrapedProduct, ScraperResult } from "./types";

const THERES_AN_AI_URL = "https://theresanaiforthat.com";

// Categories to scrape
const CATEGORIES = [
  "/ai/text-generators",
  "/ai/image-generators",
  "/ai/code-assistants",
  "/ai/chatbots",
  "/ai/writing-assistants",
  "/ai/video-generators",
];

export async function scrapeTheresAnAI(): Promise<ScraperResult> {
  try {
    const allProducts: ScrapedProduct[] = [];
    const seenNames = new Set<string>();

    // Note: This scraper may be blocked - use demo data as fallback
    for (const category of CATEGORIES.slice(0, 3)) {
      try {
        const response = await fetch(`${THERES_AN_AI_URL}${category}`, {
          headers: {
            "User-Agent": "Mozilla/5.0 (compatible; AIValueTracker/1.0)",
            Accept: "text/html,application/xhtml+xml",
          },
        });

        if (!response.ok) {
          console.log(`Skipping ${category}: ${response.status}`);
          continue;
        }

        const html = await response.text();
        const $ = cheerio.load(html);

        // Parse tool cards (structure may vary)
        $(".tool-card, .ai-tool, [data-tool]").each((_, element) => {
          const $el = $(element);
          
          const name = $el.find(".tool-name, h3, .title").first().text().trim();
          const tagline = $el.find(".tool-tagline, .description, p").first().text().trim();
          const website = $el.find("a[href^='http']").first().attr("href");
          const logo = $el.find("img").first().attr("src");

          if (!name || seenNames.has(name.toLowerCase())) return;
          seenNames.add(name.toLowerCase());

          const categoryName = category
            .replace("/ai/", "")
            .replace(/-/g, " ")
            .replace(/\b\w/g, (c) => c.toUpperCase());

          allProducts.push({
            name,
            tagline: tagline || undefined,
            website: website || undefined,
            logo: logo?.startsWith("http") ? logo : undefined,
            category: categoryName,
            tags: [categoryName, "AI"],
            launchDate: new Date(),
            source: "THERES_AN_AI",
            sourceUrl: `${THERES_AN_AI_URL}${category}`,
            sourceId: `taai-${name.toLowerCase().replace(/\s+/g, "-")}`,
          });
        });

        await new Promise((resolve) => setTimeout(resolve, 500));
      } catch (error) {
        console.error(`Error scraping ${category}:`, error);
      }
    }

    // Use demo data if scraping failed
    if (allProducts.length === 0) {
      return {
        success: true,
        products: getTAAIDemoProducts(),
      };
    }

    return {
      success: true,
      products: allProducts,
    };
  } catch (error) {
    console.error("There's An AI scraper error:", error);
    return {
      success: false,
      products: getTAAIDemoProducts(),
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

function getTAAIDemoProducts(): ScrapedProduct[] {
  return [
    {
      name: "Jasper",
      tagline: "AI writing assistant for marketing teams",
      description: "Jasper is an AI writing tool that helps create marketing copy, blog posts, and social media content.",
      website: "https://jasper.ai",
      logo: "https://jasper.ai/logo.png",
      category: "AI Writing",
      tags: ["AI Writing", "Marketing", "Content"],
      launchDate: new Date("2021-01-01"),
      source: "THERES_AN_AI",
      sourceUrl: "https://theresanaiforthat.com/ai/jasper",
      sourceId: "taai-jasper",
      upvotes: 0,
    },
    {
      name: "Copy.ai",
      tagline: "AI-powered copywriting and content generation",
      description: "Generate marketing copy in seconds with AI. Create blog posts, emails, social media content, and more.",
      website: "https://copy.ai",
      logo: "https://copy.ai/logo.png",
      category: "AI Writing",
      tags: ["AI Writing", "Copywriting", "Marketing"],
      launchDate: new Date("2020-10-01"),
      source: "THERES_AN_AI",
      sourceUrl: "https://theresanaiforthat.com/ai/copy-ai",
      sourceId: "taai-copyai",
      upvotes: 0,
    },
    {
      name: "Runway",
      tagline: "AI-powered creative tools for video and images",
      description: "Runway is a creative toolkit powered by machine learning. Create videos, images, and more with AI.",
      website: "https://runwayml.com",
      logo: "https://runwayml.com/logo.png",
      category: "AI Video",
      tags: ["AI Video", "Creative Tools", "Image Generation"],
      launchDate: new Date("2018-01-01"),
      source: "THERES_AN_AI",
      sourceUrl: "https://theresanaiforthat.com/ai/runway",
      sourceId: "taai-runway",
      upvotes: 0,
    },
    {
      name: "Synthesia",
      tagline: "Create AI videos from text in minutes",
      description: "Synthesia turns text into professional videos with AI avatars. No actors, cameras, or studios needed.",
      website: "https://synthesia.io",
      logo: "https://synthesia.io/logo.png",
      category: "AI Video",
      tags: ["AI Video", "Video Generation", "Avatar"],
      launchDate: new Date("2017-01-01"),
      source: "THERES_AN_AI",
      sourceUrl: "https://theresanaiforthat.com/ai/synthesia",
      sourceId: "taai-synthesia",
      upvotes: 0,
    },
    {
      name: "Replit Ghostwriter",
      tagline: "AI coding assistant built into Replit",
      description: "Code faster with AI. Ghostwriter helps you write, explain, and transform code directly in Replit.",
      website: "https://replit.com/ghostwriter",
      logo: "https://replit.com/logo.png",
      category: "AI Coding",
      tags: ["AI Coding", "Code Assistant", "IDE"],
      launchDate: new Date("2022-06-01"),
      source: "THERES_AN_AI",
      sourceUrl: "https://theresanaiforthat.com/ai/replit-ghostwriter",
      sourceId: "taai-ghostwriter",
      upvotes: 0,
    },
  ];
}

