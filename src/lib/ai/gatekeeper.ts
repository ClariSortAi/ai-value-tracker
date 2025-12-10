import { GoogleGenerativeAI } from "@google/generative-ai";
import { ScrapedProduct } from "@/lib/scrapers/types";

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export type BusinessCategory = "marketing" | "sales" | "customer_service" | "productivity" | "developer" | "other";

export interface ViabilityAssessment {
  isCommercialSaaS: boolean;
  targetAudience: "b2b" | "b2c" | "developer" | "unknown";
  productType: "saas" | "library" | "framework" | "game" | "tutorial" | "exam_prep" | "student_tool" | "other";
  businessCategory: BusinessCategory;
  confidence: number;
  rejectionReason?: string;
}

const GATEKEEPER_PROMPT = `You are an EXTREMELY STRICT B2B SaaS product classifier for a curated "Rising Stars in AI Tools" directory. 

## OUR MISSION
We surface MID-MARKET RISING STARS - quality AI products gaining real traction. NOT enterprise giants. NOT weekend experiments. Products that deserve attention because they solve real business problems.

## STEP 1: BUSINESS CATEGORY CLASSIFICATION
Classify this product into ONE of these business categories:
- marketing: Content creation, SEO, social media, ads, email marketing, brand tools
- sales: CRM, lead generation, outreach, prospecting, sales intelligence, revenue tools
- customer_service: Support chatbots, helpdesk, ticket routing, customer success tools
- productivity: Workflow automation, document processing, meeting assistants, task management
- developer: If primarily for engineers/developers (usually REJECT unless has clear SaaS model)
- other: If doesn't fit above categories (usually REJECT)

## STEP 2: ACCEPT ONLY if the product:
1. Is a COMMERCIAL SaaS product (has pricing, free trial, or clear business model)
2. Has businessCategory of marketing, sales, customer_service, or productivity
3. Shows COMMERCIAL INTENT: has dedicated website with About/Team, Pricing, or Terms pages
4. Provides REAL BUSINESS VALUE - solves a workflow problem, not just a tech demo
5. Is AI-POWERED but focused on BUSINESS OUTCOMES, not just "uses AI"

## REJECT IMMEDIATELY if the product is:
### Games (ALL types - no exceptions)
- AI-coded games, demos, tower defense, roguelike, platformer, puzzle, RPG, strategy, arcade, simulation, multiplayer games
- Anything with: levels, players, enemies, scores, leaderboards, gameplay

### Educational/Learning Content  
- Tutorials, courses, bootcamps, learning platforms
- EXAM PREP tools (test prep, quiz apps, study aids, certification prep)
- STUDENT TOOLS (homework helpers, assignment tools, study apps, flashcards)
- Academic portals, university tools, school-focused apps

### Non-Commercial Projects
- Hobby/weekend/side projects, "I built this" experiments
- Academic research, papers, thesis projects, experiments
- Open-source libraries WITHOUT a commercial SaaS layer
- Proof of concepts, demos, prototypes, hackathon projects
- Personal utilities, portfolio projects, personal productivity hacks

### Consumer-Only Apps
- Personal finance apps without B2B features
- Dating apps, social media for consumers
- Personal health/fitness apps without enterprise features

### Developer-Only Infrastructure (REJECT ALL)
- Pure DevOps tools (CI/CD, hosting, monitoring) without business features
- Developer libraries, SDKs, APIs without a product layer
- "Awesome" lists, resource collections, directories
- Browser extensions (unless clearly enterprise B2B)
- Local/self-hosted-only tools without cloud SaaS offering
- LLM inference engines (ollama, llama.cpp, vllm, etc.)
- Chat UI wrappers for LLMs (NextChat, open-webui, lobe-chat, etc.)
- RAG frameworks/libraries without a product layer
- ML model serving infrastructure
- Self-hosted AI tools without a commercial cloud offering

### Specific Red Flags
- Generic chatbot wrappers with no unique value
- "GPT wrapper" apps that just wrap ChatGPT
- Crypto/Web3/NFT projects disguised as AI tools
- Spam/low-quality projects from directory farms

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
  "productType": "<saas|library|framework|game|tutorial|exam_prep|student_tool|other>",
  "businessCategory": "<marketing|sales|customer_service|productivity|developer|other>",
  "confidence": <0.0-1.0>,
  "rejectionReason": "<specific reason if rejected, null if accepted>"
}

BE EXTREMELY STRICT. When in doubt, REJECT. We prioritize marketing, sales, customer_service, and productivity tools. Developer tools need exceptional commercial signals to pass.`;

// PRE-VALIDATION: Reject obvious non-products BEFORE wasting AI calls
function preValidate(product: ScrapedProduct): ViabilityAssessment | null {
  const name = product.name || "";
  const url = product.website || "";
  
  // LISTICLE/ARTICLE DETECTION - These are NOT products
  const listiclePatterns = [
    /^(the\s+)?\d+\s+(best|top|great)/i,           // "10 Best AI Tools", "Top 5 CRMs"
    /best\s+[\w\s]+\s+(for|in)\s+\d{4}/i,          // "Best AI CRM for 2025"
    /top\s+\d+\s/i,                                 // "Top 10 AI Tools"
    /\d{4}\s+(guide|review|comparison|picks)/i,    // "2025 Guide to AI"
    /picks?\s+(for\s+)?\d{4}/i,                    // "My Top Picks for 2025"
    /platforms?\s+to\s+consider/i,                 // "Platforms to Consider"
    /:\s*my\s+(top\s+)?\d+/i,                      // ": My Top 7 Picks"
    /software\s+(for|in)\s+\d{4}/i,               // "Software for 2025"
  ];
  
  for (const pattern of listiclePatterns) {
    if (pattern.test(name)) {
      return {
        isCommercialSaaS: false,
        targetAudience: "unknown",
        productType: "other",
        businessCategory: "other",
        confidence: 0.95,
        rejectionReason: `Listicle/article title detected: "${name.substring(0, 50)}"`,
      };
    }
  }
  
  // BLOG/ARTICLE URL DETECTION
  const blogUrlPatterns = [
    /\/blog\//i,
    /\/article\//i,
    /\/learn\//i,
    /\/resources?\//i,
    /\/guide\//i,
    /\/comparison\//i,
    /\/best-/i,
    /\/top-\d+/i,
  ];
  
  for (const pattern of blogUrlPatterns) {
    if (pattern.test(url)) {
      return {
        isCommercialSaaS: false,
        targetAudience: "unknown",
        productType: "other",
        businessCategory: "other",
        confidence: 0.9,
        rejectionReason: `Blog/article URL detected: ${url.substring(0, 60)}`,
      };
    }
  }
  
  // PRICING PAGE DETECTION - Not a product, just a pricing page
  if (/^(plans?\s*&?\s*)?pricing/i.test(name) || name.toLowerCase() === "pricing") {
    return {
      isCommercialSaaS: false,
      targetAudience: "unknown",
      productType: "other",
      businessCategory: "other",
      confidence: 0.85,
      rejectionReason: `Pricing page, not a product: "${name}"`,
    };
  }
  
  // GENERIC/MEANINGLESS NAMES
  if (/^(AI\s+(for|in)\s+\w+)$/i.test(name)) {
    return {
      isCommercialSaaS: false,
      targetAudience: "unknown",
      productType: "other",
      businessCategory: "other",
      confidence: 0.8,
      rejectionReason: `Generic/meaningless name: "${name}"`,
    };
  }
  
  // Passed pre-validation
  return null;
}

export async function assessCommercialViability(
  product: ScrapedProduct
): Promise<ViabilityAssessment> {
  // PRE-VALIDATION: Catch obvious non-products immediately
  const preValidationResult = preValidate(product);
  if (preValidationResult) {
    console.log(`[Gatekeeper] Pre-validation rejected: ${product.name} - ${preValidationResult.rejectionReason}`);
    return preValidationResult;
  }

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
      businessCategory: parsed.businessCategory || "other",
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

  // Immediate rejection patterns - comprehensive detection
  const rejectPatterns = [
    // Games (comprehensive)
    { pattern: /\b(game|gaming|tower defense|arcade|puzzle|rpg|roguelike|platformer|strategy game|simulation|multiplayer|pvp|fps|mmorpg|idle game|clicker|match-3|card game|board game)\b/i, reason: "Appears to be a game", type: "game" },
    { pattern: /\b(play|gameplay|level|player|enemy|boss|weapon|combat|battle|quest|dungeon|loot|score|leaderboard)\b/i, reason: "Appears to be a game", type: "game" },
    
    // Exam prep and student tools (NEW)
    { pattern: /\b(exam|exams|test prep|quiz|quizzes|study guide|flashcard|flashcards|certification prep|mock test)\b/i, reason: "Appears to be exam prep tool", type: "exam_prep" },
    { pattern: /\b(student|students|homework|assignment|assignments|coursework|semester|grading|grades|gpa)\b/i, reason: "Appears to be a student tool", type: "student_tool" },
    { pattern: /\b(nptel|jee|neet|sat|gre|gmat|toefl|ielts|upsc|gate|cat|clat|iit|university portal)\b/i, reason: "Appears to be educational/exam platform", type: "exam_prep" },
    { pattern: /\b(school|college|university|academic|campus|syllabus|curriculum)\b/i, reason: "Appears to be education-focused", type: "tutorial" },
    
    // Tutorials and learning content
    { pattern: /\b(tutorial|tutorials|course|courses|learn|learning|education|educational|teach|training|lesson|lecture|workshop|bootcamp|class)\b/i, reason: "Appears to be educational content", type: "tutorial" },
    
    // Personal/hobby projects
    { pattern: /\b(experiment|toy|playground|demo|proof of concept|prototype|hackathon|fun project|just for fun)\b/i, reason: "Appears to be an experiment/demo", type: "other" },
    { pattern: /\b(thesis|dissertation|research project|academic paper|research|scholarly|conference paper|arxiv)\b/i, reason: "Appears to be academic research", type: "other" },
    { pattern: /\b(i built|i made|i coded|i created|my first|weekend project|side project|hobby project|personal project|portfolio)\b/i, reason: "Appears to be a hobby/portfolio project", type: "other" },
    
    // LLM Infrastructure (open-source tools, not commercial products)
    { pattern: /\b(llm inference|model serving|inference engine|self.hosted|on.premise|local ai|local llm)\b/i, reason: "Open-source LLM infrastructure, not commercial product", type: "library" },
    { pattern: /\b(ollama|llama\.cpp|vllm|text-generation|huggingface|transformers)\b/i, reason: "LLM framework/library, not commercial product", type: "library" },
    { pattern: /\b(webui|web ui|chat ui|frontend for|interface for|client for)\b/i, reason: "UI wrapper, not original product", type: "framework" },
    { pattern: /\b(rag|retrieval augmented|vector store|embedding|langchain|llamaindex)\b/i, reason: "RAG/LLM framework, not commercial product", type: "library" },
    { pattern: /\b(step by step|from scratch|implement|build your own|how to)\b/i, reason: "Tutorial/educational content", type: "tutorial" },
    
    // Non-commercial
    { pattern: /\b(awesome|awesome-list|curated list|resource list|collection of|links to)\b/i, reason: "Appears to be a resource list", type: "other" },
    { pattern: /\b(chrome extension|browser extension|firefox addon)\b/i, reason: "Browser extension (not B2B SaaS)", type: "other" },
    
    // Generic/low-value
    { pattern: /\b(gpt wrapper|chatgpt wrapper|just a wrapper|simple wrapper)\b/i, reason: "Appears to be a generic GPT wrapper", type: "other" },
    { pattern: /\b(crypto|nft|web3|blockchain|token|defi)\b/i, reason: "Crypto/Web3 project", type: "other" },
  ];

  for (const { pattern, reason, type } of rejectPatterns) {
    if (pattern.test(text)) {
      return {
        isCommercialSaaS: false,
        targetAudience: "unknown",
        productType: type as ViabilityAssessment["productType"],
        businessCategory: "other",
        confidence: 0.8,
        rejectionReason: reason,
      };
    }
  }

  // Business category classification based on keywords
  const categoryPatterns: { category: BusinessCategory; patterns: RegExp[] }[] = [
    {
      category: "marketing",
      patterns: [
        /\b(marketing|seo|content|copywriting|social media|ads|advertising|email marketing|campaign|brand|influencer|content creation)\b/i,
      ],
    },
    {
      category: "sales",
      patterns: [
        /\b(sales|crm|lead gen|outreach|prospecting|pipeline|deal|revenue|cold email|sales intelligence)\b/i,
      ],
    },
    {
      category: "customer_service",
      patterns: [
        /\b(customer service|support|helpdesk|ticket|customer success|chatbot|live chat|contact center)\b/i,
      ],
    },
    {
      category: "productivity",
      patterns: [
        /\b(productivity|workflow|automation|document|meeting|task|project management|scheduling|calendar|note|collaboration)\b/i,
      ],
    },
    {
      category: "developer",
      patterns: [
        /\b(developer|code|programming|ide|cli|terminal|github|npm|api|sdk|devops|backend|frontend)\b/i,
      ],
    },
  ];

  let detectedCategory: BusinessCategory = "other";
  for (const { category, patterns } of categoryPatterns) {
    if (patterns.some((p) => p.test(text))) {
      detectedCategory = category;
      break;
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
  const isDeveloperTool = detectedCategory === "developer";

  // Must have a website to be considered commercial
  if (!product.website) {
    return {
      isCommercialSaaS: false,
      targetAudience: "unknown",
      productType: "other",
      businessCategory: detectedCategory,
      confidence: 0.6,
      rejectionReason: "No website provided",
    };
  }

  // Determine if it passes - prioritize marketing, sales, customer_service, productivity
  const isPriorityCategory = ["marketing", "sales", "customer_service", "productivity"].includes(detectedCategory);
  const isCommercialSaaS = (isPriorityCategory && b2bScore >= 1) || b2bScore >= 2 || (product.source === "PRODUCT_HUNT" && b2bScore >= 1);
  
  return {
    isCommercialSaaS,
    targetAudience: isDeveloperTool ? "developer" : (isCommercialSaaS ? "b2b" : "unknown"),
    productType: isCommercialSaaS ? "saas" : "other",
    businessCategory: detectedCategory,
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

