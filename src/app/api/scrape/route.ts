import { NextRequest, NextResponse } from "next/server";
import { scrapeAll, saveScrapedProducts } from "@/lib/scrapers";

// Force dynamic execution - prevent caching
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// This route handles the combined scraping job
// In production, call this via Vercel Cron
export async function GET(request: NextRequest) {
  // Check if this is a Vercel Cron request
  const isVercelCron = request.headers.get("x-vercel-cron") === "1";
  
  // Check for manual trigger with CRON_SECRET
  const authHeader = request.headers.get("authorization");
  const hasValidSecret = process.env.CRON_SECRET 
    ? authHeader === `Bearer ${process.env.CRON_SECRET}`
    : false;
  
  // Allow in development without auth (for testing)
  const isDevelopment = process.env.NODE_ENV !== "production";
  
  // Authorize if: Vercel Cron OR valid secret OR development mode
  const isAuthorized = isVercelCron || hasValidSecret || isDevelopment;
  
  // Log authentication attempt for debugging
  console.log("Scrape job auth check:", {
    timestamp: new Date().toISOString(),
    isVercelCron,
    hasAuthHeader: !!authHeader,
    hasCronSecret: !!process.env.CRON_SECRET,
    hasValidSecret,
    isDevelopment,
    isAuthorized,
    nodeEnv: process.env.NODE_ENV,
  });
  
  if (!isAuthorized) {
    console.error("Unauthorized scrape attempt:", {
      hasVercelCronHeader: !!request.headers.get("x-vercel-cron"),
      hasAuthHeader: !!authHeader,
      hasCronSecret: !!process.env.CRON_SECRET,
      nodeEnv: process.env.NODE_ENV,
    });
    return NextResponse.json({ 
      error: "Unauthorized",
      hint: process.env.CRON_SECRET 
        ? "Set Authorization: Bearer CRON_SECRET header" 
        : "Set CRON_SECRET env var or use Vercel Cron"
    }, { status: 401 });
  }

  try {
    console.log("Starting scrape job...");
    
    const { total, results } = await scrapeAll();
    
    // Combine all products
    const allProducts = [
      ...results.productHunt.products,
      ...results.github.products,
      ...results.hackerNews.products,
      ...results.theresAnAI.products,
    ];

    // Save to database with quality filtering + AI gatekeeper
    const { created, updated, skipped, rejected, errors } = await saveScrapedProducts(allProducts);

    const summary = {
      message: "Scrape completed",
      timestamp: new Date().toISOString(),
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
      },
      totals: {
        scraped: total,
        created,
        updated,
        skipped, // Low-quality products filtered out
        rejected, // Products rejected by AI gatekeeper (not commercial B2B SaaS)
        errors,
      },
    };

    console.log("Scrape summary:", JSON.stringify(summary, null, 2));

    return NextResponse.json(summary);
  } catch (error) {
    console.error("Scrape job error:", error);
    return NextResponse.json(
      {
        error: "Scrape job failed",
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

