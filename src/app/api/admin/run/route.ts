import { NextRequest, NextResponse } from "next/server";

const ACTIONS = ["scrape", "assess", "score"] as const;
type Action = (typeof ACTIONS)[number];

function buildInternalUrl(path: string) {
  const base =
    process.env.VERCEL_URL?.startsWith("http")
      ? process.env.VERCEL_URL
      : `https://${process.env.VERCEL_URL || "localhost:3000"}`;
  return `${base}${path}`;
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const action = body?.action as Action | undefined;

  if (!action || !ACTIONS.includes(action)) {
    return NextResponse.json(
      { error: "Invalid action", allowed: ACTIONS },
      { status: 400 }
    );
  }

  if (!process.env.CRON_SECRET) {
    return NextResponse.json(
      { error: "CRON_SECRET not set in environment" },
      { status: 500 }
    );
  }

  const targetPath =
    action === "scrape"
      ? "/api/scrape"
      : action === "assess"
      ? "/api/assess"
      : "/api/score";

  const url = buildInternalUrl(targetPath);

  try {
    const headers: Record<string, string> = {
      Authorization: `Bearer ${process.env.CRON_SECRET}`,
    };

    // If deployment protection is enabled, include bypass header when available
    if (process.env.VERCEL_AUTOMATION_BYPASS_SECRET) {
      headers["x-vercel-protection-bypass"] =
        process.env.VERCEL_AUTOMATION_BYPASS_SECRET;
    }

    const res = await fetch(url, {
      method: "GET",
      headers,
      cache: "no-store",
    });

    const text = await res.text();
    let data: unknown = null;
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      data = text || null;
    }

    return NextResponse.json(
      {
        action,
        status: res.status,
        ok: res.ok,
        data,
      },
      { status: res.ok ? 200 : res.status }
    );
  } catch (error) {
    return NextResponse.json(
      {
        error: "Failed to run action",
        action,
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

