import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import prisma from "@/lib/db";
import { assessCommercialViability } from "@/lib/ai/gatekeeper";
import type { Source } from "@/lib/scrapers/types";
import {
  startJob,
  updateJobProgress,
  completeJob,
  failJob,
  addJobActivity,
} from "@/lib/job-tracker";

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
    // Check for jobId in query params
    const { searchParams } = new URL(request.url);
    const jobId = searchParams.get("jobId");

    if (jobId) {
      await startJob(jobId);
      await addJobActivity(jobId, "Starting assessment job...", "info");
    }

    console.log("Starting AI assessment job...", {
      requestId,
      path,
      hasAuthHeader: !!authHeader,
      isDevelopment,
      jobId,
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

    const totalToAssess = unassessedProducts.length + unassessedOpenSource.length;

    if (jobId && totalToAssess > 0) {
      await updateJobProgress(jobId, {
        currentStep: "Assessing products...",
        itemsProcessed: 0,
        itemsTotal: totalToAssess,
      });
    }

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

    let processedCount = 0;
    for (const product of unassessedProducts) {
      try {
        if (jobId) {
          await updateJobProgress(jobId, {
            currentStep: "Assessing products...",
            itemsProcessed: processedCount,
            itemsTotal: totalToAssess,
            currentItem: product.name,
          });
        }

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

        processedCount++;
        // Small delay between API calls (we have 2000 RPM, but be respectful)
        await new Promise(resolve => setTimeout(resolve, 200));

      } catch (error) {
        console.error(`[Assess] Error assessing ${product.name}:`, error);
        results.errors++;
        processedCount++;
        results.products.push({
          name: product.name,
          status: "error",
          reason: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    for (const tool of unassessedOpenSource) {
      try {
        if (jobId) {
          await updateJobProgress(jobId, {
            currentStep: "Assessing open source tools...",
            itemsProcessed: processedCount,
            itemsTotal: totalToAssess,
            currentItem: tool.name,
          });
        }

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

        processedCount++;
        await new Promise((resolve) => setTimeout(resolve, 200));
      } catch (error) {
        console.error(`[Assess][OpenSource] Error assessing ${tool.name}:`, error);
        openResults.errors++;
        processedCount++;
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

    const { searchParams } = new URL(request.url);
    const jobId = searchParams.get("jobId");

    if (jobId) {
      await completeJob(jobId, {
        summary,
        assessed: results.assessed + openResults.assessed,
        rejected: results.rejected,
        errors: results.errors + openResults.errors,
        remaining: remainingCount + remainingOpen,
      });
      await addJobActivity(
        jobId,
        `Assessment completed: ${results.assessed + openResults.assessed} assessed, ${results.rejected} rejected`,
        "success"
      );
    }

    return NextResponse.json({
      ...summary,
      ...(jobId ? { jobId } : {}),
    });

  } catch (error) {
    console.error("Assessment job error:", { requestId, path, error });
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    
    const { searchParams } = new URL(request.url);
    const jobId = searchParams.get("jobId");
    if (jobId) {
      await failJob(jobId, errorMessage);
    }

    return NextResponse.json(
      {
        error: "Assessment job failed",
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

