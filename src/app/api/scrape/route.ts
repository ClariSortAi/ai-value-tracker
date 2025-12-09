import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { scrapeAll, saveOpenSourceTools, saveScrapedProducts } from "@/lib/scrapers";
import type { ScrapedOpenSourceTool } from "@/lib/scrapers/types";
import {
  createJob,
  startJob,
  updateJobProgress,
  completeJob,
  failJob,
  addJobActivity,
} from "@/lib/job-tracker";

// Force dynamic execution - prevent caching
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// This route handles the combined scraping job
// In production, call this via Vercel Cron
// Vercel automatically sends Authorization: Bearer CRON_SECRET header when invoking cron jobs
export async function GET(request: NextRequest) {
  const requestId = randomUUID();
  const path = "/api/scrape";

  // Official Vercel authentication method (per Managing Cron Jobs.md)
  // Vercel automatically sends Authorization header with CRON_SECRET for both scheduled and manual triggers
  const authHeader = request.headers.get("authorization");
  
  // Allow in development without auth (for local testing)
  const isDevelopment = process.env.NODE_ENV !== "production";
  
  const secret = process.env.CRON_SECRET;
  const bypass = process.env.VERCEL_AUTOMATION_BYPASS_SECRET;
  const hasValidSecret =
    !!secret &&
    !!authHeader &&
    (authHeader === `Bearer ${secret}` || authHeader === secret);
  const hasBypassHeader =
    !!bypass &&
    request.headers.get("x-vercel-protection-bypass") === bypass;

  // Check if request is authorized
  const isAuthorized = isDevelopment || hasValidSecret || hasBypassHeader;
  
  if (!isAuthorized) {
    console.error("Unauthorized scrape attempt:", {
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
      hint: "Vercel automatically sends Authorization: Bearer CRON_SECRET header. Ensure CRON_SECRET is set in Vercel environment variables."
    }, { status: 401 });
  }

  try {
    // Check for jobId in query params
    const { searchParams } = new URL(request.url);
    const jobId = searchParams.get("jobId");

    let jobIdValue: string | null = null;
    if (jobId) {
      jobIdValue = jobId;
      await startJob(jobId);
      await addJobActivity(jobId, "Starting scrape job...", "info");
    }

    console.log("Starting scrape job (fast mode - AI gatekeeper skipped)...", {
      requestId,
      path,
      hasAuthHeader: !!authHeader,
      isDevelopment,
      jobId: jobIdValue,
    });

    if (jobIdValue) {
      await updateJobProgress(jobIdValue, {
        currentStep: "Scraping sources...",
        itemsProcessed: 0,
        itemsTotal: undefined,
      });
    }
    
    const { total, results } = await scrapeAll();
    
    if (jobIdValue) {
      await updateJobProgress(jobIdValue, {
        currentStep: "Processing scraped data...",
        itemsProcessed: total,
        itemsTotal: total,
      });
      await addJobActivity(
        jobIdValue,
        `Scraped ${total} items from all sources`,
        "success"
      );
    }
    
    // Combine all SaaS products
    const allProducts = [
      ...results.productHunt.products,
      ...results.github.products,
      ...results.hackerNews.products,
      ...results.theresAnAI.products,
    ];

    // Open source tools (Hugging Face Spaces)
    const openSourceTools =
      (results.huggingFace?.products as ScrapedOpenSourceTool[]) || [];

    if (jobIdValue) {
      await updateJobProgress(jobIdValue, {
        currentStep: "Saving products to database...",
        itemsProcessed: allProducts.length + openSourceTools.length,
        itemsTotal: total,
      });
    }

    // Save to database with quality filtering only (skip AI gatekeeper for fast execution)
    // Products will have viabilityScore=null and will be assessed later by /api/assess
    const { created, updated, skipped, rejected, errors } = await saveScrapedProducts(
      allProducts,
      true // skipGatekeeper=true for fast execution within Vercel timeout
    );

    const {
      created: openCreated,
      updated: openUpdated,
      skipped: openSkipped,
      errors: openErrors,
    } = await saveOpenSourceTools(openSourceTools, true);

    const summary = {
      message: "Scrape completed (fast mode)",
      timestamp: new Date().toISOString(),
      note: "Products saved without AI assessment. Run /api/assess to assess viability.",
      sources: {
        productHunt: {
          success: results.productHunt.success,
          count: results.productHunt.products.length,
          error: results.productHunt.error,
        },
        github: {
          success: results.github.success,
          count: results.github.products.length,
          error: results.github.error,
        },
        hackerNews: {
          success: results.hackerNews.success,
          count: results.hackerNews.products.length,
          error: results.hackerNews.error,
        },
        theresAnAI: {
          success: results.theresAnAI.success,
          count: results.theresAnAI.products.length,
          error: results.theresAnAI.error,
        },
        huggingFace: {
          success: results.huggingFace.success,
          count: results.huggingFace.products.length,
          error: results.huggingFace.error,
        },
      },
      totals: {
        scraped: total,
        created,
        updated,
        skipped, // Low-quality products filtered out by rule-based quality score
        rejected, // Products rejected (should be 0 in fast mode)
        errors,
        openSource: {
          scraped: openSourceTools.length,
          created: openCreated,
          updated: openUpdated,
          skipped: openSkipped,
          errors: openErrors,
        },
      },
    };

    console.log("Scrape summary:", JSON.stringify({ requestId, ...summary }, null, 2));

    if (jobIdValue) {
      await completeJob(jobIdValue, {
        summary,
        totals: {
          scraped: total,
          created,
          updated,
          skipped,
          rejected,
          errors,
          openSource: {
            scraped: openSourceTools.length,
            created: openCreated,
            updated: openUpdated,
            skipped: openSkipped,
            errors: openErrors,
          },
        },
      });
      await addJobActivity(
        jobIdValue,
        `Scrape completed: ${created} created, ${updated} updated`,
        "success"
      );
    }

    return NextResponse.json({
      ...summary,
      ...(jobIdValue ? { jobId: jobIdValue } : {}),
    });
  } catch (error) {
    console.error("Scrape job error:", { requestId, path, error });
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    
    const { searchParams } = new URL(request.url);
    const jobId = searchParams.get("jobId");
    if (jobId) {
      await failJob(jobId, errorMessage);
    }

    return NextResponse.json(
      {
        error: "Scrape job failed",
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

