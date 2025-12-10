-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "businessCategory" TEXT,
ADD COLUMN     "hasPricingPage" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "hasTeamPage" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "hasTermsOfService" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "Product_businessCategory_idx" ON "Product"("businessCategory");
