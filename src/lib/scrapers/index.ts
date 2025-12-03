import { scrapeProductHunt } from "./product-hunt";
import { scrapeGitHub } from "./github";
import { scrapeHackerNews } from "./hacker-news";
import { scrapeTheresAnAI } from "./theres-an-ai";
import { ScraperResult, ScrapedProduct } from "./types";
import prisma from "@/lib/db";
import { slugify } from "@/lib/utils";

export { scrapeProductHunt, scrapeGitHub, scrapeHackerNews, scrapeTheresAnAI };
export type { ScraperResult, ScrapedProduct };

// Storage limits for free tier (0.5GB Neon)
const MAX_PRODUCTS = 1000;
const MIN_QUALITY_SCORE = 30; // Minimum engagement score to keep

// Calculate quality score based on engagement signals
function calculateQualityScore(product: ScrapedProduct): number {
  let score = 0;
  
  // Upvotes (Product Hunt, HN)
  if (product.upvotes) {
    if (product.upvotes >= 500) score += 50;
    else if (product.upvotes >= 100) score += 30;
    else if (product.upvotes >= 50) score += 20;
    else if (product.upvotes >= 10) score += 10;
  }
  
  // Stars (GitHub)
  if (product.stars) {
    if (product.stars >= 10000) score += 50;
    else if (product.stars >= 1000) score += 35;
    else if (product.stars >= 100) score += 20;
    else if (product.stars >= 50) score += 10;
  }
  
  // Comments indicate engagement
  if (product.comments && product.comments >= 10) score += 10;
  
  // Has description = better data quality
  if (product.description && product.description.length > 50) score += 10;
  
  // Has logo = more legitimate
  if (product.logo) score += 5;
  
  // Has website = more legitimate
  if (product.website) score += 5;
  
  return score;
}

// Check if product is an LLM/infrastructure (not a role-specific tool)
function isLLMOrInfrastructure(product: ScrapedProduct): boolean {
  const text = `${product.name} ${product.tagline || ""} ${product.description || ""} ${product.category || ""} ${product.tags?.join(" ") || ""}`.toLowerCase();
  
  // LLM/Model patterns
  const llmPatterns = /\b(llm|large language model|gpt|claude|llama|mistral|gemini|anthropic|openai|foundation model|transformer|neural network|deep learning|machine learning framework|inference|embedding|vector|rag|langchain|hugging\s?face)\b/;
  
  // Infrastructure patterns  
  const infraPatterns = /\b(self.?hosted|local.?ai|inference engine|model serving|gpu|cuda|pytorch|tensorflow|training|fine.?tuning|quantization|gguf|ggml|ollama)\b/;
  
  return llmPatterns.test(text) || infraPatterns.test(text);
}

// Infer target roles based on product data
function inferTargetRoles(product: ScrapedProduct): string[] {
  // LLMs and infrastructure tools get their own category - not role-specific
  if (isLLMOrInfrastructure(product)) {
    return ["llm"]; // Special category for LLMs/infrastructure
  }
  
  const roles: Set<string> = new Set();
  const text = `${product.name} ${product.tagline || ""} ${product.description || ""} ${product.tags?.join(" ") || ""}`.toLowerCase();
  
  // Marketing
  if (text.match(/marketing|seo|content|copywriting|social media|ads|advertising|email|campaign|brand/)) {
    roles.add("marketing");
  }
  
  // Sales
  if (text.match(/sales|crm|lead|outreach|prospecting|pipeline|deal|revenue|cold email/)) {
    roles.add("sales");
  }
  
  // Product
  if (text.match(/product|roadmap|feature|user research|analytics|feedback|pm|prototype|user testing/)) {
    roles.add("product");
  }
  
  // Engineering
  if (text.match(/code|developer|api|sdk|programming|debug|deploy|devops|backend|frontend|full.?stack|github|git/)) {
    roles.add("engineering");
  }
  
  // Design
  if (text.match(/design|ui|ux|figma|sketch|prototype|wireframe|graphic|visual|creative|image|video|animation/)) {
    roles.add("design");
  }
  
  // Operations
  if (text.match(/operations|automation|workflow|process|efficiency|productivity|task|project management|notion|scheduling/)) {
    roles.add("operations");
  }
  
  // HR
  if (text.match(/hr|hiring|recruit|talent|employee|onboarding|performance|people|interview/)) {
    roles.add("hr");
  }
  
  // Default to general if no specific role detected
  if (roles.size === 0) {
    return ["general"]; // General AI tools (not role-specific, not LLM)
  }
  
  return Array.from(roles);
}

// Run all scrapers and return combined results
export async function scrapeAll(): Promise<{
  total: number;
  results: Record<string, ScraperResult>;
}> {
  const results: Record<string, ScraperResult> = {};

  console.log("[Scraper] Starting all scrapers...");

  // Run scrapers in parallel
  const [productHunt, github, hackerNews, theresAnAI] = await Promise.all([
    scrapeProductHunt(),
    scrapeGitHub(),
    scrapeHackerNews(),
    scrapeTheresAnAI(),
  ]);

  results.productHunt = productHunt;
  results.github = github;
  results.hackerNews = hackerNews;
  results.theresAnAI = theresAnAI;

  const total =
    productHunt.products.length +
    github.products.length +
    hackerNews.products.length +
    theresAnAI.products.length;

  console.log(`[Scraper] Total scraped: ${total} products`);

  return { total, results };
}

// Save scraped products to database with quality filtering
export async function saveScrapedProducts(
  products: ScrapedProduct[]
): Promise<{ created: number; updated: number; skipped: number; errors: number }> {
  let created = 0;
  let updated = 0;
  let skipped = 0;
  let errors = 0;

  // Check current product count
  const currentCount = await prisma.product.count();
  console.log(`[Scraper] Current DB count: ${currentCount}/${MAX_PRODUCTS}`);

  // Sort products by quality score (best first)
  const sortedProducts = products
    .map(p => ({ product: p, quality: calculateQualityScore(p) }))
    .sort((a, b) => b.quality - a.quality);

  for (const { product, quality } of sortedProducts) {
    try {
      // Generate slug
      const baseSlug = slugify(product.name);
      
      // Check if product exists by sourceId or slug
      const existing = await prisma.product.findFirst({
        where: {
          OR: [
            { sourceId: product.sourceId },
            { slug: baseSlug },
          ],
        },
      });

      if (existing) {
        // Update existing product (always update to refresh data)
        await prisma.product.update({
          where: { id: existing.id },
          data: {
            tagline: product.tagline || existing.tagline,
            description: product.description || existing.description,
            website: product.website || existing.website,
            logo: product.logo || existing.logo,
            upvotes: Math.max(product.upvotes || 0, existing.upvotes),
            comments: Math.max(product.comments || 0, existing.comments),
            stars: Math.max(product.stars || 0, existing.stars),
            targetRoles: JSON.stringify(inferTargetRoles(product)),
            updatedAt: new Date(),
          },
        });
        updated++;
      } else {
        // Check if we're at capacity
        const dbCount = await prisma.product.count();
        if (dbCount >= MAX_PRODUCTS) {
          // Only add if quality is above threshold
          if (quality < MIN_QUALITY_SCORE) {
            skipped++;
            continue;
          }
          
          // Find and remove lowest quality product to make room
          const lowestQuality = await prisma.product.findFirst({
            orderBy: [
              { upvotes: "asc" },
              { stars: "asc" },
              { createdAt: "asc" },
            ],
            include: { scores: true },
          });
          
          if (lowestQuality) {
            // Only replace if new product is significantly better
            const existingQuality = (lowestQuality.upvotes || 0) + (lowestQuality.stars || 0);
            if (quality > existingQuality + 20) {
              await prisma.product.delete({ where: { id: lowestQuality.id } });
              console.log(`[Scraper] Replaced low-quality product: ${lowestQuality.name}`);
            } else {
              skipped++;
              continue;
            }
          }
        }

        // Create new product with unique slug
        let slug = baseSlug;
        let counter = 1;
        
        while (await prisma.product.findUnique({ where: { slug } })) {
          slug = `${baseSlug}-${counter}`;
          counter++;
        }

        await prisma.product.create({
          data: {
            name: product.name,
            slug,
            tagline: product.tagline,
            description: product.description,
            website: product.website,
            logo: product.logo,
            category: product.category,
            tags: JSON.stringify(product.tags),
            targetRoles: JSON.stringify(inferTargetRoles(product)),
            launchDate: product.launchDate,
            source: product.source,
            sourceUrl: product.sourceUrl,
            sourceId: product.sourceId,
            upvotes: product.upvotes || 0,
            comments: product.comments || 0,
            stars: product.stars || 0,
            // rawData removed for storage optimization
          },
        });
        created++;
      }
    } catch (error) {
      console.error(`[Scraper] Error saving "${product.name}":`, error);
      errors++;
    }
  }

  console.log(`[Scraper] Results: ${created} created, ${updated} updated, ${skipped} skipped, ${errors} errors`);

  return { created, updated, skipped, errors };
}

// Cleanup old/low-quality products (run periodically)
export async function pruneStaleProducts(): Promise<number> {
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  // Delete products that:
  // 1. Were created more than 6 months ago
  // 2. Have low engagement (< 50 upvotes AND < 100 stars)
  // 3. Haven't been updated recently
  const result = await prisma.product.deleteMany({
    where: {
      AND: [
        { createdAt: { lt: sixMonthsAgo } },
        { upvotes: { lt: 50 } },
        { stars: { lt: 100 } },
        { updatedAt: { lt: sixMonthsAgo } },
      ],
    },
  });

  console.log(`[Scraper] Pruned ${result.count} stale products`);
  return result.count;
}
