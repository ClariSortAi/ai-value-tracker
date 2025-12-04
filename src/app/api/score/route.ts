import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { scoreProduct, type ProductData } from "@/lib/ai";

// Force dynamic execution - prevent caching
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Score products that don't have scores yet
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
  console.log("Score job auth check:", {
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
    console.error("Unauthorized score attempt:", {
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
    console.log("Starting scoring job...");

    // Find products without scores
    const productsToScore = await prisma.product.findMany({
      where: {
        scores: {
          none: {},
        },
      },
      take: 10, // Limit to avoid rate limits
    });

    console.log(`Found ${productsToScore.length} products to score`);

    const results = {
      scored: 0,
      errors: 0,
      products: [] as Array<{ name: string; score: number; confidence: number }>,
    };

    for (const product of productsToScore) {
      try {
        const productData: ProductData = {
          name: product.name,
          tagline: product.tagline || undefined,
          description: product.description || undefined,
          website: product.website || undefined,
          category: product.category || undefined,
          tags: JSON.parse(product.tags || "[]"),
          source: product.source,
          upvotes: product.upvotes || undefined,
          stars: product.stars || undefined,
        };

        const scoreResult = await scoreProduct(productData);

        // Save score to database
        await prisma.score.create({
          data: {
            productId: product.id,
            functionalCoverage: scoreResult.scores.functionalCoverage,
            usability: scoreResult.scores.usability,
            innovation: scoreResult.scores.innovation,
            pricing: scoreResult.scores.pricing,
            integration: scoreResult.scores.integration,
            security: scoreResult.scores.security,
            compositeScore: scoreResult.compositeScore,
            confidence: scoreResult.confidence,
            reasoning: JSON.stringify(scoreResult.reasoning),
          },
        });

        results.scored++;
        results.products.push({
          name: product.name,
          score: scoreResult.compositeScore,
          confidence: scoreResult.confidence,
        });

        console.log(
          `Scored: ${product.name} = ${scoreResult.compositeScore} (confidence: ${scoreResult.confidence})`
        );

        // Rate limiting - Gemini free tier: 15 RPM
        await new Promise((resolve) => setTimeout(resolve, 4000));
      } catch (error) {
        console.error(`Error scoring ${product.name}:`, error);
        results.errors++;
      }
    }

    const summary = {
      message: "Scoring completed",
      timestamp: new Date().toISOString(),
      results,
    };

    console.log("Scoring summary:", JSON.stringify(summary, null, 2));

    return NextResponse.json(summary);
  } catch (error) {
    console.error("Scoring job error:", error);
    return NextResponse.json(
      {
        error: "Scoring job failed",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// Score a specific product
export async function POST(request: NextRequest) {
  try {
    const { productId } = await request.json();

    if (!productId) {
      return NextResponse.json(
        { error: "Product ID required" },
        { status: 400 }
      );
    }

    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404 }
      );
    }

    const productData: ProductData = {
      name: product.name,
      tagline: product.tagline || undefined,
      description: product.description || undefined,
      website: product.website || undefined,
      category: product.category || undefined,
      tags: JSON.parse(product.tags || "[]"),
      source: product.source,
      upvotes: product.upvotes || undefined,
      stars: product.stars || undefined,
    };

    const scoreResult = await scoreProduct(productData);

    // Save or update score
    const existingScore = await prisma.score.findFirst({
      where: { productId: product.id },
    });

    if (existingScore) {
      await prisma.score.update({
        where: { id: existingScore.id },
        data: {
          functionalCoverage: scoreResult.scores.functionalCoverage,
          usability: scoreResult.scores.usability,
          innovation: scoreResult.scores.innovation,
          pricing: scoreResult.scores.pricing,
          integration: scoreResult.scores.integration,
          security: scoreResult.scores.security,
          compositeScore: scoreResult.compositeScore,
          confidence: scoreResult.confidence,
          reasoning: JSON.stringify(scoreResult.reasoning),
          version: { increment: 1 },
          generatedAt: new Date(),
        },
      });
    } else {
      await prisma.score.create({
        data: {
          productId: product.id,
          functionalCoverage: scoreResult.scores.functionalCoverage,
          usability: scoreResult.scores.usability,
          innovation: scoreResult.scores.innovation,
          pricing: scoreResult.scores.pricing,
          integration: scoreResult.scores.integration,
          security: scoreResult.scores.security,
          compositeScore: scoreResult.compositeScore,
          confidence: scoreResult.confidence,
          reasoning: JSON.stringify(scoreResult.reasoning),
        },
      });
    }

    return NextResponse.json({
      message: "Product scored successfully",
      product: product.name,
      score: scoreResult,
    });
  } catch (error) {
    console.error("Manual scoring error:", error);
    return NextResponse.json(
      {
        error: "Scoring failed",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

