import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import prisma from "@/lib/db";
import { assessCommercialViability } from "@/lib/ai/gatekeeper";
import type { Source } from "@/lib/scrapers/types";

// Force dynamic execution - prevent caching
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Batch size - process this many products per request to stay within timeout
const BATCH_SIZE = 5;

// This route assesses products that were scraped without AI assessment
// It processes a batch at a time to fit within Vercel's function timeout
export async function GET(request: NextRequest) {
  const requestId = randomUUID();
  const path = "/api/assess";

  // Official Vercel authentication method
  const authHeader = request.headers.get("authorization");
  
  // Allow in development without auth (for local testing)
  const isDevelopment = process.env.NODE_ENV !== "production";
  
  const secret = process.env.CRON_SECRET;
  const hasValidSecret =
    !!secret &&
    !!authHeader &&
    (authHeader === `Bearer ${secret}` || authHeader === secret);

  const bypass = process.env.VERCEL_AUTOMATION_BYPASS_SECRET;
  const hasBypassHeader =
    !!bypass &&
    request.headers.get("x-vercel-protection-bypass") === bypass;

  // Check if request is authorized
  const isAuthorized = isDevelopment || hasValidSecret || hasBypassHeader;
  
  if (!isAuthorized) {
    console.error("Unauthorized assess attempt:", {
      requestId,
      path,
      hasAuthHeader: !!authHeader,
      hasCronSecret: !!secret,
      hasBypassHeader,
      bypassConfigured: !!bypass,
      authHeaderLength: authHeader?.length ?? 0,
      authHeaderValue: authHeader,
      secretPreview: secret ? `${secret.slice(0,4)}...${secret.slice(-4)}` : null,
      nodeEnv: process.env.NODE_ENV,
    });
    return NextResponse.json({ 
      error: "Unauthorized",
      hint: "Vercel automatically sends Authorization: Bearer CRON_SECRET header. Ensure CRON_SECRET is set."
    }, { status: 401 });
  }

  try {
    console.log("Starting AI assessment job...", {
      requestId,
      path,
      hasAuthHeader: !!authHeader,
      isDevelopment,
    });

    // Find products that haven't been assessed yet (viabilityScore is null)
    const unassessedProducts = await prisma.product.findMany({
      where: {
        viabilityScore: null,
      },
      take: BATCH_SIZE,
      orderBy: {
        createdAt: "desc", // Assess newest products first
      },
    });

    console.log(`Found ${unassessedProducts.length} unassessed products`, { requestId });

    const unassessedOpenSource = await prisma.openSourceTool.findMany({
      where: {
        viabilityScore: null,
      },
      take: BATCH_SIZE,
      orderBy: {
        createdAt: "desc",
      },
    });

    const results = {
      assessed: 0,
      rejected: 0,
      errors: 0,
      products: [] as Array<{ name: string; status: string; reason?: string }>,
    };

    const openResults = {
      assessed: 0,
      errors: 0,
      products: [] as Array<{ name: string; status: string; reason?: string }>,
    };

    for (const product of unassessedProducts) {
      try {
        console.log(`[Assess] Evaluating: ${product.name}`);

        const viability = await assessCommercialViability({
          name: product.name,
          tagline: product.tagline || undefined,
          description: product.description || undefined,
          website: product.website || undefined,
          category: product.category || undefined,
          tags: JSON.parse(product.tags || "[]"),
          source: product.source as Source,
          launchDate: product.launchDate,
        });

        // Check if product should be rejected
        const shouldReject = !viability.isCommercialSaaS && viability.targetAudience !== "developer";

        if (shouldReject) {
          // Delete the product (it doesn't meet our criteria)
          await prisma.product.delete({
            where: { id: product.id },
          });
          results.rejected++;
          results.products.push({
            name: product.name,
            status: "rejected",
            reason: viability.rejectionReason || "Not commercial B2B SaaS",
          });
          console.log(`[Assess] REJECTED: ${product.name} - ${viability.rejectionReason}`, { requestId });
        } else {
          // Update the product with viability data
          await prisma.product.update({
            where: { id: product.id },
            data: {
              viabilityScore: viability.confidence,
              targetAudience: viability.targetAudience,
              productType: viability.productType,
            },
          });
          results.assessed++;
          results.products.push({
            name: product.name,
            status: "assessed",
          });
          console.log(`[Assess] APPROVED: ${product.name} (confidence: ${viability.confidence})`, { requestId });
        }

        // Small delay between API calls (we have 2000 RPM, but be respectful)
        await new Promise(resolve => setTimeout(resolve, 200));

      } catch (error) {
        console.error(`[Assess] Error assessing ${product.name}:`, error);
        results.errors++;
        results.products.push({
          name: product.name,
          status: "error",
          reason: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    for (const tool of unassessedOpenSource) {
      try {
        console.log(`[Assess][OpenSource] Evaluating: ${tool.name}`);

        const viability = await assessCommercialViability({
          name: tool.name,
          tagline: tool.tagline || undefined,
          description: tool.description || undefined,
          website: tool.spaceUrl || tool.repoUrl || undefined,
          category: "Open Source",
          tags: JSON.parse(tool.tags || "[]"),
          source: "HUGGING_FACE",
          launchDate: tool.launchDate,
        });

        await prisma.openSourceTool.update({
          where: { id: tool.id },
          data: {
            viabilityScore: viability.confidence,
            targetAudience: viability.targetAudience,
            productType: viability.productType,
            updatedAt: new Date(),
          },
        });

        openResults.assessed++;
        openResults.products.push({
          name: tool.name,
          status: "assessed",
        });

        await new Promise((resolve) => setTimeout(resolve, 200));
      } catch (error) {
        console.error(`[Assess][OpenSource] Error assessing ${tool.name}:`, error);
        openResults.errors++;
        openResults.products.push({
          name: tool.name,
          status: "error",
          reason: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    // Count remaining unassessed products
    const remainingCount = await prisma.product.count({
      where: { viabilityScore: null },
    });

    const remainingOpen = await prisma.openSourceTool.count({
      where: { viabilityScore: null },
    });

    const summary = {
      message: "Assessment batch completed",
      timestamp: new Date().toISOString(),
      assessed: results.assessed,
      rejected: results.rejected,
      errors: results.errors,
      remaining: remainingCount,
      openSource: {
        assessed: openResults.assessed,
        errors: openResults.errors,
        remaining: remainingOpen,
      },
      products: results.products,
      hint: remainingCount > 0 ? "Call this endpoint again to assess more products" : "All products assessed",
    };

    console.log("Assessment summary:", JSON.stringify({ requestId, ...summary }, null, 2));

    return NextResponse.json(summary);

  } catch (error) {
    console.error("Assessment job error:", { requestId, path, error });
    return NextResponse.json(
      {
        error: "Assessment job failed",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// Allow POST for manual triggers
export async function POST(request: NextRequest) {
  return GET(request);
}

