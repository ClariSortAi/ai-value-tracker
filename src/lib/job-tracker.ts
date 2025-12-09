import prisma from "@/lib/db";
import { randomUUID } from "crypto";

export type JobType = "scrape" | "assess" | "score" | "enrich" | "cleanup" | "full-pipeline";
export type JobStatus = "pending" | "running" | "completed" | "failed";

export interface JobProgress {
  currentStep?: string;
  itemsProcessed: number;
  itemsTotal?: number;
  currentItem?: string;
  errors?: number;
}

export interface ActivityLogEntry {
  timestamp: string;
  message: string;
  type?: "info" | "success" | "error" | "warning";
}

// Create a new job
export async function createJob(
  type: JobType,
  metadata: Record<string, unknown> = {}
): Promise<string> {
  const job = await prisma.pipelineJob.create({
    data: {
      id: randomUUID(),
      type,
      status: "pending",
      metadata: JSON.stringify(metadata),
    },
  });
  return job.id;
}

// Start a job
export async function startJob(jobId: string): Promise<void> {
  await prisma.pipelineJob.update({
    where: { id: jobId },
    data: {
      status: "running",
      startedAt: new Date(),
    },
  });
}

// Update job progress
export async function updateJobProgress(
  jobId: string,
  progress: JobProgress
): Promise<void> {
  const job = await prisma.pipelineJob.findUnique({
    where: { id: jobId },
  });

  if (!job) return;

  const progressPercent =
    progress.itemsTotal && progress.itemsTotal > 0
      ? Math.min(100, (progress.itemsProcessed / progress.itemsTotal) * 100)
      : job.progress; // Keep existing progress if total unknown

  const timeElapsed = job.startedAt
    ? Math.floor((Date.now() - job.startedAt.getTime()) / 1000)
    : 0;

  // Parse and update activity log
  const activityLog: ActivityLogEntry[] = JSON.parse(
    job.activityLog || "[]"
  );
  if (progress.currentItem) {
    activityLog.push({
      timestamp: new Date().toISOString(),
      message: `Processing: ${progress.currentItem}`,
      type: "info",
    });
    // Keep only last 20 entries
    if (activityLog.length > 20) {
      activityLog.shift();
    }
  }

  await prisma.pipelineJob.update({
    where: { id: jobId },
    data: {
      progress: progressPercent,
      currentStep: progress.currentStep || job.currentStep,
      itemsProcessed: progress.itemsProcessed,
      itemsTotal: progress.itemsTotal ?? job.itemsTotal,
      currentItem: progress.currentItem,
      timeElapsed,
      errors: progress.errors ?? job.errors,
      activityLog: JSON.stringify(activityLog),
    },
  });
}

// Add activity log entry
export async function addJobActivity(
  jobId: string,
  message: string,
  type: ActivityLogEntry["type"] = "info"
): Promise<void> {
  const job = await prisma.pipelineJob.findUnique({
    where: { id: jobId },
  });

  if (!job) return;

  const activityLog: ActivityLogEntry[] = JSON.parse(
    job.activityLog || "[]"
  );
  activityLog.push({
    timestamp: new Date().toISOString(),
    message,
    type,
  });

  // Keep only last 20 entries
  if (activityLog.length > 20) {
    activityLog.shift();
  }

  await prisma.pipelineJob.update({
    where: { id: jobId },
    data: {
      activityLog: JSON.stringify(activityLog),
    },
  });
}

// Complete a job
export async function completeJob(
  jobId: string,
  metadata?: Record<string, unknown>
): Promise<void> {
  const job = await prisma.pipelineJob.findUnique({
    where: { id: jobId },
  });

  if (!job) return;

  const finalMetadata = metadata
    ? { ...JSON.parse(job.metadata || "{}"), ...metadata }
    : JSON.parse(job.metadata || "{}");

  const timeElapsed = job.startedAt
    ? Math.floor((Date.now() - job.startedAt.getTime()) / 1000)
    : 0;

  await prisma.pipelineJob.update({
    where: { id: jobId },
    data: {
      status: "completed",
      progress: 100,
      completedAt: new Date(),
      timeElapsed,
      metadata: JSON.stringify(finalMetadata),
      currentItem: null,
    },
  });
}

// Fail a job
export async function failJob(
  jobId: string,
  errorMessage: string
): Promise<void> {
  const job = await prisma.pipelineJob.findUnique({
    where: { id: jobId },
  });

  if (!job) return;

  const timeElapsed = job.startedAt
    ? Math.floor((Date.now() - job.startedAt.getTime()) / 1000)
    : 0;

  await prisma.pipelineJob.update({
    where: { id: jobId },
    data: {
      status: "failed",
      completedAt: new Date(),
      errorMessage,
      timeElapsed,
      currentItem: null,
    },
  });

  // Add to activity log
  await addJobActivity(jobId, `Error: ${errorMessage}`, "error");
}

// Get job status
export async function getJobStatus(jobId: string) {
  const job = await prisma.pipelineJob.findUnique({
    where: { id: jobId },
  });

  if (!job) return null;

  return {
    id: job.id,
    type: job.type,
    status: job.status as JobStatus,
    progress: job.progress,
    currentStep: job.currentStep,
    itemsProcessed: job.itemsProcessed,
    itemsTotal: job.itemsTotal,
    currentItem: job.currentItem,
    timeElapsed: job.timeElapsed,
    errors: job.errors,
    metadata: JSON.parse(job.metadata || "{}"),
    activityLog: JSON.parse(job.activityLog || "[]") as ActivityLogEntry[],
    startedAt: job.startedAt,
    completedAt: job.completedAt,
    errorMessage: job.errorMessage,
    createdAt: job.createdAt,
    updatedAt: job.updatedAt,
  };
}

// List recent jobs
export async function listJobs(
  limit: number = 10,
  type?: JobType,
  status?: JobStatus
) {
  const jobs = await prisma.pipelineJob.findMany({
    where: {
      ...(type ? { type } : {}),
      ...(status ? { status } : {}),
    },
    orderBy: {
      createdAt: "desc",
    },
    take: limit,
  });

  return jobs.map((job) => ({
    id: job.id,
    type: job.type,
    status: job.status as JobStatus,
    progress: job.progress,
    currentStep: job.currentStep,
    itemsProcessed: job.itemsProcessed,
    itemsTotal: job.itemsTotal,
    timeElapsed: job.timeElapsed,
    errors: job.errors,
    startedAt: job.startedAt,
    completedAt: job.completedAt,
    createdAt: job.createdAt,
  }));
}

