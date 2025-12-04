-- AlterTable: Add viability assessment columns to existing Product table
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "viabilityScore" DOUBLE PRECISION DEFAULT 0;
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "targetAudience" TEXT;
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "productType" TEXT;

-- CreateIndex: Add indexes for new columns (if they don't exist)
CREATE INDEX IF NOT EXISTS "Product_targetAudience_idx" ON "Product"("targetAudience");
CREATE INDEX IF NOT EXISTS "Product_productType_idx" ON "Product"("productType");

