import { scrapeProductHunt } from "./product-hunt";
import { scrapeGitHub } from "./github";
import { scrapeHackerNews } from "./hacker-news";
import { scrapeTheresAnAI } from "./theres-an-ai";
import { scrapeHuggingFaceSpaces } from "./hugging-face";
import {
  ScraperResult,
  ScrapedOpenSourceTool,
  ScrapedProduct,
} from "./types";
import prisma from "@/lib/db";
import { slugify } from "@/lib/utils";
import { assessCommercialViability, ViabilityAssessment } from "@/lib/ai/gatekeeper";

export {
  scrapeProductHunt,
  scrapeGitHub,
  scrapeHackerNews,
  scrapeTheresAnAI,
  scrapeHuggingFaceSpaces,
};
export type { ScraperResult, ScrapedOpenSourceTool, ScrapedProduct };

// Storage limits for free tier (0.5GB Neon)
const MAX_PRODUCTS = 1000;
const MIN_QUALITY_SCORE = 70; // Increased from 60 - stricter quality bar for commercial products
const MIN_OPEN_SOURCE_QUALITY = 40; // Increased from 30 - ensure open source tools have meaningful engagement

// Minimum engagement thresholds - products with no engagement signals are likely noise
const MIN_UPVOTES = 10; // Require at least some community validation
const MIN_STARS = 50; // GitHub projects need meaningful star count

// Calculate quality score based on engagement signals
function calculateQualityScore(product: ScrapedProduct): number {
  let score = 0;
  
  // Upvotes (Product Hunt, HN) - increased weight for strong validation
  if (product.upvotes) {
    if (product.upvotes >= 1000) score += 60; // Viral products
    else if (product.upvotes >= 500) score += 50;
    else if (product.upvotes >= 200) score += 35; // Strong community interest
    else if (product.upvotes >= 100) score += 25;
    else if (product.upvotes >= 50) score += 15;
    else if (product.upvotes >= 20) score += 8; // Minimum meaningful engagement
  }
  
  // Stars (GitHub) - higher bar for open source
  if (product.stars) {
    if (product.stars >= 50000) score += 60; // Extremely popular
    else if (product.stars >= 10000) score += 50;
    else if (product.stars >= 5000) score += 40;
    else if (product.stars >= 1000) score += 30;
    else if (product.stars >= 500) score += 20;
    else if (product.stars >= 100) score += 10;
  }
  
  // Comments indicate active engagement
  if (product.comments) {
    if (product.comments >= 50) score += 15; // Very active discussion
    else if (product.comments >= 20) score += 10;
    else if (product.comments >= 10) score += 5;
  }
  
  // Quality metadata - indicators of legitimacy
  if (product.description && product.description.length > 100) score += 10; // Comprehensive description
  else if (product.description && product.description.length > 50) score += 5;
  
  if (product.logo) score += 5; // Professional branding
  
  // Website is CRITICAL for commercial products
  if (product.website) {
    score += 10; // Increased weight - real products have websites
  } else {
    score -= 15; // Penalty for missing website - likely not a real product
  }
  
  return score;
}

// Domains to exclude - common for games, tutorials, and non-commercial projects
const EXCLUDED_DOMAINS = [
  'itch.io', 'gamejolt.com', 'kongregate.com', 'newgrounds.com', // Game platforms
  'github.io', 'github.com', 'gitlab.com', 'bitbucket.org', // Code hosting (no commercial product)
  'repl.it', 'replit.com', 'codesandbox.io', 'stackblitz.com', // Code playgrounds
  'youtube.com', 'youtu.be', 'vimeo.com', // Video platforms (demos/tutorials)
  'medium.com', 'dev.to', 'hashnode.dev', // Blog platforms (articles, not products)
  'notion.site', 'notion.so', // Notion pages (often personal projects)
  'reddit.com', 'discord.gg', 'discord.com', // Community platforms
  'kaggle.com', // Dataset/competition platform
  // Educational platforms (NEW)
  'udemy.com', 'coursera.org', 'edx.org', 'skillshare.com', 'pluralsight.com',
  'codecademy.com', 'freecodecamp.org', 'khanacademy.org',
  // Indian exam/educational portals (NEW - catches NeoPass-type products)
  'nptel.ac.in', 'swayam.gov.in', 'iamneo.ai', 'neolearn.in',
  'unacademy.com', 'byjus.com', 'vedantu.com', 'toppr.com',
  // Student/quiz platforms (NEW)
  'quizlet.com', 'kahoot.com', 'socrative.com', 'mentimeter.com',
];

// Keywords that indicate non-commercial/off-mission products
const REJECTION_KEYWORDS = [
  // Exam prep and student tools
  'exam', 'exams', 'test prep', 'quiz', 'quizzes', 'mock test', 'mock tests',
  'certification prep', 'study guide', 'flashcard', 'flashcards',
  'student', 'students', 'homework', 'assignment', 'assignments',
  'coursework', 'semester', 'grading', 'grades', 'gpa',
  // Specific exam systems
  'nptel', 'jee', 'neet', 'sat prep', 'gre prep', 'gmat prep', 'toefl', 'ielts',
  'upsc', 'gate exam', 'cat exam', 'clat', 'iit jee',
  // Educational focus
  'school', 'college', 'university', 'academic', 'campus',
  'syllabus', 'curriculum', 'lecture', 'classroom',
  // Tutorials and courses
  'tutorial', 'tutorials', 'course', 'courses', 'bootcamp', 'workshop',
  'learn to', 'learning platform', 'educational',
  // Personal/hobby projects
  'portfolio', 'personal project', 'side project', 'hobby project',
  'weekend project', 'i built', 'i made', 'i created', 'my first',
  // Games
  'game', 'games', 'gaming', 'gameplay', 'player', 'players',
  'level', 'levels', 'score', 'scores', 'leaderboard',
];

// Check if product name/description contains rejection keywords
function hasRejectionKeywords(product: ScrapedProduct): { rejected: boolean; reason?: string } {
  const text = `${product.name} ${product.tagline || ""} ${product.description || ""}`.toLowerCase();
  
  for (const keyword of REJECTION_KEYWORDS) {
    if (text.includes(keyword.toLowerCase())) {
      return { rejected: true, reason: `Contains keyword: "${keyword}"` };
    }
  }
  
  return { rejected: false };
}

// Check if website is from an excluded domain
function isExcludedDomain(website: string | undefined): boolean {
  if (!website) return false;
  
  try {
    const url = new URL(website);
    const hostname = url.hostname.toLowerCase();
    
    // Check if hostname exactly matches or is a subdomain of excluded domains
    // Examples: 
    // - 'itch.io' matches domain 'itch.io' ✓
    // - 'user.itch.io' matches domain 'itch.io' ✓ (subdomain)
    // - 'baditch.io' does NOT match domain 'itch.io' ✓ (requires dot prefix)
    return EXCLUDED_DOMAINS.some(domain => 
      hostname === domain || hostname.endsWith('.' + domain)
    );
  } catch (error) {
    // Invalid URL - log for debugging and consider it excluded
    console.log(`[Domain Filter] Invalid URL format: ${website}`, error instanceof Error ? error.message : '');
    return true;
  }
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
  results: {
    productHunt: ScraperResult;
    github: ScraperResult;
    hackerNews: ScraperResult;
    theresAnAI: ScraperResult;
    huggingFace: ScraperResult<ScrapedOpenSourceTool>;
  };
}> {
  console.log("[Scraper] Starting all scrapers...");

  // Run scrapers in parallel
  const [productHunt, github, hackerNews, theresAnAI, huggingFace] =
    await Promise.all([
      scrapeProductHunt(),
      scrapeGitHub(),
      scrapeHackerNews(),
      scrapeTheresAnAI(),
      scrapeHuggingFaceSpaces(),
    ]);

  const results = {
    productHunt,
    github,
    hackerNews,
    theresAnAI,
    huggingFace,
  };

  const total =
    productHunt.products.length +
    github.products.length +
    hackerNews.products.length +
    theresAnAI.products.length +
    huggingFace.products.length;

  console.log(`[Scraper] Total scraped: ${total} products`);

  return { total, results };
}

// Save scraped products to database with quality filtering
// When skipGatekeeper=true, products are saved without AI assessment (faster, for cron jobs)
// The /api/assess endpoint will later assess products with viabilityScore=null
export async function saveScrapedProducts(
  products: ScrapedProduct[],
  skipGatekeeper: boolean = false // Skip AI assessment for fast execution within timeout
): Promise<{ created: number; updated: number; skipped: number; rejected: number; errors: number }> {
  let created = 0;
  let updated = 0;
  let skipped = 0;
  let rejected = 0; // Products rejected by AI gatekeeper (only when skipGatekeeper=false)
  let errors = 0;

  // Check current product count
  const currentCount = await prisma.product.count();
  console.log(`[Scraper] Current DB count: ${currentCount}/${MAX_PRODUCTS}`);
  console.log(`[Scraper] Gatekeeper mode: ${skipGatekeeper ? "SKIPPED (fast mode)" : "ENABLED"}`);

  // Sort products by quality score (best first)
  const sortedProducts = products
    .map(p => ({ product: p, quality: calculateQualityScore(p) }))
    .sort((a, b) => b.quality - a.quality);

  // Cache for viability assessments (avoid re-assessing) - only used when gatekeeper enabled
  const viabilityCache = new Map<string, ViabilityAssessment>();

  for (const { product, quality } of sortedProducts) {
    try {
      // LAYER 0: Minimum engagement filter - skip products with zero signals
      const hasUpvotes = (product.upvotes || 0) >= MIN_UPVOTES;
      const hasStars = (product.stars || 0) >= MIN_STARS;
      const hasAnyEngagement = hasUpvotes || hasStars || (product.comments || 0) >= 5;
      
      if (!hasAnyEngagement) {
        // Only log for debug, these are very common
        skipped++;
        continue;
      }

      // LAYER 1: Quality score filter (always active)
      if (quality < MIN_QUALITY_SCORE) {
        skipped++;
        continue;
      }

      // LAYER 1.5: Exclude products from non-commercial domains
      if (isExcludedDomain(product.website)) {
        console.log(`[Scraper] Skipped: ${product.name} (excluded domain: ${product.website})`);
        skipped++;
        continue;
      }

      // LAYER 1.6: Check for rejection keywords (exam, student, game, etc.)
      const keywordCheck = hasRejectionKeywords(product);
      if (keywordCheck.rejected) {
        console.log(`[Scraper] Skipped: ${product.name} (${keywordCheck.reason})`);
        skipped++;
        continue;
      }

      // LAYER 2: AI Gatekeeper - Check commercial viability (skipped in fast mode)
      let viability: ViabilityAssessment | null = null;
      
      if (!skipGatekeeper) {
        const cacheKey = product.sourceId || product.name;
        viability = viabilityCache.get(cacheKey) || null;
        
        if (!viability) {
          console.log(`[Gatekeeper] Assessing: ${product.name}`);
          viability = await assessCommercialViability(product);
          viabilityCache.set(cacheKey, viability);
          
          // Small delay between API calls (we have 2000 RPM, but be respectful)
          await new Promise(resolve => setTimeout(resolve, 100));
        }

        // Reject if not a commercial B2B SaaS (allow developer tools too)
        if (!viability.isCommercialSaaS && viability.targetAudience !== "developer") {
          console.log(`[Gatekeeper] REJECTED: ${product.name} - ${viability.rejectionReason || "Not commercial B2B SaaS"}`);
          rejected++;
          continue;
        }
      }

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
            // Update viability data from gatekeeper (only if assessment was done)
            ...(viability ? {
              viabilityScore: viability.confidence,
              targetAudience: viability.targetAudience,
              productType: viability.productType,
            } : {}),
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
            // Viability data from AI gatekeeper (null if skipped - will be assessed later by /api/assess)
            viabilityScore: viability?.confidence ?? null,
            targetAudience: viability?.targetAudience ?? null,
            productType: viability?.productType ?? null,
          },
        });
        created++;
      }
    } catch (error) {
      console.error(`[Scraper] Error saving "${product.name}":`, error);
      errors++;
    }
  }

  console.log(`[Scraper] Results: ${created} created, ${updated} updated, ${skipped} skipped (low quality), ${rejected} rejected (gatekeeper), ${errors} errors`);

  return { created, updated, skipped, rejected, errors };
}

// Quality score for open-source spaces (likes/downloads + description richness)
function calculateOpenSourceQuality(tool: ScrapedOpenSourceTool): number {
  let score = 0;

  if (tool.likes) {
    if (tool.likes >= 5000) score += 60;
    else if (tool.likes >= 1000) score += 40;
    else if (tool.likes >= 200) score += 25;
    else if (tool.likes >= 50) score += 10;
  }

  if (tool.downloads) {
    if (tool.downloads >= 100000) score += 40;
    else if (tool.downloads >= 20000) score += 25;
    else if (tool.downloads >= 5000) score += 15;
  }

  if (tool.description && tool.description.length > 120) score += 10;
  if (tool.tags?.length > 0) score += 5;

  return score;
}

// Save Hugging Face spaces into dedicated open-source table
export async function saveOpenSourceTools(
  tools: ScrapedOpenSourceTool[],
  skipGatekeeper: boolean = false
): Promise<{ created: number; updated: number; skipped: number; errors: number }> {
  let created = 0;
  let updated = 0;
  let skipped = 0;
  let errors = 0;

  const sorted = tools
    .map((t) => ({ tool: t, quality: calculateOpenSourceQuality(t) }))
    .sort((a, b) => b.quality - a.quality);

  const viabilityCache = new Map<string, ViabilityAssessment>();

  for (const { tool, quality } of sorted) {
    try {
      // Minimum engagement filter for open source - need at least some likes or downloads
      const hasEngagement = (tool.likes || 0) >= 20 || (tool.downloads || 0) >= 1000;
      if (!hasEngagement) {
        skipped++;
        continue;
      }

      if (quality < MIN_OPEN_SOURCE_QUALITY) {
        skipped++;
        continue;
      }

      let viability: ViabilityAssessment | null = null;

      if (!skipGatekeeper) {
        const cacheKey = tool.sourceId || tool.name;
        viability = viabilityCache.get(cacheKey) || null;

        if (!viability) {
          console.log(`[Gatekeeper] Assessing (open-source): ${tool.name}`);
          viability = await assessCommercialViability({
            name: tool.name,
            tagline: tool.tagline,
            description: tool.description,
            website: tool.spaceUrl || tool.repoUrl,
            category: "Open Source",
            tags: tool.tags,
            launchDate: tool.launchDate,
            source: tool.source,
            sourceUrl: tool.sourceUrl,
            sourceId: tool.sourceId,
          });
          viabilityCache.set(cacheKey, viability);
          await new Promise((resolve) => setTimeout(resolve, 100));
        }
      }

      const baseSlug = slugify(tool.name);

      const existing = await prisma.openSourceTool.findFirst({
        where: {
          OR: [{ sourceId: tool.sourceId }, { slug: baseSlug }],
        },
      });

      if (existing) {
        await prisma.openSourceTool.update({
          where: { id: existing.id },
          data: {
            tagline: tool.tagline || existing.tagline,
            description: tool.description || existing.description,
            repoUrl: tool.repoUrl || existing.repoUrl,
            spaceUrl: tool.spaceUrl || existing.spaceUrl,
            logo: tool.logo || existing.logo,
            runtime: tool.runtime || existing.runtime,
            license: tool.license || existing.license,
            tags: JSON.stringify(tool.tags || []),
            likes: Math.max(tool.likes || 0, existing.likes),
            downloads: Math.max(tool.downloads || 0, existing.downloads),
            author: tool.author || existing.author,
            // Viability metadata
            ...(viability
              ? {
                  viabilityScore: viability.confidence,
                  targetAudience: viability.targetAudience,
                  productType: viability.productType,
                }
              : {}),
            updatedAt: new Date(),
          },
        });
        updated++;
      } else {
        let slug = baseSlug;
        let counter = 1;

        while (await prisma.openSourceTool.findUnique({ where: { slug } })) {
          slug = `${baseSlug}-${counter}`;
          counter++;
        }

        await prisma.openSourceTool.create({
          data: {
            name: tool.name,
            slug,
            tagline: tool.tagline,
            description: tool.description,
            repoUrl: tool.repoUrl,
            spaceUrl: tool.spaceUrl,
            logo: tool.logo,
            runtime: tool.runtime,
            license: tool.license,
            tags: JSON.stringify(tool.tags || []),
            launchDate: tool.launchDate,
            source: tool.source,
            sourceUrl: tool.sourceUrl,
            sourceId: tool.sourceId,
            likes: tool.likes || 0,
            downloads: tool.downloads || 0,
            author: tool.author,
            viabilityScore: viability?.confidence ?? null,
            targetAudience: viability?.targetAudience ?? null,
            productType: viability?.productType ?? null,
          },
        });
        created++;
      }
    } catch (error) {
      console.error(`[Scraper] Error saving open-source tool "${tool.name}":`, error);
      errors++;
    }
  }

  console.log(
    `[Scraper] Open-source results: ${created} created, ${updated} updated, ${skipped} skipped (low quality), ${errors} errors`
  );

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

// Identify potentially low-quality products that slipped through filters
// Returns list of products that may need manual review or removal
export async function identifyLowQualityProducts(): Promise<{
  total: number;
  products: Array<{ id: string; name: string; reason: string; quality: number }>;
}> {
  const allProducts = await prisma.product.findMany({
    select: {
      id: true,
      name: true,
      tagline: true,
      description: true,
      website: true,
      upvotes: true,
      stars: true,
      comments: true,
      targetAudience: true,
      productType: true,
      viabilityScore: true,
    },
  });

  const lowQuality: Array<{ id: string; name: string; reason: string; quality: number }> = [];

  for (const product of allProducts) {
    const text = `${product.name} ${product.tagline || ""} ${product.description || ""}`.toLowerCase();
    
    // Calculate quality score
    const quality = calculateQualityScore({
      name: product.name,
      tagline: product.tagline || undefined,
      description: product.description || undefined,
      website: product.website || undefined,
      upvotes: product.upvotes,
      stars: product.stars,
      comments: product.comments,
      tags: [],
      launchDate: new Date(),
      source: "MANUAL",
    });

    // Check for game patterns
    if (/\b(game|gaming|tower defense|arcade|puzzle|rpg|play|player|gameplay|level|score|leaderboard)\b/i.test(text)) {
      lowQuality.push({ id: product.id, name: product.name, reason: "Appears to be a game", quality });
      continue;
    }

    // Check for exam prep / student tool patterns (NEW)
    if (/\b(exam|exams|test prep|quiz|quizzes|mock test|certification prep|study guide|flashcard)\b/i.test(text)) {
      lowQuality.push({ id: product.id, name: product.name, reason: "Appears to be exam prep tool", quality });
      continue;
    }

    // Check for student-focused patterns (NEW)
    if (/\b(student|students|homework|assignment|coursework|semester|grading|grades|gpa)\b/i.test(text)) {
      lowQuality.push({ id: product.id, name: product.name, reason: "Appears to be a student tool", quality });
      continue;
    }

    // Check for specific exam systems (NEW - catches NeoPass)
    if (/\b(nptel|jee|neet|sat prep|gre prep|gmat|toefl|ielts|upsc|gate exam|cat exam|iit)\b/i.test(text)) {
      lowQuality.push({ id: product.id, name: product.name, reason: "Appears to be educational/exam platform", quality });
      continue;
    }

    // Check for tutorial/educational patterns
    if (/\b(tutorial|course|bootcamp|workshop|learn to|learning platform|educational|school|college|university)\b/i.test(text)) {
      lowQuality.push({ id: product.id, name: product.name, reason: "Appears to be educational content", quality });
      continue;
    }

    // Check for hobby project patterns
    if (/\b(i built|i made|i coded|weekend project|side project|hobby project|personal project|portfolio)\b/i.test(text)) {
      lowQuality.push({ id: product.id, name: product.name, reason: "Appears to be a hobby project", quality });
      continue;
    }

    // Check for LLM infrastructure / open-source tools (NOT commercial products)
    if (/\b(llm.inference|model.serving|inference.engine|self.hosted|local.ai|local.llm|desktop.client|desktop.app)\b/i.test(text)) {
      lowQuality.push({ id: product.id, name: product.name, reason: "LLM infrastructure, not commercial product", quality });
      continue;
    }

    // Check for specific open-source LLM tools (comprehensive list)
    if (/\b(ollama|llama\.cpp|vllm|gguf|ggml|text-generation|lobe.chat|nextchat|chatbox|cherry.studio|anything.llm)\b/i.test(text)) {
      lowQuality.push({ id: product.id, name: product.name, reason: "Open-source LLM tool", quality });
      continue;
    }

    // Check for chat UI wrappers and clients (not original products)
    if (/\b(webui|web.ui|chat.ui|frontend.for|interface.for|client.for|chat.client|ai.client|ai.assistant|chat.assistant)\b/i.test(text)) {
      lowQuality.push({ id: product.id, name: product.name, reason: "UI wrapper/client, not original product", quality });
      continue;
    }

    // Check for AI agent/automation frameworks (developer tools, not B2B SaaS)
    if (/\b(ai.agent|ai.agents|browser.automation|web.automation|build.agents|agent.framework|openhands|browser.use)\b/i.test(text)) {
      lowQuality.push({ id: product.id, name: product.name, reason: "AI agent framework, not commercial product", quality });
      continue;
    }

    // Check for RAG/LLM frameworks and templates (libraries, not products)
    if (/\b(rag.framework|rag.pipeline|rag.engine|vector.store|langchain|llamaindex|retrieval.augmented|cloud.template|ai.pipeline|ready.to.run)\b/i.test(text)) {
      lowQuality.push({ id: product.id, name: product.name, reason: "RAG/LLM framework, not commercial product", quality });
      continue;
    }

    // Check for visual flow builders (developer tools)
    if (/\b(build.+visually|visual.builder|drag.and.drop|no.code.ai|flow.builder|flowise|dify)\b/i.test(text)) {
      lowQuality.push({ id: product.id, name: product.name, reason: "Visual AI builder, developer tool", quality });
      continue;
    }

    // Check for developer infrastructure and frameworks
    if (/\b(sdk|framework|cli.tool|microservice|infrastructure|server.panel|unified.stack|web.interface)\b/i.test(text)) {
      lowQuality.push({ id: product.id, name: product.name, reason: "Developer infrastructure/framework", quality });
      continue;
    }

    // Check for bot frameworks and wrappers
    if (/\b(telegram.bot|bot.framework|chatbot.maker|rpa.sdk|wrapper|conversational.rpa)\b/i.test(text)) {
      lowQuality.push({ id: product.id, name: product.name, reason: "Bot framework/wrapper", quality });
      continue;
    }

    // Check for hardware/IoT projects
    if (/\b(esp32|arduino|raspberry.pi|iot|hardware|embedded)\b/i.test(text)) {
      lowQuality.push({ id: product.id, name: product.name, reason: "Hardware/IoT project", quality });
      continue;
    }

    // Check for open-source CLI tools and developer utilities
    if (/\b(open.source.cli|cli.tool|command.line|packs.your|repository.packing|code.packing)\b/i.test(text)) {
      lowQuality.push({ id: product.id, name: product.name, reason: "CLI/Developer utility", quality });
      continue;
    }

    // Check for notebooks and data science tools (developer-focused)
    if (/\b(notebook|jupyter|python.notebook|reactive.notebook|data.science.tool)\b/i.test(text)) {
      lowQuality.push({ id: product.id, name: product.name, reason: "Data science/notebook tool", quality });
      continue;
    }

    // Check for app builders that are free/local/open-source (not commercial)
    if (/\b(free.+local|local.+open.source|free.+open.source|app.builder.+free|free.+app.builder)\b/i.test(text)) {
      lowQuality.push({ id: product.id, name: product.name, reason: "Free/local app builder, not commercial", quality });
      continue;
    }

    // Check for autonomous agents frameworks (developer tools)
    if (/\b(autonomous.agent|swe.agent|github.issue|code.agent|eliza|agent.for.everyone)\b/i.test(text)) {
      lowQuality.push({ id: product.id, name: product.name, reason: "Autonomous agent framework", quality });
      continue;
    }

    // Check for specific tool names that should be excluded
    const toolName = product.name.toLowerCase();
    if (['continue', 'repomix', 'dyad', 'marimo', 'eliza', 'maxkb', 'taipy', 'dvc', 'nocobase', 'leon', 'amplication'].includes(toolName)) {
      lowQuality.push({ id: product.id, name: product.name, reason: "Known developer/open-source tool", quality });
      continue;
    }

    // Check for chat wrappers and multi-chat tools
    if (/\b(chatall|chat.all|concurrently.chat|multiple.llms|gui.for.chatgpt|chatgpt.gui|chuanhu)\b/i.test(text)) {
      lowQuality.push({ id: product.id, name: product.name, reason: "Chat wrapper/multi-chat tool", quality });
      continue;
    }

    // Check for IM/messaging servers (infrastructure)
    if (/\b(im.server|im.chat|messaging.server|chat.server|open.im)\b/i.test(text)) {
      lowQuality.push({ id: product.id, name: product.name, reason: "IM/Chat server infrastructure", quality });
      continue;
    }

    // Check for developer communities and networks (not B2B SaaS)
    if (/\b(developer.network|professional.network.for.developer|dev.community|daily\.dev)\b/i.test(text)) {
      lowQuality.push({ id: product.id, name: product.name, reason: "Developer community/network", quality });
      continue;
    }

    // Check for open-source personal assistants (not commercial)
    if (/\b(open.source.personal.assistant|personal.assistant.open|your.open.source)\b/i.test(text)) {
      lowQuality.push({ id: product.id, name: product.name, reason: "Open-source personal assistant", quality });
      continue;
    }

    // Check for "step by step" / "from scratch" tutorials
    if (/\b(step.by.step|from.scratch|implement.+from|build.your.own|how.to)\b/i.test(text)) {
      lowQuality.push({ id: product.id, name: product.name, reason: "Tutorial/educational content", quality });
      continue;
    }

    // Check for excluded domains
    if (product.website && isExcludedDomain(product.website)) {
      lowQuality.push({ id: product.id, name: product.name, reason: `Excluded domain: ${product.website}`, quality });
      continue;
    }

    // Check for low engagement
    if (quality < MIN_QUALITY_SCORE) {
      lowQuality.push({ id: product.id, name: product.name, reason: `Low quality score: ${quality}`, quality });
      continue;
    }

    // Check for rejected product types (libraries and frameworks are now rejected)
    if (product.productType && ['game', 'tutorial', 'exam_prep', 'student_tool', 'library', 'framework', 'other'].includes(product.productType)) {
      lowQuality.push({ id: product.id, name: product.name, reason: `Product type: ${product.productType}`, quality });
      continue;
    }
  }

  return {
    total: lowQuality.length,
    products: lowQuality,
  };
}
