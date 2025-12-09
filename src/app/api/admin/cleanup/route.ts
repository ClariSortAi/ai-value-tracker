import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { identifyLowQualityProducts, pruneStaleProducts } from "@/lib/scrapers";
import prisma from "@/lib/db";

// Force dynamic execution - prevent caching
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// This route helps identify and optionally remove low-quality products
export async function GET(request: NextRequest) {
  const requestId = randomUUID();
  const path = "/api/admin/cleanup";

  // Official Vercel authentication method
  const authHeader = request.headers.get("authorization");
  
  // Allow in development without auth (for local testing)
  const isDevelopment = process.env.NODE_ENV !== "production";
  
  const secret = process.env.CRON_SECRET;
  const hasValidSecret =
    !!secret &&
    !!authHeader &&
    (authHeader === `Bearer ${secret}` || authHeader === secret);

  const bypass = process.env.VERCEL_AUTOMATION_BYPASS_SECRET;
  const hasBypassHeader =
    !!bypass &&
    request.headers.get("x-vercel-protection-bypass") === bypass;

  // Check if request is authorized
  const isAuthorized = isDevelopment || hasValidSecret || hasBypassHeader;
  
  if (!isAuthorized) {
    console.error("Unauthorized cleanup attempt:", { requestId, path });
    return NextResponse.json({ 
      error: "Unauthorized",
      hint: "Vercel automatically sends Authorization: Bearer CRON_SECRET header. Ensure CRON_SECRET is set."
    }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action") || "identify"; // "identify" or "remove"

    console.log(`Starting cleanup job (action: ${action})...`, { requestId, path });

    if (action === "identify") {
      // Just identify problematic products
      const result = await identifyLowQualityProducts();
      
      return NextResponse.json({
        message: "Low-quality products identified",
        timestamp: new Date().toISOString(),
        action: "identify",
        total: result.total,
        products: result.products.slice(0, 50), // Return first 50
        hint: result.total > 0 ? "Use ?action=remove to delete these products" : "No low-quality products found",
      });
    } else if (action === "remove") {
      // Identify and remove low-quality products
      const identified = await identifyLowQualityProducts();
      
      // Safety limit: Maximum products to delete in one operation
      const MAX_BATCH_DELETE = 100;
      
      // Batch delete for better performance
      let removed = 0;
      if (identified.products.length > 0) {
        // Apply safety limit
        const toDelete = identified.products.slice(0, MAX_BATCH_DELETE);
        const productIds = toDelete.map(p => p.id);
        
        if (identified.products.length > MAX_BATCH_DELETE) {
          console.log(`[Cleanup] Warning: ${identified.products.length} products identified, but limiting to ${MAX_BATCH_DELETE} per batch`);
        }
        
        try {
          const result = await prisma.product.deleteMany({
            where: { id: { in: productIds } }
          });
          removed = result.count;
          console.log(`[Cleanup] Removed ${removed} low-quality products`);
          
          // Log details of removed products
          for (const product of toDelete) {
            console.log(`  - ${product.name} (${product.reason})`);
          }
        } catch (error) {
          console.error(`[Cleanup] Error during batch delete:`, error);
        }
      }

      // Also prune stale products
      const pruned = await pruneStaleProducts();

      return NextResponse.json({
        message: "Cleanup completed",
        timestamp: new Date().toISOString(),
        action: "remove",
        removed: {
          lowQuality: removed,
          stale: pruned,
          total: removed + pruned,
        },
      });
    } else if (action === "prune") {
      // Only prune stale products
      const pruned = await pruneStaleProducts();

      return NextResponse.json({
        message: "Stale products pruned",
        timestamp: new Date().toISOString(),
        action: "prune",
        pruned,
      });
    }

    return NextResponse.json(
      { error: "Invalid action. Use ?action=identify, ?action=remove, or ?action=prune" },
      { status: 400 }
    );

  } catch (error) {
    console.error("Cleanup job error:", { requestId, path, error });
    return NextResponse.json(
      {
        error: "Cleanup job failed",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// Allow POST for manual triggers
export async function POST(request: NextRequest) {
  return GET(request);
}
