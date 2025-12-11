import { GoogleGenerativeAI } from "@google/generative-ai";

export interface ChannelProductData {
  name: string;
  description?: string;
  website?: string;
  vendorName?: string;
  vendorType?: string;
  integrationTargets?: string[];
  channelUseCases?: string[];
  partnerProgramFit?: string[];
  signals?: string[];
}

export interface ChannelScoreResult {
  channelFit: number;
  coSellReadiness: number;
  integrationReadiness: number;
  opportunity: number;
  evidence: string[];
  reasoning?: string;
  confidence: number;
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

const CHANNEL_SCORING_PROMPT = `You are an AI evaluator for channel and alliance teams. Score the product for partner/channel suitability.

Fields to consider:
- Vendor type and ecosystem alignment (OEM/ISV/GSI/VAR/Marketplace)
- Integration targets (Microsoft, AWS, Salesforce, ServiceNow, Cisco, SAP, Google Cloud, etc.)
- Partner program signals (co-sell, marketplace listing, partner portal, reseller enablement)
- Channel use cases (reseller attach, GSI services, OEM marketplace, co-build)

Return STRICT JSON in this format:
{
  "channelFit": <0-10>,
  "coSellReadiness": <0-10>,
  "integrationReadiness": <0-10>,
  "opportunity": <0-10>,
  "evidence": ["<short evidence>", "<links or facts if present>"],
  "reasoning": "<1-2 sentence summary>",
  "confidence": <0-1>
}`;

export async function scoreChannelReadiness(product: ChannelProductData): Promise<ChannelScoreResult> {
  if (!process.env.GEMINI_API_KEY) {
    return fallbackChannelScore(product);
  }

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    const payload = `Product: ${product.name}\nDescription: ${product.description || "Not provided"}\nWebsite: ${product.website || "Not provided"}\nVendor: ${product.vendorName || "Unknown"} (${product.vendorType || "Unknown"})\nIntegration Targets: ${(product.integrationTargets || []).join(", ") || "None"}\nChannel Use Cases: ${(product.channelUseCases || []).join(", ") || "None"}\nPartner Program Signals: ${(product.partnerProgramFit || []).join(", ") || "None"}\nSignals: ${(product.signals || []).join(", ") || "None"}`;
    const result = await model.generateContent(`${CHANNEL_SCORING_PROMPT}\n\n${payload}`);
    const text = result.response.text();
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("No JSON returned by model");
    }

    const parsed = JSON.parse(jsonMatch[0]);
    return {
      channelFit: clampScore(parsed.channelFit),
      coSellReadiness: clampScore(parsed.coSellReadiness),
      integrationReadiness: clampScore(parsed.integrationReadiness),
      opportunity: clampScore(parsed.opportunity),
      evidence: Array.isArray(parsed.evidence) ? parsed.evidence.map((e: unknown) => String(e)) : [],
      reasoning: parsed.reasoning || undefined,
      confidence: typeof parsed.confidence === "number" ? Math.max(0, Math.min(1, parsed.confidence)) : 0.5,
    };
  } catch (error) {
    console.error("Channel scoring error", error);
    return fallbackChannelScore(product);
  }
}

function clampScore(value: unknown): number {
  const num = Number(value);
  if (Number.isNaN(num)) return 0;
  return Math.max(0, Math.min(10, Math.round(num)));
}

function fallbackChannelScore(product: ChannelProductData): ChannelScoreResult {
  const hasIntegrations = (product.integrationTargets || []).length > 0;
  const hasSignals = (product.partnerProgramFit || []).length > 0 || (product.signals || []).length > 0;
  const vendorIsISV = (product.vendorType || "").toLowerCase().includes("isv");

  let channelFit = 4;
  let coSellReadiness = 3;
  let integrationReadiness = hasIntegrations ? 6 : 3;

  if (vendorIsISV) channelFit += 1;
  if (hasSignals) {
    channelFit += 2;
    coSellReadiness += 2;
  }
  if (hasIntegrations) {
    coSellReadiness += 1;
  }

  const opportunity = Math.round((channelFit + coSellReadiness + integrationReadiness) / 3);

  return {
    channelFit: clampScore(channelFit),
    coSellReadiness: clampScore(coSellReadiness),
    integrationReadiness: clampScore(integrationReadiness),
    opportunity: clampScore(opportunity),
    evidence: ["Fallback heuristic"] ,
    reasoning: "Derived from available metadata; adjust once AI scoring is available.",
    confidence: 0.35,
  };
}
