import { GoogleGenerativeAI } from "@google/generative-ai";
import { ScrapedProduct } from "@/lib/scrapers/types";

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export interface ViabilityAssessment {
  isCommercialSaaS: boolean;
  targetAudience: "b2b" | "b2c" | "developer" | "unknown";
  productType: "saas" | "library" | "framework" | "game" | "tutorial" | "other";
  confidence: number;
  rejectionReason?: string;
}

const GATEKEEPER_PROMPT = `You are a strict B2B SaaS product classifier. Your job is to determine if a product is a COMMERCIALLY VIABLE B2B SaaS tool that would be useful for business professionals (Sales, Marketing, Operations, HR, Product teams).

## ACCEPT if the product is:
- A commercial SaaS product with pricing/business model
- Useful for business professionals in their daily work
- A real product (not a tutorial, game, or experiment)
- AI-powered but focused on business outcomes

## REJECT if the product is:
- A game (including AI-coded games, demos, tower defense, etc.)
- A tutorial, course, or educational content
- An academic research project or paper
- An open-source library/framework without a commercial product layer
- A hobby/weekend project or experiment
- Consumer-only app (no B2B use case)
- Infrastructure/DevOps tool only useful for engineers

## Product to Evaluate:
Name: {name}
Tagline: {tagline}
Description: {description}
Category: {category}
Tags: {tags}
Source: {source}
Website: {website}

## Response Format (JSON only):
{
  "isCommercialSaaS": <true/false>,
  "targetAudience": "<b2b|b2c|developer|unknown>",
  "productType": "<saas|library|framework|game|tutorial|other>",
  "confidence": <0.0-1.0>,
  "rejectionReason": "<reason if rejected, null if accepted>"
}

Be STRICT. When in doubt, reject. We only want high-quality B2B SaaS products.`;

export async function assessCommercialViability(
  product: ScrapedProduct
): Promise<ViabilityAssessment> {
  // If no API key, use rule-based fallback
  if (!process.env.GEMINI_API_KEY) {
    console.log("[Gatekeeper] No Gemini API key, using rule-based assessment");
    return ruleBasedAssessment(product);
  }

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const prompt = GATEKEEPER_PROMPT
      .replace("{name}", product.name)
      .replace("{tagline}", product.tagline || "Not provided")
      .replace("{description}", product.description || "Not provided")
      .replace("{category}", product.category || "Unknown")
      .replace("{tags}", product.tags?.join(", ") || "None")
      .replace("{source}", product.source)
      .replace("{website}", product.website || "None");

    const result = await model.generateContent(prompt);
    const response = result.response.text();

    // Extract JSON from response
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error("[Gatekeeper] No JSON in response for:", product.name);
      return ruleBasedAssessment(product);
    }

    const parsed = JSON.parse(jsonMatch[0]);

    return {
      isCommercialSaaS: Boolean(parsed.isCommercialSaaS),
      targetAudience: parsed.targetAudience || "unknown",
      productType: parsed.productType || "other",
      confidence: Math.max(0, Math.min(1, parsed.confidence || 0.5)),
      rejectionReason: parsed.rejectionReason || undefined,
    };
  } catch (error) {
    console.error("[Gatekeeper] AI assessment error for:", product.name, error);
    return ruleBasedAssessment(product);
  }
}

// Rule-based fallback when AI is unavailable
function ruleBasedAssessment(product: ScrapedProduct): ViabilityAssessment {
  const text = `${product.name} ${product.tagline || ""} ${product.description || ""} ${product.tags?.join(" ") || ""}`.toLowerCase();

  // Immediate rejection patterns
  const rejectPatterns = [
    { pattern: /game|tower defense|arcade|puzzle|rpg/i, reason: "Appears to be a game" },
    { pattern: /tutorial|course|learn|education|homework/i, reason: "Appears to be educational content" },
    { pattern: /experiment|toy|playground|demo|proof of concept/i, reason: "Appears to be an experiment/demo" },
    { pattern: /thesis|research|paper|academic/i, reason: "Appears to be academic research" },
    { pattern: /i built|i made|i coded|weekend project|side project/i, reason: "Appears to be a hobby project" },
  ];

  for (const { pattern, reason } of rejectPatterns) {
    if (pattern.test(text)) {
      return {
        isCommercialSaaS: false,
        targetAudience: "unknown",
        productType: "other",
        confidence: 0.7,
        rejectionReason: reason,
      };
    }
  }

  // Positive signals for B2B SaaS
  const b2bSignals = [
    /pricing|enterprise|team|business|professional/i,
    /saas|platform|solution|software/i,
    /sales|marketing|crm|automation|workflow/i,
    /analytics|dashboard|reporting|insights/i,
    /api|integration|webhook|sdk/i,
  ];

  const b2bScore = b2bSignals.filter(p => p.test(text)).length;

  // Developer tools (allowed but different audience)
  const devSignals = /developer|code|programming|ide|cli|terminal|github|npm/i;
  const isDeveloperTool = devSignals.test(text);

  // Must have a website to be considered commercial
  if (!product.website) {
    return {
      isCommercialSaaS: false,
      targetAudience: "unknown",
      productType: "other",
      confidence: 0.6,
      rejectionReason: "No website provided",
    };
  }

  // Determine if it passes
  const isCommercialSaaS = b2bScore >= 2 || (product.source === "PRODUCT_HUNT" && b2bScore >= 1);
  
  return {
    isCommercialSaaS,
    targetAudience: isDeveloperTool ? "developer" : (isCommercialSaaS ? "b2b" : "unknown"),
    productType: isCommercialSaaS ? "saas" : "other",
    confidence: 0.5,
    rejectionReason: isCommercialSaaS ? undefined : "Insufficient B2B signals",
  };
}

// Batch assessment for multiple products
export async function assessProductsBatch(
  products: ScrapedProduct[],
  delayMs: number = 100 // Minimal delay - we have 2000 RPM headroom
): Promise<Map<string, ViabilityAssessment>> {
  const results = new Map<string, ViabilityAssessment>();

  for (const product of products) {
    const assessment = await assessCommercialViability(product);
    results.set(product.sourceId || product.name, assessment);

    // Small delay to be respectful, but we have high limits
    if (delayMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }

  return results;
}

