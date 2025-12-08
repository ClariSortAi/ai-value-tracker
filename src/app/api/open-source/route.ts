import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get("search") || "";
    const sortBy = searchParams.get("sortBy") || "score"; // score | date | likes
    const limit = parseInt(searchParams.get("limit") || "30");
    const offset = parseInt(searchParams.get("offset") || "0");

    const tools = await prisma.openSourceTool.findMany({
      include: {
        scores: {
          orderBy: { generatedAt: "desc" },
          take: 1,
        },
      },
    });

    let filtered = tools.map((tool) => ({
      ...tool,
      tags: JSON.parse(tool.tags || "[]") as string[],
    }));

    if (search) {
      const query = search.toLowerCase();
      filtered = filtered.filter(
        (t) =>
          t.name.toLowerCase().includes(query) ||
          t.tagline?.toLowerCase().includes(query) ||
          t.description?.toLowerCase().includes(query) ||
          t.tags.some((tag) => tag.toLowerCase().includes(query))
      );
    }

    if (sortBy === "score") {
      filtered.sort(
        (a, b) =>
          (b.scores[0]?.compositeScore || 0) -
          (a.scores[0]?.compositeScore || 0)
      );
    } else if (sortBy === "date") {
      filtered.sort(
        (a, b) =>
          new Date(b.launchDate).getTime() - new Date(a.launchDate).getTime()
      );
    } else if (sortBy === "likes") {
      filtered.sort((a, b) => (b.likes || 0) - (a.likes || 0));
    }

    const total = filtered.length;
    const paginated = filtered.slice(offset, offset + limit);

    return NextResponse.json({
      tools: paginated,
      total,
    });
  } catch (error) {
    console.error("Error fetching open-source tools:", error);
    return NextResponse.json(
      { error: "Failed to fetch open-source tools" },
      { status: 500 }
    );
  }
}

