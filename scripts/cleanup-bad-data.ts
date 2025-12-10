import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Patterns that indicate listicles/articles (NOT products)
const LISTICLE_PATTERNS = [
  /^(the\s+)?\d+\s+(best|top|great)/i,
  /best\s+[\w\s]+\s+(for|in)\s+\d{4}/i,
  /top\s+\d+\s/i,
  /\d{4}\s+(guide|review|comparison|picks)/i,
  /picks?\s+(for\s+)?\d{4}/i,
  /platforms?\s+to\s+consider/i,
  /:\s*my\s+(top\s+)?\d+/i,
  /software\s+(for|in)\s+\d{4}/i,
];

// URL patterns that indicate blog/article content
const BLOG_URL_PATTERNS = [
  /\/blog\//i,
  /\/article\//i,
  /\/learn\//i,
  /\/resources?\//i,
  /\/guide\//i,
  /\/comparison\//i,
  /\/best-/i,
  /\/top-\d+/i,
];

// Names that are too generic (pricing pages, etc.)
const GENERIC_NAME_PATTERNS = [
  /^(plans?\s*&?\s*)?pricing$/i,
  /^AI\s+(for|in)\s+\w+$/i,
];

async function cleanupBadData() {
  console.log('\n========================================');
  console.log('CLEANING UP BAD DATA');
  console.log('========================================\n');

  const products = await prisma.product.findMany({
    select: {
      id: true,
      name: true,
      website: true,
      source: true,
    }
  });

  const toDelete: string[] = [];

  for (const product of products) {
    let reason: string | null = null;
    const name = product.name || '';
    const url = product.website || '';

    // Check for listicle titles
    for (const pattern of LISTICLE_PATTERNS) {
      if (pattern.test(name)) {
        reason = `Listicle title: "${name}"`;
        break;
      }
    }

    // Check for blog URLs
    if (!reason) {
      for (const pattern of BLOG_URL_PATTERNS) {
        if (pattern.test(url)) {
          reason = `Blog URL: ${url}`;
          break;
        }
      }
    }

    // Check for generic names
    if (!reason) {
      for (const pattern of GENERIC_NAME_PATTERNS) {
        if (pattern.test(name)) {
          reason = `Generic name: "${name}"`;
          break;
        }
      }
    }

    if (reason) {
      console.log(`  ❌ DELETE [${product.source}] "${product.name}"`);
      console.log(`     Reason: ${reason}`);
      toDelete.push(product.id);
    }
  }

  console.log(`\n========================================`);
  console.log(`Found ${toDelete.length} items to delete out of ${products.length} total`);
  console.log(`========================================\n`);

  if (toDelete.length > 0) {
    console.log('Deleting bad entries...');
    const result = await prisma.product.deleteMany({
      where: { id: { in: toDelete } }
    });
    console.log(`Deleted ${result.count} entries`);
  }

  // Show remaining stats
  const remaining = await prisma.product.groupBy({
    by: ['source'],
    _count: true,
  });

  console.log('\n=== REMAINING PRODUCTS BY SOURCE ===');
  remaining.forEach(r => console.log(`  ${r.source}: ${r._count}`));

  const byCategory = await prisma.product.groupBy({
    by: ['businessCategory'],
    _count: true,
  });

  console.log('\n=== REMAINING BY CATEGORY ===');
  byCategory.forEach(r => console.log(`  ${r.businessCategory || 'uncategorized'}: ${r._count}`));

  await prisma.$disconnect();
}

cleanupBadData().catch(console.error);

