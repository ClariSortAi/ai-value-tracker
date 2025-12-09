import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import prisma from "@/lib/db";
import { enrichProduct, fetchWebsiteContent } from "@/lib/ai/enrichment";
import {
  startJob,
  updateJobProgress,
  completeJob,
  failJob,
  addJobActivity,
} from "@/lib/job-tracker";

// Force dynamic execution - prevent caching
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// Batch size - process this many products per request to stay within timeout
const BATCH_SIZE = 3; // Lower than assess because enrichment fetches websites

// This route enriches products with AI-generated detailed content
// It processes products that have been assessed but not yet enriched
export async function GET(request: NextRequest) {
  const requestId = randomUUID();
  const path = "/api/enrich";

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
    !!bypass && request.headers.get("x-vercel-protection-bypass") === bypass;

  // Check if request is authorized
  const isAuthorized = isDevelopment || hasValidSecret || hasBypassHeader;

  if (!isAuthorized) {
    console.error("Unauthorized enrich attempt:", {
      requestId,
      path,
      hasAuthHeader: !!authHeader,
    });
    return NextResponse.json(
      {
        error: "Unauthorized",
        hint: "Ensure CRON_SECRET is set and Authorization header is correct.",
      },
      { status: 401 }
    );
  }

  try {
    // Check for jobId in query params
    const { searchParams } = new URL(request.url);
    const jobId = searchParams.get("jobId");

    if (jobId) {
      await startJob(jobId);
      await addJobActivity(jobId, "Starting enrichment job...", "info");
    }

    console.log("Starting AI enrichment job...", {
      requestId,
      path,
      jobId,
    });

    // Find products that have been assessed (have viabilityScore) but not enriched
    const unenrichedProducts = await prisma.product.findMany({
      where: {
        viabilityScore: { not: null },
        enrichedAt: null,
      },
      take: BATCH_SIZE,
      orderBy: [
        { upvotes: "desc" }, // Prioritize popular products
        { createdAt: "desc" },
      ],
      select: {
        id: true,
        name: true,
        tagline: true,
        description: true,
        website: true,
      },
    });

    console.log(`Found ${unenrichedProducts.length} unenriched products`, {
      requestId,
    });

    // Also find open source tools that need enrichment
    const unenrichedOpenSource = await prisma.openSourceTool.findMany({
      where: {
        viabilityScore: { not: null },
        enrichedAt: null,
      },
      take: BATCH_SIZE,
      orderBy: [
        { likes: "desc" },
        { createdAt: "desc" },
      ],
      select: {
        id: true,
        name: true,
        tagline: true,
        description: true,
        spaceUrl: true,
        repoUrl: true,
      },
    });

    const totalToEnrich = unenrichedProducts.length + unenrichedOpenSource.length;

    if (totalToEnrich === 0) {
      return NextResponse.json({
        message: "No products to enrich",
        enriched: 0,
        remaining: 0,
      });
    }

    if (jobId) {
      await updateJobProgress(jobId, {
        currentStep: "Enriching products...",
        itemsProcessed: 0,
        itemsTotal: totalToEnrich,
      });
    }

    const results = {
      enriched: 0,
      skipped: 0,
      errors: 0,
      products: [] as Array<{
        name: string;
        status: string;
        reason?: string;
      }>,
    };

    let processedCount = 0;

    // Process products
    for (const product of unenrichedProducts) {
      try {
        if (jobId) {
          await updateJobProgress(jobId, {
            currentStep: "Enriching products...",
            itemsProcessed: processedCount,
            itemsTotal: totalToEnrich,
            currentItem: product.name,
          });
        }

        console.log(`[Enrich] Processing: ${product.name}`);

        // Fetch website content
        let websiteContent: string | null = null;
        if (product.website) {
          websiteContent = await fetchWebsiteContent(product.website);
        }

        // Run AI enrichment
        const enriched = await enrichProduct(
          product.name,
          product.tagline,
          product.description,
          websiteContent
        );

        if (enriched) {
          // Update the product with enriched data
          await prisma.product.update({
            where: { id: product.id },
            data: {
              extendedDescription: enriched.extendedDescription,
              keyFeatures: JSON.stringify(enriched.keyFeatures),
              useCases: JSON.stringify(enriched.useCases),
              limitations: JSON.stringify(enriched.limitations),
              bestFor: JSON.stringify(enriched.bestFor),
              enrichedAt: new Date(),
            },
          });

          results.enriched++;
          results.products.push({
            name: product.name,
            status: "enriched",
          });
          console.log(`[Enrich] SUCCESS: ${product.name}`, { requestId });
        } else {
          // Mark as enriched even if it failed to avoid re-trying forever
          await prisma.product.update({
            where: { id: product.id },
            data: {
              enrichedAt: new Date(),
            },
          });
          results.skipped++;
          results.products.push({
            name: product.name,
            status: "skipped",
            reason: "No enrichment data generated",
          });
          console.log(`[Enrich] SKIPPED: ${product.name}`, { requestId });
        }

        processedCount++;
        // Rate limiting - 1 second between requests
        await new Promise((resolve) => setTimeout(resolve, 1000));
      } catch (error) {
        console.error(`[Enrich] Error enriching ${product.name}:`, error);
        results.errors++;
        processedCount++;
        results.products.push({
          name: product.name,
          status: "error",
          reason: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    // Process open source tools
    for (const tool of unenrichedOpenSource) {
      try {
        if (jobId) {
          await updateJobProgress(jobId, {
            currentStep: "Enriching open source tools...",
            itemsProcessed: processedCount,
            itemsTotal: totalToEnrich,
            currentItem: tool.name,
          });
        }

        console.log(`[Enrich][OpenSource] Processing: ${tool.name}`);

        // Fetch website content from space or repo URL
        const url = tool.spaceUrl || tool.repoUrl;
        let websiteContent: string | null = null;
        if (url) {
          websiteContent = await fetchWebsiteContent(url);
        }

        // Run AI enrichment
        const enriched = await enrichProduct(
          tool.name,
          tool.tagline,
          tool.description,
          websiteContent
        );

        if (enriched) {
          await prisma.openSourceTool.update({
            where: { id: tool.id },
            data: {
              extendedDescription: enriched.extendedDescription,
              keyFeatures: JSON.stringify(enriched.keyFeatures),
              useCases: JSON.stringify(enriched.useCases),
              limitations: JSON.stringify(enriched.limitations),
              bestFor: JSON.stringify(enriched.bestFor),
              enrichedAt: new Date(),
            },
          });

          results.enriched++;
          results.products.push({
            name: tool.name,
            status: "enriched",
          });
          console.log(`[Enrich][OpenSource] SUCCESS: ${tool.name}`, {
            requestId,
          });
        } else {
          await prisma.openSourceTool.update({
            where: { id: tool.id },
            data: {
              enrichedAt: new Date(),
            },
          });
          results.skipped++;
          results.products.push({
            name: tool.name,
            status: "skipped",
            reason: "No enrichment data generated",
          });
        }

        processedCount++;
        await new Promise((resolve) => setTimeout(resolve, 1000));
      } catch (error) {
        console.error(`[Enrich][OpenSource] Error enriching ${tool.name}:`, error);
        results.errors++;
        processedCount++;
        results.products.push({
          name: tool.name,
          status: "error",
          reason: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    // Count remaining unenriched products
    const remainingProducts = await prisma.product.count({
      where: {
        viabilityScore: { not: null },
        enrichedAt: null,
      },
    });

    const remainingOpenSource = await prisma.openSourceTool.count({
      where: {
        viabilityScore: { not: null },
        enrichedAt: null,
      },
    });

    const summary = {
      message: "Enrichment batch completed",
      timestamp: new Date().toISOString(),
      enriched: results.enriched,
      skipped: results.skipped,
      errors: results.errors,
      remaining: remainingProducts + remainingOpenSource,
      products: results.products,
      hint:
        remainingProducts + remainingOpenSource > 0
          ? "Call this endpoint again to enrich more products"
          : "All products enriched",
    };

    console.log("Enrichment summary:", JSON.stringify({ requestId, ...summary }, null, 2));

    if (jobId) {
      await completeJob(jobId, {
        summary,
        enriched: results.enriched,
        skipped: results.skipped,
        errors: results.errors,
        remaining: remainingProducts + remainingOpenSource,
      });
      await addJobActivity(
        jobId,
        `Enrichment completed: ${results.enriched} enriched, ${results.skipped} skipped`,
        "success"
      );
    }

    return NextResponse.json({
      ...summary,
      ...(jobId ? { jobId } : {}),
    });
  } catch (error) {
    console.error("Enrichment job error:", { requestId, path, error });
    const errorMessage = error instanceof Error ? error.message : "Unknown error";

    const { searchParams } = new URL(request.url);
    const jobId = searchParams.get("jobId");
    if (jobId) {
      await failJob(jobId, errorMessage);
    }

    return NextResponse.json(
      {
        error: "Enrichment job failed",
        message: errorMessage,
      },
      { status: 500 }
    );
  }
}

// Allow POST for manual triggers
export async function POST(request: NextRequest) {
  return GET(request);
}

