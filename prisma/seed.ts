import { PrismaClient } from "@prisma/client";
import * as fs from "fs";
import * as path from "path";

const prisma = new PrismaClient();

// Load curated seed data from JSON
interface SeedProduct {
  name: string;
  tagline: string;
  description: string;
  website: string;
  category: string;
  tags: string[];
  targetRoles: string[];
  targetAudience: string;
  productType: string;
}

interface SeedData {
  description: string;
  lastUpdated: string;
  products: SeedProduct[];
}

// Known "juggernauts" to exclude - these are too well-known for discovery
const JUGGERNAUT_NAMES = [
  "salesforce",
  "hubspot",
  "slack",
  "microsoft",
  "google",
  "aws",
  "azure",
  "oracle",
  "sap",
  "workday",
  "servicenow",
  "zendesk",
  "atlassian",
  "jira",
  "confluence",
  "dropbox",
  "box",
  "adobe",
  "zoom",
];

function isJuggernaut(name: string): boolean {
  const lowerName = name.toLowerCase();
  return JUGGERNAUT_NAMES.some(j => lowerName.includes(j));
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

function calculateCompositeScore(scores: {
  functionalCoverage: number;
  usability: number;
  innovation: number;
  pricing: number;
  integration: number;
  security: number;
}): number {
  const weights = {
    functionalCoverage: 0.2,
    usability: 0.2,
    innovation: 0.2,
    pricing: 0.15,
    integration: 0.15,
    security: 0.1,
  };

  const weighted =
    scores.functionalCoverage * weights.functionalCoverage +
    scores.usability * weights.usability +
    scores.innovation * weights.innovation +
    scores.pricing * weights.pricing +
    scores.integration * weights.integration +
    scores.security * weights.security;

  return Math.round(weighted * 10);
}

// Generate reasonable scores based on product data
function generateScores(product: SeedProduct): {
  functionalCoverage: number;
  usability: number;
  innovation: number;
  pricing: number;
  integration: number;
  security: number;
  confidence: number;
} {
  // Base scores for curated B2B SaaS tools
  let functionalCoverage = 7;
  let usability = 7;
  let innovation = 6;
  let pricing = 6;
  let integration = 7;
  let security = 6;

  const text = `${product.name} ${product.description} ${product.tags.join(" ")}`.toLowerCase();

  // Adjust based on signals
  if (text.includes("platform") || text.includes("all-in-one")) functionalCoverage += 1;
  if (text.includes("enterprise")) { security += 1; pricing -= 1; }
  if (text.includes("api") || text.includes("integration")) integration += 1;
  if (text.includes("ai-powered") || text.includes("ai assistant")) innovation += 1;
  if (text.includes("easy") || text.includes("simple") || text.includes("no-code")) usability += 1;
  if (text.includes("free tier") || text.includes("free plan")) pricing += 1;
  if (product.targetRoles.length > 3) functionalCoverage += 1;

  // Clamp values to 5-9 range (curated tools are good but not perfect)
  const clamp = (v: number) => Math.max(5, Math.min(9, v));

  return {
    functionalCoverage: clamp(functionalCoverage),
    usability: clamp(usability),
    innovation: clamp(innovation),
    pricing: clamp(pricing),
    integration: clamp(integration),
    security: clamp(security),
    confidence: 0.8, // High confidence since these are curated
  };
}

async function main() {
  console.log("🌱 Seeding database with curated B2B AI SaaS tools...");
  
  // Load seed data from JSON
  const seedDataPath = path.join(__dirname, "seed-data.json");
  
  if (!fs.existsSync(seedDataPath)) {
    console.error("❌ seed-data.json not found at:", seedDataPath);
    process.exit(1);
  }

  const seedData: SeedData = JSON.parse(fs.readFileSync(seedDataPath, "utf-8"));
  console.log(`📦 Loaded ${seedData.products.length} products from seed-data.json`);

  // Filter out juggernauts
  const filteredProducts = seedData.products.filter(p => !isJuggernaut(p.name));
  console.log(`🔍 After filtering juggernauts: ${filteredProducts.length} products`);

  // First, delete all existing products and scores (fresh seed)
  console.log("🗑️ Deleting existing data...");
  await prisma.score.deleteMany();
  await prisma.product.deleteMany();
  console.log("✅ Existing data deleted");

  let created = 0;
  let skipped = 0;

  for (const product of filteredProducts) {
    try {
      const slug = slugify(product.name);
      const scores = generateScores(product);
      const compositeScore = calculateCompositeScore(scores);

      // Create product with viability fields
      const dbProduct = await prisma.product.create({
        data: {
          name: product.name,
          slug,
          tagline: product.tagline,
          description: product.description,
          website: product.website,
          category: product.category,
          tags: JSON.stringify(product.tags),
          targetRoles: JSON.stringify(product.targetRoles),
          source: "MANUAL",
          sourceId: `seed-${slug}`,
          upvotes: Math.floor(Math.random() * 5000) + 1000, // Simulated engagement
          launchDate: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000), // Random date in last year
          // Viability fields (all seed data is pre-vetted)
          viabilityScore: scores.confidence,
          targetAudience: product.targetAudience,
          productType: product.productType,
        },
      });

      // Create score
      const reasoning = JSON.stringify({
        functionalCoverage: `Covers ${scores.functionalCoverage >= 8 ? "comprehensive" : "solid"} range of use cases for ${product.category}.`,
        usability: `${scores.usability >= 8 ? "Excellent" : "Good"} user experience and onboarding.`,
        innovation: `${scores.innovation >= 7 ? "Innovative" : "Solid"} approach with AI capabilities.`,
        pricing: `${scores.pricing >= 7 ? "Good value" : "Fair pricing"} for B2B SaaS.`,
        integration: `${scores.integration >= 7 ? "Strong" : "Adequate"} API and integration options.`,
        security: `${scores.security >= 7 ? "Good" : "Reasonable"} security practices for business use.`,
      });

      await prisma.score.create({
        data: {
          productId: dbProduct.id,
          functionalCoverage: scores.functionalCoverage,
          usability: scores.usability,
          innovation: scores.innovation,
          pricing: scores.pricing,
          integration: scores.integration,
          security: scores.security,
          compositeScore,
          confidence: scores.confidence,
          reasoning,
        },
      });

      console.log(`✅ Created: ${product.name} (Score: ${compositeScore}, Audience: ${product.targetAudience})`);
      created++;
    } catch (error) {
      console.error(`⚠️ Skipped ${product.name}:`, error instanceof Error ? error.message : error);
      skipped++;
    }
  }

  console.log(`\n🎉 Seeding complete! Created: ${created}, Skipped: ${skipped}`);
}

main()
  .catch((e) => {
    console.error("❌ Seeding error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
