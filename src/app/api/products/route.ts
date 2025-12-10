import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get("search") || "";
    const category = searchParams.get("category") || "";
    const businessCategory = searchParams.get("businessCategory") || ""; // NEW: marketing, sales, customer_service, productivity
    const role = searchParams.get("role") || "";
    const sortBy = searchParams.get("sortBy") || "date"; // Default to newest first
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");

    // Fetch all products with scores first (we'll filter by role in memory since it's JSON)
    // Using select to be defensive about schema changes
    const products = await prisma.product.findMany({
      include: {
        scores: {
          orderBy: { generatedAt: "desc" },
          take: 1,
        },
      },
      // Explicitly select fields to avoid issues with missing columns during migrations
    });

    // Transform products and filter
    let filteredProducts = products.map((product) => ({
      ...product,
      tags: JSON.parse(product.tags || "[]") as string[],
      targetRoles: JSON.parse(product.targetRoles || "[]") as string[],
    }));

    // Filter by search
    if (search) {
      const searchLower = search.toLowerCase();
      filteredProducts = filteredProducts.filter(
        (p) =>
          p.name.toLowerCase().includes(searchLower) ||
          p.tagline?.toLowerCase().includes(searchLower) ||
          p.description?.toLowerCase().includes(searchLower) ||
          p.tags.some((tag) => tag.toLowerCase().includes(searchLower))
      );
    }

    // Filter by category (legacy)
    if (category) {
      filteredProducts = filteredProducts.filter((p) => p.category === category);
    }

    // Filter by businessCategory (new prioritized filter)
    if (businessCategory && businessCategory !== "all") {
      filteredProducts = filteredProducts.filter((p) => p.businessCategory === businessCategory);
    }

    // Filter by role (if not "all")
    if (role && role !== "all") {
      filteredProducts = filteredProducts.filter((p) =>
        p.targetRoles.includes(role)
      );
    }

    // Sort
    if (sortBy === "date") {
      filteredProducts.sort(
        (a, b) => new Date(b.launchDate).getTime() - new Date(a.launchDate).getTime()
      );
    } else if (sortBy === "score") {
      filteredProducts.sort(
        (a, b) =>
          (b.scores[0]?.compositeScore || 0) - (a.scores[0]?.compositeScore || 0)
      );
    } else if (sortBy === "name") {
      filteredProducts.sort((a, b) => a.name.localeCompare(b.name));
    }

    // Get total before pagination
    const total = filteredProducts.length;

    // Apply pagination
    const paginatedProducts = filteredProducts.slice(offset, offset + limit);

    // Get unique categories for filters
    const categories = [...new Set(products.map((p) => p.category).filter(Boolean))];
    
    // Get business category counts for filter chips
    const businessCategories: Record<string, number> = {
      marketing: 0,
      sales: 0,
      customer_service: 0,
      productivity: 0,
      developer: 0,
      other: 0,
    };
    products.forEach((p) => {
      const cat = p.businessCategory || "other";
      if (cat in businessCategories) {
        businessCategories[cat]++;
      }
    });

    return NextResponse.json({
      products: paginatedProducts,
      total,
      categories,
      businessCategories,
    });
  } catch (error) {
    console.error("Error fetching products:", error);
    return NextResponse.json(
      { error: "Failed to fetch products" },
      { status: 500 }
    );
  }
}
