-- Create open source tools table for Hugging Face Spaces
CREATE TABLE "OpenSourceTool" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "tagline" TEXT,
    "description" TEXT,
    "repoUrl" TEXT,
    "spaceUrl" TEXT,
    "logo" TEXT,
    "runtime" TEXT,
    "license" TEXT,
    "tags" TEXT NOT NULL DEFAULT '[]',
    "launchDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "source" TEXT NOT NULL DEFAULT 'HUGGING_FACE',
    "sourceUrl" TEXT,
    "sourceId" TEXT,
    "author" TEXT,
    "likes" INTEGER NOT NULL DEFAULT 0,
    "downloads" INTEGER NOT NULL DEFAULT 0,
    "viabilityScore" DOUBLE PRECISION,
    "targetAudience" TEXT,
    "productType" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "OpenSourceTool_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "OpenSourceScore" (
    "id" TEXT NOT NULL,
    "openSourceToolId" TEXT NOT NULL,
    "functionalCoverage" INTEGER NOT NULL DEFAULT 0,
    "usability" INTEGER NOT NULL DEFAULT 0,
    "innovation" INTEGER NOT NULL DEFAULT 0,
    "pricing" INTEGER NOT NULL DEFAULT 0,
    "integration" INTEGER NOT NULL DEFAULT 0,
    "security" INTEGER NOT NULL DEFAULT 0,
    "compositeScore" INTEGER NOT NULL DEFAULT 0,
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "reasoning" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "OpenSourceScore_pkey" PRIMARY KEY ("id")
);

-- Indexes
CREATE UNIQUE INDEX "OpenSourceTool_slug_key" ON "OpenSourceTool"("slug");
CREATE UNIQUE INDEX "OpenSourceTool_sourceId_key" ON "OpenSourceTool"("sourceId");
CREATE INDEX "OpenSourceTool_source_idx" ON "OpenSourceTool"("source");
CREATE INDEX "OpenSourceTool_launchDate_idx" ON "OpenSourceTool"("launchDate");
CREATE INDEX "OpenSourceTool_author_idx" ON "OpenSourceTool"("author");
CREATE INDEX "OpenSourceTool_viabilityScore_idx" ON "OpenSourceTool"("viabilityScore");

CREATE INDEX "OpenSourceScore_openSourceToolId_idx" ON "OpenSourceScore"("openSourceToolId");
CREATE INDEX "OpenSourceScore_compositeScore_idx" ON "OpenSourceScore"("compositeScore");

-- Foreign keys
ALTER TABLE "OpenSourceScore"
  ADD CONSTRAINT "OpenSourceScore_openSourceToolId_fkey"
  FOREIGN KEY ("openSourceToolId") REFERENCES "OpenSourceTool"("id") ON DELETE CASCADE ON UPDATE CASCADE;

