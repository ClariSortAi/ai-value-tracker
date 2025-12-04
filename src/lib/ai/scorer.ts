import { GoogleGenerativeAI } from "@google/generative-ai";
import { calculateCompositeScore, type CategoryKey } from "@/lib/utils";

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export interface ScoreResult {
  scores: Record<CategoryKey, number>;
  compositeScore: number;
  confidence: number;
  reasoning: Record<CategoryKey, string>;
}

export interface ProductData {
  name: string;
  tagline?: string;
  description?: string;
  website?: string;
  category?: string;
  tags: string[];
  source: string;
  upvotes?: number;
  stars?: number;
  rawData?: Record<string, unknown>;
}

const SCORING_PROMPT = `You are an expert software evaluator. Analyze the following AI product and provide scores for 6 categories on a 0-10 scale.

## Scoring Categories:

1. **Functional Coverage (0-10)**: How broadly the software can be applied. Consider:
   - Number of use cases supported
   - Feature completeness
   - Extensibility

2. **Usability (0-10)**: Ease of learning and using the product. Consider:
   - Interface clarity
   - Documentation quality
   - Onboarding experience
   - Learning curve

3. **Innovation (0-10)**: Uniqueness and novel capabilities. Consider:
   - Novel features vs competitors
   - Innovative technology usage
   - Market differentiation

4. **Pricing (0-10)**: Value for money. Consider:
   - Free tier availability
   - Pricing transparency
   - Cost vs value delivered
   - Accessibility for individuals/small teams

5. **Integration (0-10)**: API and ecosystem compatibility. Consider:
   - API availability
   - SDK/connector support
   - Standard compliance (REST, GraphQL, etc.)
   - Third-party integrations

6. **Security (0-10)**: Data protection and compliance. Consider:
   - Privacy policy clarity
   - Security certifications mentioned
   - Data handling practices
   - Compliance (GDPR, SOC2, etc.)

## Product to Evaluate:

Name: {name}
Tagline: {tagline}
Description: {description}
Category: {category}
Tags: {tags}
Source: {source}
Popularity Signals: {popularity}

## Response Format:

Respond ONLY with valid JSON in this exact format:
{
  "scores": {
    "functionalCoverage": <number 0-10>,
    "usability": <number 0-10>,
    "innovation": <number 0-10>,
    "pricing": <number 0-10>,
    "integration": <number 0-10>,
    "security": <number 0-10>
  },
  "reasoning": {
    "functionalCoverage": "<1-2 sentence explanation>",
    "usability": "<1-2 sentence explanation>",
    "innovation": "<1-2 sentence explanation>",
    "pricing": "<1-2 sentence explanation>",
    "integration": "<1-2 sentence explanation>",
    "security": "<1-2 sentence explanation>"
  },
  "confidence": <number 0-1 based on data quality>
}

Be conservative with scores - only give 9-10 for truly exceptional products with clear evidence. Use 5-6 as baseline for average products. Score lower if information is limited.`;

export async function scoreProduct(product: ProductData): Promise<ScoreResult> {
  // Check if API key exists
  if (!process.env.GEMINI_API_KEY) {
    console.log("No Gemini API key, using fallback scores");
    return generateFallbackScore(product);
  }

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    // Build popularity signals
    const popularity = [];
    if (product.upvotes) popularity.push(`${product.upvotes} upvotes`);
    if (product.stars) popularity.push(`${product.stars} GitHub stars`);
    if (popularity.length === 0) popularity.push("No popularity data available");

    // Format prompt
    const prompt = SCORING_PROMPT
      .replace("{name}", product.name)
      .replace("{tagline}", product.tagline || "Not provided")
      .replace("{description}", product.description || "Not provided")
      .replace("{category}", product.category || "AI Tool")
      .replace("{tags}", product.tags.join(", ") || "None")
      .replace("{source}", product.source)
      .replace("{popularity}", popularity.join(", "));

    const result = await model.generateContent(prompt);
    const response = result.response.text();

    // Extract JSON from response
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("No JSON found in response");
    }

    const parsed = JSON.parse(jsonMatch[0]);

    // Validate and clamp scores
    const scores: Record<CategoryKey, number> = {
      functionalCoverage: clampScore(parsed.scores?.functionalCoverage),
      usability: clampScore(parsed.scores?.usability),
      innovation: clampScore(parsed.scores?.innovation),
      pricing: clampScore(parsed.scores?.pricing),
      integration: clampScore(parsed.scores?.integration),
      security: clampScore(parsed.scores?.security),
    };

    const compositeScore = calculateCompositeScore(scores);
    const confidence = Math.max(0, Math.min(1, parsed.confidence || 0.5));

    const reasoning: Record<CategoryKey, string> = {
      functionalCoverage: parsed.reasoning?.functionalCoverage || "Score based on available data.",
      usability: parsed.reasoning?.usability || "Score based on available data.",
      innovation: parsed.reasoning?.innovation || "Score based on available data.",
      pricing: parsed.reasoning?.pricing || "Score based on available data.",
      integration: parsed.reasoning?.integration || "Score based on available data.",
      security: parsed.reasoning?.security || "Score based on available data.",
    };

    return {
      scores,
      compositeScore,
      confidence,
      reasoning,
    };
  } catch (error) {
    console.error("AI scoring error:", error);
    return generateFallbackScore(product);
  }
}

function clampScore(value: unknown): number {
  const num = Number(value);
  if (isNaN(num)) return 5;
  return Math.max(0, Math.min(10, Math.round(num)));
}

// Generate scores based on heuristics when AI is unavailable
function generateFallbackScore(product: ProductData): ScoreResult {
  // Base scores
  let functionalCoverage = 5;
  let usability = 5;
  let innovation = 5;
  let pricing = 6; // Default to slightly above average for free products
  let integration = 5;
  let security = 4; // Conservative default

  // Adjust based on signals
  const description = (product.description || "").toLowerCase();
  const tags = product.tags.map((t) => t.toLowerCase()).join(" ");
  const combined = `${description} ${tags}`;

  // Functional coverage signals
  if (combined.includes("all-in-one") || combined.includes("platform")) functionalCoverage += 1;
  if (combined.includes("api") || combined.includes("sdk")) functionalCoverage += 1;
  if (product.tags.length > 3) functionalCoverage += 1;

  // Usability signals
  if (combined.includes("easy") || combined.includes("simple")) usability += 1;
  if (combined.includes("no-code") || combined.includes("nocode")) usability += 2;
  if (combined.includes("documentation") || combined.includes("docs")) usability += 1;

  // Innovation signals
  if (combined.includes("first") || combined.includes("novel") || combined.includes("unique")) innovation += 1;
  if (combined.includes("gpt-4") || combined.includes("latest")) innovation += 1;
  if (combined.includes("breakthrough")) innovation += 2;

  // Pricing signals
  if (combined.includes("free") || combined.includes("open source") || combined.includes("open-source")) pricing += 2;
  if (combined.includes("enterprise")) pricing -= 1;

  // Integration signals
  if (combined.includes("api") || combined.includes("rest")) integration += 1;
  if (combined.includes("integration") || combined.includes("webhook")) integration += 1;
  if (combined.includes("sdk") || combined.includes("library")) integration += 1;

  // Security signals
  if (combined.includes("secure") || combined.includes("privacy")) security += 1;
  if (combined.includes("gdpr") || combined.includes("soc2") || combined.includes("hipaa")) security += 2;
  if (combined.includes("enterprise")) security += 1;

  // Popularity bonus
  if (product.upvotes && product.upvotes > 1000) {
    functionalCoverage = Math.min(10, functionalCoverage + 1);
    usability = Math.min(10, usability + 1);
  }
  if (product.stars && product.stars > 10000) {
    functionalCoverage = Math.min(10, functionalCoverage + 1);
    integration = Math.min(10, integration + 1);
  }

  // Clamp all scores
  const scores: Record<CategoryKey, number> = {
    functionalCoverage: clampScore(functionalCoverage),
    usability: clampScore(usability),
    innovation: clampScore(innovation),
    pricing: clampScore(pricing),
    integration: clampScore(integration),
    security: clampScore(security),
  };

  const compositeScore = calculateCompositeScore(scores);

  // Lower confidence for heuristic scores
  const confidence = 0.3;

  const reasoning: Record<CategoryKey, string> = {
    functionalCoverage: "Estimated based on product description and tags.",
    usability: "Estimated based on product description and positioning.",
    innovation: "Estimated based on product claims and technology stack.",
    pricing: "Estimated based on pricing mentions and open-source status.",
    integration: "Estimated based on API/SDK mentions in description.",
    security: "Estimated conservatively due to limited security information.",
  };

  return {
    scores,
    compositeScore,
    confidence,
    reasoning,
  };
}

// Batch score multiple products with rate limiting
export async function scoreProducts(
  products: ProductData[],
  delayMs: number = 4000 // Gemini free tier: 15 RPM
): Promise<Map<string, ScoreResult>> {
  const results = new Map<string, ScoreResult>();

  for (const product of products) {
    const score = await scoreProduct(product);
    results.set(product.name, score);

    // Rate limiting
    if (delayMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }

  return results;
}

