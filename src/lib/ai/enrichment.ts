import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export interface EnrichedProductData {
  extendedDescription: string;
  keyFeatures: string[];
  useCases: string[];
  limitations: string[];
  bestFor: string[];
}

// Fetch website content with timeout and error handling
export async function fetchWebsiteContent(url: string): Promise<string | null> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; AIValueTracker/1.0; +https://ai-value-tracker.vercel.app)",
        "Accept": "text/html,application/xhtml+xml",
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      console.log(`[Enrichment] Failed to fetch ${url}: ${response.status}`);
      return null;
    }

    const html = await response.text();
    
    // Extract text content from HTML (basic extraction)
    const textContent = extractTextFromHtml(html);
    
    // Limit content to prevent token overflow (roughly 4000 chars)
    return textContent.slice(0, 4000);
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      console.log(`[Enrichment] Timeout fetching ${url}`);
    } else {
      console.log(`[Enrichment] Error fetching ${url}:`, error);
    }
    return null;
  }
}

// Basic HTML text extraction (removes tags, scripts, styles)
function extractTextFromHtml(html: string): string {
  // Remove script and style tags with their content
  let text = html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<noscript[^>]*>[\s\S]*?<\/noscript>/gi, "");
  
  // Remove HTML tags
  text = text.replace(/<[^>]+>/g, " ");
  
  // Decode HTML entities
  text = text
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
  
  // Clean up whitespace
  text = text
    .replace(/\s+/g, " ")
    .trim();
  
  return text;
}

const ENRICHMENT_PROMPT = `You are a product analyst creating rich, informative content for an AI tools directory.

Analyze this AI product and generate detailed, ACCURATE content based on the available information.
DO NOT make up features or capabilities that aren't evident from the data.

## Product Information:
Name: {name}
Tagline: {tagline}
Original Description: {description}
Website Content: {websiteContent}

## Generate the following (be specific, not generic):

1. EXTENDED_DESCRIPTION (2-3 paragraphs):
   - What the product does in detail
   - How it works (if clear from the content)
   - What makes it unique
   - DO NOT use marketing fluff - be factual and informative

2. KEY_FEATURES (5-8 specific features):
   - List actual features mentioned in the content
   - Be specific: "AI-powered email drafting" not just "AI features"
   - Only include features you can verify from the content

3. USE_CASES (3-5 specific scenarios):
   - Who would use this product
   - For what specific tasks/workflows
   - Be concrete: "Marketing teams creating social media campaigns" not "businesses"

4. LIMITATIONS (2-4 honest constraints):
   - What it doesn't do
   - Who it's NOT for
   - Any obvious gaps or constraints
   - If unclear, state "Limited information available"

5. BEST_FOR (2-3 ideal user types):
   - Specific roles or teams that would benefit most
   - Be precise: "Solo entrepreneurs" or "Enterprise sales teams"

## Response Format (JSON only):
{
  "extendedDescription": "<2-3 paragraph description>",
  "keyFeatures": ["feature1", "feature2", ...],
  "useCases": ["use case 1", "use case 2", ...],
  "limitations": ["limitation1", "limitation2", ...],
  "bestFor": ["user type 1", "user type 2", ...]
}

If the website content is empty or very limited, generate based on the name/tagline only, and be honest about the limited information in the description.`;

export async function enrichProduct(
  name: string,
  tagline: string | null,
  description: string | null,
  websiteContent: string | null
): Promise<EnrichedProductData | null> {
  // If no Gemini API key, skip enrichment
  if (!process.env.GEMINI_API_KEY) {
    console.log("[Enrichment] No Gemini API key, skipping enrichment");
    return null;
  }

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const prompt = ENRICHMENT_PROMPT
      .replace("{name}", name)
      .replace("{tagline}", tagline || "Not provided")
      .replace("{description}", description || "Not provided")
      .replace("{websiteContent}", websiteContent || "Website content not available");

    const result = await model.generateContent(prompt);
    const response = result.response.text();

    // Extract JSON from response
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error("[Enrichment] No JSON in response for:", name);
      return null;
    }

    const parsed = JSON.parse(jsonMatch[0]);

    return {
      extendedDescription: parsed.extendedDescription || "",
      keyFeatures: Array.isArray(parsed.keyFeatures) ? parsed.keyFeatures : [],
      useCases: Array.isArray(parsed.useCases) ? parsed.useCases : [],
      limitations: Array.isArray(parsed.limitations) ? parsed.limitations : [],
      bestFor: Array.isArray(parsed.bestFor) ? parsed.bestFor : [],
    };
  } catch (error) {
    console.error("[Enrichment] AI enrichment error for:", name, error);
    return null;
  }
}

// Batch enrichment with rate limiting
export async function enrichProductsBatch(
  products: Array<{
    id: string;
    name: string;
    tagline: string | null;
    description: string | null;
    website: string | null;
  }>,
  onProgress?: (current: number, total: number, name: string) => void
): Promise<Map<string, EnrichedProductData>> {
  const results = new Map<string, EnrichedProductData>();

  for (let i = 0; i < products.length; i++) {
    const product = products[i];
    
    if (onProgress) {
      onProgress(i + 1, products.length, product.name);
    }

    // Fetch website content
    let websiteContent: string | null = null;
    if (product.website) {
      websiteContent = await fetchWebsiteContent(product.website);
    }

    // Enrich with AI
    const enriched = await enrichProduct(
      product.name,
      product.tagline,
      product.description,
      websiteContent
    );

    if (enriched) {
      results.set(product.id, enriched);
    }

    // Rate limiting - 500ms between requests (allows 120/min, well under 2000 RPM limit)
    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  return results;
}

