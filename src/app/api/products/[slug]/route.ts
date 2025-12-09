import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    const product = await prisma.product.findUnique({
      where: { slug },
      include: {
        scores: {
          orderBy: { generatedAt: "desc" },
          take: 1,
        },
      },
    });

    if (!product) {
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404 }
      );
    }

    // Transform for API response - parse JSON fields including enriched data
    const response = {
      ...product,
      tags: JSON.parse(product.tags || "[]"),
      targetRoles: JSON.parse(product.targetRoles || "[]"),
      keyFeatures: JSON.parse(product.keyFeatures || "[]"),
      useCases: JSON.parse(product.useCases || "[]"),
      limitations: JSON.parse(product.limitations || "[]"),
      bestFor: JSON.parse(product.bestFor || "[]"),
      scores: product.scores,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error fetching product:", error);
    return NextResponse.json(
      { error: "Failed to fetch product" },
      { status: 500 }
    );
  }
}
