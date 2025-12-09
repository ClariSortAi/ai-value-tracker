-- AlterTable
ALTER TABLE "OpenSourceTool" ADD COLUMN     "bestFor" TEXT NOT NULL DEFAULT '[]',
ADD COLUMN     "enrichedAt" TIMESTAMP(3),
ADD COLUMN     "extendedDescription" TEXT,
ADD COLUMN     "keyFeatures" TEXT NOT NULL DEFAULT '[]',
ADD COLUMN     "limitations" TEXT NOT NULL DEFAULT '[]',
ADD COLUMN     "useCases" TEXT NOT NULL DEFAULT '[]',
ALTER COLUMN "viabilityScore" SET DEFAULT 0,
ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "bestFor" TEXT NOT NULL DEFAULT '[]',
ADD COLUMN     "enrichedAt" TIMESTAMP(3),
ADD COLUMN     "extendedDescription" TEXT,
ADD COLUMN     "keyFeatures" TEXT NOT NULL DEFAULT '[]',
ADD COLUMN     "limitations" TEXT NOT NULL DEFAULT '[]',
ADD COLUMN     "useCases" TEXT NOT NULL DEFAULT '[]';

-- CreateIndex
CREATE INDEX "OpenSourceTool_enrichedAt_idx" ON "OpenSourceTool"("enrichedAt");

-- CreateIndex
CREATE INDEX "Product_enrichedAt_idx" ON "Product"("enrichedAt");
