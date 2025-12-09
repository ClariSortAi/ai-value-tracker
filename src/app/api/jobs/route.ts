import { NextRequest, NextResponse } from "next/server";
import { listJobs } from "@/lib/job-tracker";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "10");
    const type = searchParams.get("type") as
      | "scrape"
      | "assess"
      | "score"
      | "cleanup"
      | "full-pipeline"
      | null;
    const status = searchParams.get("status") as
      | "pending"
      | "running"
      | "completed"
      | "failed"
      | null;

    const jobs = await listJobs(limit, type || undefined, status || undefined);

    return NextResponse.json({
      jobs,
      total: jobs.length,
    });
  } catch (error) {
    console.error("Error fetching jobs:", error);
    return NextResponse.json(
      { error: "Failed to fetch jobs" },
      { status: 500 }
    );
  }
}

