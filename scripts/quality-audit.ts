import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function auditDataQuality() {
  console.log('\n========================================');
  console.log('DATA QUALITY AUDIT');
  console.log('========================================\n');

  // 1. Get all products by source
  const products = await prisma.product.findMany({
    select: { 
      id: true,
      name: true, 
      description: true, 
      website: true, 
      source: true,
      businessCategory: true,
      tags: true
    }
  });

  console.log(`Total Products: ${products.length}\n`);

  // 2. Identify LISTICLES (blog posts, articles, not products)
  const listiclePatterns = [
    /^(the\s+)?\d+\s+(best|top)/i,
    /best\s+\w+\s+(for|in)\s+\d{4}/i,
    /top\s+\d+/i,
    /\d{4}\s+(guide|review|comparison)/i,
    /pick(s)?\s+for\s+\d{4}/i,
    /software\s+for\s+\d{4}/i,
    /platforms?\s+to\s+consider/i,
  ];

  const listicles = products.filter(p => 
    listiclePatterns.some(pattern => pattern.test(p.name || ''))
  );

  console.log('=== LISTICLES/ARTICLES (NOT PRODUCTS) ===');
  console.log(`Found: ${listicles.length} items that are blog posts, not products\n`);
  listicles.forEach(p => {
    console.log(`  ❌ [${p.source}] "${p.name}"`);
    console.log(`     URL: ${p.website?.substring(0, 80) || 'NONE'}`);
  });

  // 3. Identify GENERIC names (likely not real products)
  const genericPatterns = [
    /^AI\s+(for|in)\s+\w+$/i,
    /^(AI|ML)\s+\w+\s+(tool|platform|software)$/i,
  ];

  const genericNames = products.filter(p => 
    genericPatterns.some(pattern => pattern.test(p.name || '')) ||
    (p.name && p.name.length < 5 && !['Mem', 'Gong', 'n8n'].includes(p.name))
  );

  console.log('\n=== GENERIC/SUSPICIOUS NAMES ===');
  console.log(`Found: ${genericNames.length} items with generic names\n`);
  genericNames.forEach(p => {
    console.log(`  ⚠️  [${p.source}] "${p.name}"`);
  });

  // 4. Products WITHOUT website
  const noWebsite = products.filter(p => !p.website);
  console.log('\n=== NO WEBSITE URL ===');
  console.log(`Found: ${noWebsite.length} items without website\n`);
  noWebsite.slice(0, 10).forEach(p => {
    console.log(`  ⚠️  [${p.source}] "${p.name}"`);
  });

  // 5. Breakdown by source
  const bySource: Record<string, typeof products> = {};
  products.forEach(p => {
    const src = p.source || 'UNKNOWN';
    if (!bySource[src]) bySource[src] = [];
    bySource[src].push(p);
  });

  console.log('\n=== BREAKDOWN BY SOURCE ===');
  Object.entries(bySource).forEach(([source, items]) => {
    console.log(`  ${source}: ${items.length} products`);
  });

  // 6. Breakdown by category
  const byCategory: Record<string, number> = {};
  products.forEach(p => {
    const cat = p.businessCategory || 'uncategorized';
    byCategory[cat] = (byCategory[cat] || 0) + 1;
  });

  console.log('\n=== BREAKDOWN BY BUSINESS CATEGORY ===');
  Object.entries(byCategory).sort((a, b) => b[1] - a[1]).forEach(([cat, count]) => {
    console.log(`  ${cat}: ${count}`);
  });

  // 7. TAVILY products specifically
  const tavilyProducts = products.filter(p => p.source === 'TAVILY');
  console.log('\n=== ALL TAVILY PRODUCTS ===');
  tavilyProducts.forEach(p => {
    const isLikleyListicle = listiclePatterns.some(pat => pat.test(p.name || ''));
    const flag = isLikleyListicle ? '❌' : '✓';
    console.log(`  ${flag} "${p.name}"`);
    console.log(`     Category: ${p.businessCategory || 'none'}`);
    console.log(`     URL: ${p.website?.substring(0, 70) || 'NONE'}`);
  });

  // 8. Summary
  const goodProducts = products.filter(p => 
    !listiclePatterns.some(pat => pat.test(p.name || '')) &&
    p.website &&
    p.name && p.name.length >= 3
  );

  console.log('\n========================================');
  console.log('SUMMARY');
  console.log('========================================');
  console.log(`Total in DB: ${products.length}`);
  console.log(`Listicles/Articles (bad): ${listicles.length}`);
  console.log(`No website (suspicious): ${noWebsite.length}`);
  console.log(`Generic names (suspicious): ${genericNames.length}`);
  console.log(`Likely good products: ${goodProducts.length}`);
  console.log(`Quality ratio: ${((goodProducts.length / products.length) * 100).toFixed(1)}%`);

  await prisma.$disconnect();
}

auditDataQuality().catch(console.error);

