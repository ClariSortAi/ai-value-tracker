const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkColumns() {
  try {
    const result = await prisma.$queryRaw`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'Product' 
      AND column_name IN ('viabilityScore', 'targetAudience', 'productType')
    `;
    console.log('Columns found:', JSON.stringify(result, null, 2));
    
    // Also try to query a product to see if it works
    const products = await prisma.product.findMany({ take: 1 });
    console.log('Product query successful! Found', products.length, 'products');
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    console.error('Code:', error.code);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

checkColumns();

