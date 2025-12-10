import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import prisma from "@/lib/db";
import { scoreChannelReadiness, scoreProduct, type ProductData } from "@/lib/ai";
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
    // Check for jobId in query params
    const { searchParams } = new URL(request.url);
    const jobId = searchParams.get("jobId");

    if (jobId) {
      await startJob(jobId);
      await addJobActivity(jobId, "Starting scoring job...", "info");
    }

    console.log("Starting scoring job...", {
      requestId,
      path,
      hasAuthHeader: !!authHeader,
      isDevelopment,
      jobId,
    });

    // Find products without scores
    const productsToScore = await prisma.product.findMany({
      where: {
        scores: {
          none: {},
        },
      },
      include: {
        vendor: true,
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

    const totalToScore = productsToScore.length + openSourceToScore.length;

    if (jobId && totalToScore > 0) {
      await updateJobProgress(jobId, {
        currentStep: "Scoring products...",
        itemsProcessed: 0,
        itemsTotal: totalToScore,
      });
    }

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

    let processedCount = 0;

    for (const product of productsToScore) {
      try {
        if (jobId) {
          await updateJobProgress(jobId, {
            currentStep: "Scoring products...",
            itemsProcessed: processedCount,
            itemsTotal: totalToScore,
            currentItem: product.name,
          });
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

        // Channel scoring (only if product shows channel metadata)
        const integrationTargets = JSON.parse(product.integrationTargets || "[]");
        const channelUseCases = JSON.parse(product.channelUseCases || "[]");
        const partnerProgramFit = JSON.parse(product.partnerProgramFit || "[]");

        if (product.isChannelRelevant || integrationTargets.length || partnerProgramFit.length) {
          const channelScore = await scoreChannelReadiness({
            name: product.name,
            description: product.description || undefined,
            website: product.website || undefined,
            vendorName: product.vendor?.name,
            vendorType: product.vendor?.type,
            integrationTargets,
            channelUseCases,
            partnerProgramFit,
            signals: [product.source, product.category || ""].filter(Boolean),
          });

          await prisma.channelScore.create({
            data: {
              productId: product.id,
              channelFit: channelScore.channelFit,
              coSellReadiness: channelScore.coSellReadiness,
              integrationReadiness: channelScore.integrationReadiness,
              opportunity: channelScore.opportunity,
              evidence: JSON.stringify(channelScore.evidence),
              reasoning: channelScore.reasoning,
              confidence: channelScore.confidence,
            },
          });
        }

        results.scored++;
        processedCount++;
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
        processedCount++;
      }
    }

    for (const tool of openSourceToScore) {
      try {
        if (jobId) {
          await updateJobProgress(jobId, {
            currentStep: "Scoring open source tools...",
            itemsProcessed: processedCount,
            itemsTotal: totalToScore,
            currentItem: tool.name,
          });
        }

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
        processedCount++;
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
        processedCount++;
      }
    }

    const summary = {
      message: "Scoring completed",
      timestamp: new Date().toISOString(),
      results,
      openSource: openResults,
    };

    console.log("Scoring summary:", JSON.stringify({ requestId, ...summary }, null, 2));

    if (jobId) {
      await completeJob(jobId, {
        summary,
        scored: results.scored + openResults.scored,
        errors: results.errors + openResults.errors,
      });
      await addJobActivity(
        jobId,
        `Scoring completed: ${results.scored + openResults.scored} scored`,
        "success"
      );
    }

    return NextResponse.json({
      ...summary,
      ...(jobId ? { jobId } : {}),
    });
  } catch (error) {
    console.error("Scoring job error:", { requestId, path, error });
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    
    const { searchParams } = new URL(request.url);
    const jobId = searchParams.get("jobId");
    if (jobId) {
      await failJob(jobId, errorMessage);
    }

    return NextResponse.json(
      {
        error: "Scoring job failed",
        message: errorMessage,
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

