import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function analyzeDatabase() {
  console.log("=== DATABASE ANALYSIS ===\n");

  // 1. Product table summary
  const productCount = await prisma.product.count();
  console.log(`Total Products: ${productCount}\n`);

  // 2. Products by source
  const productsBySource = await prisma.product.groupBy({
    by: ['source'],
    _count: { id: true },
    orderBy: { _count: { id: 'desc' } }
  });
  console.log("Products by Source:");
  productsBySource.forEach(s => console.log(`  ${s.source}: ${s._count.id}`));

  // 3. Products by businessCategory
  const productsByCategory = await prisma.product.groupBy({
    by: ['businessCategory'],
    _count: { id: true },
    orderBy: { _count: { id: 'desc' } }
  });
  console.log("\nProducts by Business Category:");
  productsByCategory.forEach(c => console.log(`  ${c.businessCategory || 'NULL'}: ${c._count.id}`));

  // 4. Products by targetAudience
  const productsByAudience = await prisma.product.groupBy({
    by: ['targetAudience'],
    _count: { id: true },
    orderBy: { _count: { id: 'desc' } }
  });
  console.log("\nProducts by Target Audience:");
  productsByAudience.forEach(a => console.log(`  ${a.targetAudience || 'NULL'}: ${a._count.id}`));

  // 5. Products by productType
  const productsByType = await prisma.product.groupBy({
    by: ['productType'],
    _count: { id: true },
    orderBy: { _count: { id: 'desc' } }
  });
  console.log("\nProducts by Product Type:");
  productsByType.forEach(t => console.log(`  ${t.productType || 'NULL'}: ${t._count.id}`));

  // 6. Sample of products with categories
  const sampleProducts = await prisma.product.findMany({
    select: {
      name: true,
      source: true,
      businessCategory: true,
      targetAudience: true,
      productType: true,
      viabilityScore: true,
      hasPricingPage: true,
      hasTeamPage: true,
      hasTermsOfService: true
    },
    take: 20,
    orderBy: { createdAt: 'desc' }
  });
  console.log("\nRecent Products Sample:");
  sampleProducts.forEach(p => {
    console.log(`  - ${p.name} | Source: ${p.source} | Category: ${p.businessCategory || 'N/A'} | Audience: ${p.targetAudience || 'N/A'} | Type: ${p.productType || 'N/A'} | Score: ${p.viabilityScore || 'N/A'}`);
  });

  // 7. OpenSourceTool table summary
  console.log("\n=== OPEN SOURCE TOOLS ===\n");
  const openSourceCount = await prisma.openSourceTool.count();
  console.log(`Total Open Source Tools: ${openSourceCount}\n`);

  const openSourceBySource = await prisma.openSourceTool.groupBy({
    by: ['source'],
    _count: { id: true },
    orderBy: { _count: { id: 'desc' } }
  });
  console.log("Open Source Tools by Source:");
  openSourceBySource.forEach(s => console.log(`  ${s.source}: ${s._count.id}`));

  // 8. Sample open source tools
  const sampleOpenSource = await prisma.openSourceTool.findMany({
    select: {
      name: true,
      source: true,
      likes: true,
      downloads: true,
      viabilityScore: true
    },
    take: 20,
    orderBy: { likes: 'desc' }
  });
  console.log("\nTop Open Source Tools by Likes:");
  sampleOpenSource.forEach(t => {
    console.log(`  - ${t.name} | Source: ${t.source} | Likes: ${t.likes} | Downloads: ${t.downloads}`);
  });

  // 9. Check for GitHub products still in Product table
  console.log("\n=== SOURCE ANALYSIS ===\n");
  
  const githubInProducts = await prisma.product.findMany({
    where: { source: 'GITHUB' },
    select: { name: true }
  });
  console.log(`GitHub products in Product table (should be 0): ${githubInProducts.length}`);
  githubInProducts.forEach(p => console.log(`  - ${p.name}`));

  const hackerNewsProducts = await prisma.product.findMany({
    where: { source: 'HACKER_NEWS' },
    select: { name: true, viabilityScore: true }
  });
  console.log(`\nHacker News products: ${hackerNewsProducts.length}`);
  hackerNewsProducts.forEach(p => console.log(`  - ${p.name} (score: ${p.viabilityScore})`));

  const tavilyProducts = await prisma.product.findMany({
    where: { source: 'TAVILY' },
    select: { name: true, viabilityScore: true }
  });
  console.log(`\nTavily products: ${tavilyProducts.length}`);
  tavilyProducts.forEach(p => console.log(`  - ${p.name} (score: ${p.viabilityScore})`));

  const manualProducts = await prisma.product.findMany({
    where: { source: 'MANUAL' },
    select: { name: true, viabilityScore: true }
  });
  console.log(`\nManual/FutureTools products: ${manualProducts.length}`);
  manualProducts.forEach(p => console.log(`  - ${p.name} (score: ${p.viabilityScore})`));

  // 10. Products without viability assessment
  const unassessedProducts = await prisma.product.count({
    where: { viabilityScore: null }
  });
  console.log(`\nProducts without viability assessment: ${unassessedProducts}`);

  const unassessedOpenSource = await prisma.openSourceTool.count({
    where: { viabilityScore: null }
  });
  console.log(`Open Source Tools without viability assessment: ${unassessedOpenSource}`);

  // 11. Check all products with their full details
  console.log("\n=== ALL PRODUCTS DETAIL ===\n");
  const allProducts = await prisma.product.findMany({
    select: {
      name: true,
      source: true,
      website: true,
      businessCategory: true,
      targetAudience: true,
      productType: true,
      viabilityScore: true,
      hasPricingPage: true,
      hasTeamPage: true,
      hasTermsOfService: true
    }
  });
  allProducts.forEach(p => {
    console.log(`${p.name}:`);
    console.log(`  Source: ${p.source} | Website: ${p.website}`);
    console.log(`  Category: ${p.businessCategory || 'NULL'} | Audience: ${p.targetAudience || 'NULL'} | Type: ${p.productType || 'NULL'}`);
    console.log(`  Score: ${p.viabilityScore} | Pricing: ${p.hasPricingPage} | Team: ${p.hasTeamPage} | ToS: ${p.hasTermsOfService}`);
    console.log('');
  });

  // 12. Check GitHub in OpenSourceTool
  const githubInOpenSource = await prisma.openSourceTool.count({
    where: { source: 'GITHUB' }
  });
  console.log(`GitHub in OpenSourceTool table: ${githubInOpenSource}`);

  await prisma.$disconnect();
}

analyzeDatabase().catch(console.error);

