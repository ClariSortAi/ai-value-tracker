import { NextRequest, NextResponse } from "next/server";

const ACTIONS = [
  "scrape",
  "assess",
  "score",
  "cleanup-identify",
  "cleanup-remove",
  "cleanup-prune",
  "full-pipeline",
] as const;
type Action = (typeof ACTIONS)[number];

function buildInternalUrl(path: string) {
  const base =
    process.env.VERCEL_URL?.startsWith("http")
      ? process.env.VERCEL_URL
      : `https://${process.env.VERCEL_URL || "localhost:3000"}`;
  return `${base}${path}`;
}

async function parseAction(request: NextRequest): Promise<Action | undefined> {
  if (request.method === "POST") {
    const body = await request.json().catch(() => ({}));
    return body?.action as Action | undefined;
  }
  const url = new URL(request.url);
  return url.searchParams.get("action") as Action | undefined;
}

export async function GET(request: NextRequest) {
  return runAction(request);
}

export async function POST(request: NextRequest) {
  return runAction(request);
}

async function runAction(request: NextRequest) {
  const action = await parseAction(request);

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
      : action === "score"
      ? "/api/score"
      : action === "cleanup-identify"
      ? "/api/admin/cleanup?action=identify"
      : action === "cleanup-remove"
      ? "/api/admin/cleanup?action=remove"
      : action === "cleanup-prune"
      ? "/api/admin/cleanup?action=prune"
      : "/api/admin/run/full-pipeline";

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

    // For full-pipeline, orchestrate sequentially instead of single fetch
    if (action === "full-pipeline") {
      const steps: Array<{ name: string; path: string }> = [
        { name: "scrape", path: "/api/scrape" },
        { name: "assess", path: "/api/assess" },
        { name: "score", path: "/api/score" },
        { name: "cleanup", path: "/api/admin/cleanup?action=remove" },
      ];

      const results: Record<
        string,
        { status: number; ok: boolean; data: unknown }
      > = {};

      for (const step of steps) {
        const res = await fetch(buildInternalUrl(step.path), {
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
        results[step.name] = { status: res.status, ok: res.ok, data };

        // If a step fails, stop early
        if (!res.ok) {
          return NextResponse.json(
            {
              action,
              ok: false,
              failedStep: step.name,
              results,
            },
            { status: 500 }
          );
        }

        // Small delay between steps to be gentle on rate limits
        await new Promise((resolve) => setTimeout(resolve, 500));
      }

      return NextResponse.json(
        {
          action,
          ok: true,
          results,
        },
        { status: 200 }
      );
    } else {
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
    }
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

