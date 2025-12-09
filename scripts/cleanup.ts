import prisma from '../src/lib/db';
import { identifyLowQualityProducts } from '../src/lib/scrapers';

async function main() {
  console.log('Identifying low-quality products...\n');
  
  const identified = await identifyLowQualityProducts();
  
  console.log(`Found ${identified.total} low-quality products:\n`);
  
  for (const product of identified.products) {
    console.log(`  - ${product.name}: ${product.reason} (quality: ${product.quality})`);
  }
  
  if (identified.products.length === 0) {
    console.log('No low-quality products found!');
    return;
  }
  
  // Confirm deletion
  console.log(`\nDeleting ${identified.products.length} products...`);
  
  const productIds = identified.products.map(p => p.id);
  const result = await prisma.product.deleteMany({
    where: { id: { in: productIds } }
  });
  
  console.log(`Deleted ${result.count} products.`);
  
  // Show remaining products
  const remaining = await prisma.product.findMany({
    select: { name: true, tagline: true, upvotes: true },
    orderBy: { upvotes: 'desc' },
    take: 10
  });
  
  console.log('\nTop 10 remaining products:');
  for (const p of remaining) {
    console.log(`  - ${p.name} (${p.upvotes} upvotes): ${p.tagline?.substring(0, 50)}...`);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

