import { NextRequest, NextResponse } from "next/server";
import { scrapeAll, saveScrapedProducts } from "@/lib/scrapers";

// This route handles the combined scraping job
// In production, call this via Vercel Cron
export async function GET(request: NextRequest) {
  // Verify cron secret in production
  const authHeader = request.headers.get("authorization");
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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

