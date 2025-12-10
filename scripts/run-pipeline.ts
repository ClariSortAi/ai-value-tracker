import { PrismaClient } from '@prisma/client';
import { scrapeAll, saveScrapedProducts, saveOpenSourceTools } from '../src/lib/scrapers';
import { scrapeTavilyDiscovery } from '../src/lib/scrapers/tavily-discovery';
import { scrapeFutureTools } from '../src/lib/scrapers/futuretools';
import { assessCommercialViability } from '../src/lib/ai/gatekeeper';
import type { ScrapedOpenSourceTool, ScrapedProduct } from '../src/lib/scrapers/types';

const prisma = new PrismaClient();

async function runPipeline() {
  console.log("🚀 Starting full pipeline run...\n");

  // Step 1: Run existing scrapers
  console.log("=== STEP 1: Scraping existing sources ===\n");
  
  try {
    const { total, results } = await scrapeAll();
    console.log(`Scraped ${total} items from existing sources:`);
    console.log(`  - Product Hunt: ${results.productHunt.products.length} (${results.productHunt.success ? 'OK' : 'FAILED: ' + results.productHunt.error})`);
    console.log(`  - GitHub: ${results.github.products.length} (${results.github.success ? 'OK' : 'FAILED: ' + results.github.error})`);
    console.log(`  - Hacker News: ${results.hackerNews.products.length} (${results.hackerNews.success ? 'OK' : 'FAILED: ' + results.hackerNews.error})`);
    console.log(`  - There's An AI: ${results.theresAnAI.products.length} (${results.theresAnAI.success ? 'OK' : 'FAILED: ' + results.theresAnAI.error})`);
    console.log(`  - Hugging Face: ${results.huggingFace.products.length} (${results.huggingFace.success ? 'OK' : 'FAILED: ' + results.huggingFace.error})`);

    // Combine products
    const allProducts: ScrapedProduct[] = [
      ...results.productHunt.products,
      ...results.hackerNews.products,
      ...results.theresAnAI.products,
    ];

    // GitHub goes to open source
    const githubTools = results.github.products as ScrapedOpenSourceTool[];
    const huggingFaceTools = results.huggingFace.products as ScrapedOpenSourceTool[];

    console.log(`\nSaving ${allProducts.length} products (skipping gatekeeper for speed)...`);
    const productResult = await saveScrapedProducts(allProducts, true);
    console.log(`  Created: ${productResult.created}, Updated: ${productResult.updated}, Skipped: ${productResult.skipped}, Errors: ${productResult.errors}`);

    console.log(`\nSaving ${githubTools.length + huggingFaceTools.length} open source tools...`);
    const osResult = await saveOpenSourceTools([...githubTools, ...huggingFaceTools], true);
    console.log(`  Created: ${osResult.created}, Updated: ${osResult.updated}, Skipped: ${osResult.skipped}, Errors: ${osResult.errors}`);

  } catch (error) {
    console.error("Error in existing scrapers:", error);
  }

  // Step 2: Run Tavily discovery
  console.log("\n=== STEP 2: Tavily Commercial Discovery ===\n");
  
  try {
    const tavilyResult = await scrapeTavilyDiscovery();
    console.log(`Tavily: ${tavilyResult.products.length} products (${tavilyResult.success ? 'OK' : 'FAILED: ' + tavilyResult.error})`);
    
    if (tavilyResult.products.length > 0) {
      console.log("Saving Tavily products...");
      const saveResult = await saveScrapedProducts(tavilyResult.products, true);
      console.log(`  Created: ${saveResult.created}, Updated: ${saveResult.updated}, Skipped: ${saveResult.skipped}, Errors: ${saveResult.errors}`);
    }
  } catch (error) {
    console.error("Tavily scraper error:", error);
  }

  // Step 3: Run FutureTools
  console.log("\n=== STEP 3: FutureTools Directory ===\n");
  
  try {
    const futureToolsResult = await scrapeFutureTools();
    console.log(`FutureTools: ${futureToolsResult.products.length} products (${futureToolsResult.success ? 'OK' : 'FAILED: ' + futureToolsResult.error})`);
    
    if (futureToolsResult.products.length > 0) {
      console.log("Saving FutureTools products...");
      const saveResult = await saveScrapedProducts(futureToolsResult.products, true);
      console.log(`  Created: ${saveResult.created}, Updated: ${saveResult.updated}, Skipped: ${saveResult.skipped}, Errors: ${saveResult.errors}`);
    }
  } catch (error) {
    console.error("FutureTools scraper error:", error);
  }

  // Step 4: Run AI assessment on unassessed products
  console.log("\n=== STEP 4: AI Assessment (with businessCategory) ===\n");
  
  try {
    const unassessedProducts = await prisma.product.findMany({
      where: {
        OR: [
          { viabilityScore: null },
          { businessCategory: null }
        ]
      },
      take: 50 // Limit to avoid timeout
    });

    console.log(`Found ${unassessedProducts.length} products needing assessment...`);
    
    let assessed = 0;
    let rejected = 0;
    let errors = 0;

    for (const product of unassessedProducts) {
      try {
        console.log(`  Assessing: ${product.name}...`);
        
        const viability = await assessCommercialViability({
          name: product.name,
          tagline: product.tagline || undefined,
          description: product.description || undefined,
          website: product.website || undefined,
          category: product.category || undefined,
          tags: JSON.parse(product.tags || '[]'),
          launchDate: product.launchDate || undefined,
          source: product.source,
          sourceUrl: product.sourceUrl || undefined,
          sourceId: product.sourceId || undefined,
        });

        // Check if should be rejected
        const isDeveloperTool = viability.targetAudience === "developer";
        const isOpenSourceInfra = viability.productType === "library" || viability.productType === "framework";
        const isTutorialOrExam = viability.productType === "tutorial" || viability.productType === "exam_prep" || viability.productType === "student_tool";
        
        const shouldReject = 
          isTutorialOrExam ||
          isOpenSourceInfra ||
          (!viability.isCommercialSaaS && !isDeveloperTool) ||
          (!viability.isCommercialSaaS && isDeveloperTool && viability.confidence < 0.6);

        if (shouldReject) {
          console.log(`    ❌ Rejected: ${viability.rejectionReason || 'Not commercial SaaS'}`);
          await prisma.product.delete({ where: { id: product.id } });
          rejected++;
        } else {
          await prisma.product.update({
            where: { id: product.id },
            data: {
              viabilityScore: viability.confidence,
              targetAudience: viability.targetAudience,
              productType: viability.productType,
              businessCategory: viability.businessCategory,
              hasPricingPage: viability.hasPricingPage,
              hasTeamPage: viability.hasTeamPage,
              hasTermsOfService: viability.hasTermsOfService,
            }
          });
          console.log(`    ✅ ${viability.businessCategory} | ${viability.targetAudience} | Score: ${viability.confidence}`);
          assessed++;
        }

        // Rate limit
        await new Promise(resolve => setTimeout(resolve, 500));

      } catch (error) {
        console.error(`    Error assessing ${product.name}:`, error);
        errors++;
      }
    }

    console.log(`\nAssessment complete: ${assessed} assessed, ${rejected} rejected, ${errors} errors`);

  } catch (error) {
    console.error("Assessment error:", error);
  }

  // Final summary
  console.log("\n=== FINAL DATABASE STATE ===\n");
  
  const productCount = await prisma.product.count();
  const openSourceCount = await prisma.openSourceTool.count();
  
  const productsByCategory = await prisma.product.groupBy({
    by: ['businessCategory'],
    _count: { id: true }
  });
  
  const productsBySource = await prisma.product.groupBy({
    by: ['source'],
    _count: { id: true }
  });

  console.log(`Total Products: ${productCount}`);
  console.log(`Total Open Source Tools: ${openSourceCount}`);
  
  console.log("\nProducts by Category:");
  productsByCategory.forEach(c => console.log(`  ${c.businessCategory || 'NULL'}: ${c._count.id}`));
  
  console.log("\nProducts by Source:");
  productsBySource.forEach(s => console.log(`  ${s.source}: ${s._count.id}`));

  await prisma.$disconnect();
  console.log("\n✅ Pipeline complete!");
}

runPipeline().catch(console.error);

