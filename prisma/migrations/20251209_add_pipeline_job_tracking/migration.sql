-- CreateTable
CREATE TABLE "PipelineJob" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "progress" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "currentStep" TEXT,
    "itemsProcessed" INTEGER NOT NULL DEFAULT 0,
    "itemsTotal" INTEGER,
    "currentItem" TEXT,
    "timeElapsed" INTEGER NOT NULL DEFAULT 0,
    "errors" INTEGER NOT NULL DEFAULT 0,
    "metadata" TEXT NOT NULL DEFAULT '{}',
    "activityLog" TEXT NOT NULL DEFAULT '[]',
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PipelineJob_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PipelineJob_status_idx" ON "PipelineJob"("status");

-- CreateIndex
CREATE INDEX "PipelineJob_startedAt_idx" ON "PipelineJob"("startedAt");

-- CreateIndex
CREATE INDEX "PipelineJob_type_idx" ON "PipelineJob"("type");

