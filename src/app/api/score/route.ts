import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import prisma from "@/lib/db";
import { scoreProduct, type ProductData } from "@/lib/ai";

// Force dynamic execution - prevent caching
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Score products that don't have scores yet
// Vercel automatically sends Authorization: Bearer CRON_SECRET header when invoking cron jobs
export async function GET(request: NextRequest) {
  const requestId = randomUUID();
  const path = "/api/score";

  // Official Vercel authentication method (per Managing Cron Jobs.md)
  // Vercel automatically sends Authorization header with CRON_SECRET for both scheduled and manual triggers
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
    console.error("Unauthorized score attempt:", {
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
    console.log("Starting scoring job...", {
      requestId,
      path,
      hasAuthHeader: !!authHeader,
      isDevelopment,
    });

    // Find products without scores
    const productsToScore = await prisma.product.findMany({
      where: {
        scores: {
          none: {},
        },
      },
      take: 10, // Limit to avoid rate limits
    });

    const openSourceToScore = await prisma.openSourceTool.findMany({
      where: {
        scores: {
          none: {},
        },
      },
      take: 10,
    });

    console.log(`Found ${productsToScore.length} products to score`, { requestId });

    const results = {
      scored: 0,
      errors: 0,
      products: [] as Array<{ name: string; score: number; confidence: number }>,
    };

    const openResults = {
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
          `Scored: ${product.name} = ${scoreResult.compositeScore} (confidence: ${scoreResult.confidence})`,
          { requestId }
        );

        // Rate limiting - Gemini free tier: 15 RPM
        await new Promise((resolve) => setTimeout(resolve, 4000));
      } catch (error) {
        console.error(`Error scoring ${product.name}:`, error);
        results.errors++;
      }
    }

    for (const tool of openSourceToScore) {
      try {
        const productData: ProductData = {
          name: tool.name,
          tagline: tool.tagline || undefined,
          description: tool.description || undefined,
          website: tool.spaceUrl || tool.repoUrl || undefined,
          category: "Open Source",
          tags: JSON.parse(tool.tags || "[]"),
          source: tool.source,
          upvotes: tool.likes || undefined,
          stars: tool.downloads || undefined,
        };

        const scoreResult = await scoreProduct(productData);

        await prisma.openSourceScore.create({
          data: {
            openSourceToolId: tool.id,
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

        openResults.scored++;
        openResults.products.push({
          name: tool.name,
          score: scoreResult.compositeScore,
          confidence: scoreResult.confidence,
        });

        console.log(
          `[OpenSource][Score] ${tool.name} = ${scoreResult.compositeScore} (confidence: ${scoreResult.confidence})`,
          { requestId }
        );

        await new Promise((resolve) => setTimeout(resolve, 4000));
      } catch (error) {
        console.error(`[OpenSource] Error scoring ${tool.name}:`, error);
        openResults.errors++;
      }
    }

    const summary = {
      message: "Scoring completed",
      timestamp: new Date().toISOString(),
      results,
      openSource: openResults,
    };

    console.log("Scoring summary:", JSON.stringify({ requestId, ...summary }, null, 2));

    return NextResponse.json(summary);
  } catch (error) {
    console.error("Scoring job error:", { requestId, path, error });
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

