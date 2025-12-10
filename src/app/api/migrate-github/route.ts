import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { slugify } from "@/lib/utils";

// Force dynamic execution - prevent caching
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// This route migrates existing GitHub products from Product table to OpenSourceTool table
// It should be run once as part of the source restructuring plan
export async function POST(request: NextRequest) {
  // Check authentication
  const authHeader = request.headers.get("authorization");
  const isDevelopment = process.env.NODE_ENV !== "production";
  
  const secret = process.env.CRON_SECRET;
  const hasValidSecret =
    !!secret &&
    !!authHeader &&
    (authHeader === `Bearer ${secret}` || authHeader === secret);

  const isAuthorized = isDevelopment || hasValidSecret;
  
  if (!isAuthorized) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    console.log("[Migrate] Starting GitHub product migration to OpenSourceTool...");

    // Find all products with source = GITHUB
    const githubProducts = await prisma.product.findMany({
      where: {
        source: "GITHUB",
      },
      include: {
        scores: true,
      },
    });

    console.log(`[Migrate] Found ${githubProducts.length} GitHub products to migrate`);

    let migrated = 0;
    let skipped = 0;
    let errors = 0;

    for (const product of githubProducts) {
      try {
        // Check if already exists in OpenSourceTool
        const existingTool = await prisma.openSourceTool.findFirst({
          where: {
            OR: [
              { sourceId: product.sourceId ? `github-${product.sourceId}` : undefined },
              { sourceId: product.sourceId },
              { slug: product.slug },
            ],
          },
        });

        if (existingTool) {
          console.log(`[Migrate] Skipped: ${product.name} (already exists in OpenSourceTool)`);
          
          // Delete from Product table to avoid duplication
          await prisma.product.delete({
            where: { id: product.id },
          });
          skipped++;
          continue;
        }

        // Generate unique slug
        let slug = slugify(product.name);
        let counter = 1;
        while (await prisma.openSourceTool.findUnique({ where: { slug } })) {
          slug = `${slugify(product.name)}-${counter}`;
          counter++;
        }

        // Create new OpenSourceTool
        const openSourceTool = await prisma.openSourceTool.create({
          data: {
            name: product.name,
            slug,
            tagline: product.tagline,
            description: product.description,
            repoUrl: product.sourceUrl, // GitHub URL is the repo URL
            spaceUrl: product.website, // Website is the demo/homepage
            logo: product.logo,
            runtime: product.category, // Use category as runtime placeholder
            license: undefined, // Will be populated by future scrapes
            tags: product.tags,
            launchDate: product.launchDate,
            source: "GITHUB",
            sourceUrl: product.sourceUrl,
            sourceId: product.sourceId?.startsWith("github-") 
              ? product.sourceId 
              : `github-${product.sourceId || product.name}`,
            author: undefined, // Will be populated by future scrapes
            likes: product.stars || 0, // Stars = likes
            downloads: 0, // Forks would be downloads, but not stored in Product
            viabilityScore: product.viabilityScore,
            targetAudience: product.targetAudience,
            productType: product.productType,
            createdAt: product.createdAt,
            updatedAt: new Date(),
          },
        });

        // Migrate scores if any
        for (const score of product.scores) {
          await prisma.openSourceScore.create({
            data: {
              openSourceToolId: openSourceTool.id,
              functionalCoverage: score.functionalCoverage,
              usability: score.usability,
              innovation: score.innovation,
              pricing: score.pricing,
              integration: score.integration,
              security: score.security,
              compositeScore: score.compositeScore,
              confidence: score.confidence,
              reasoning: score.reasoning,
              version: score.version,
              generatedAt: score.generatedAt,
            },
          });
        }

        // Delete from Product table
        await prisma.product.delete({
          where: { id: product.id },
        });

        console.log(`[Migrate] Migrated: ${product.name}`);
        migrated++;

      } catch (error) {
        console.error(`[Migrate] Error migrating ${product.name}:`, error);
        errors++;
      }
    }

    const summary = {
      message: "GitHub migration completed",
      migrated,
      skipped,
      errors,
      total: githubProducts.length,
    };

    console.log("[Migrate] Summary:", JSON.stringify(summary, null, 2));

    return NextResponse.json(summary);

  } catch (error) {
    console.error("[Migrate] Migration failed:", error);
    return NextResponse.json(
      { 
        error: "Migration failed", 
        message: error instanceof Error ? error.message : "Unknown error" 
      },
      { status: 500 }
    );
  }
}

// Allow GET for easy testing
export async function GET(request: NextRequest) {
  return POST(request);
}


