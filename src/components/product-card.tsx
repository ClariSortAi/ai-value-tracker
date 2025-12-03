"use client";

import Link from "next/link";
import Image from "next/image";
import { cn, formatNumber, getScoreColor } from "@/lib/utils";

interface ProductCardProps {
  product: {
    id: string;
    name: string;
    slug: string;
    tagline?: string | null;
    logo?: string | null;
    category?: string | null;
    source: string;
    upvotes: number;
    stars: number;
    scores?: {
      compositeScore: number;
    }[];
  };
  className?: string;
}

export function ProductCard({ product, className }: ProductCardProps) {
  const score = product.scores?.[0]?.compositeScore ?? null;

  return (
    <Link href={`/products/${product.slug}`}>
      <div
        className={cn(
          "group p-4 rounded-2xl bg-[var(--card)] border border-[var(--card-border)] hover:bg-[var(--card-hover)] hover:border-[var(--card-border-hover)] transition-all cursor-pointer",
          className
        )}
      >
        <div className="flex items-start gap-3">
          {/* Logo */}
          <div className="relative w-10 h-10 rounded-xl bg-[var(--background-secondary)] overflow-hidden flex-shrink-0">
            {product.logo ? (
              <Image
                src={product.logo}
                alt={product.name}
                fill
                className="object-cover"
                unoptimized
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-lg font-medium text-[var(--foreground-muted)]">
                {product.name.charAt(0)}
              </div>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h3 className="font-medium text-[var(--foreground)] truncate group-hover:text-[var(--accent)] transition-colors">
                  {product.name}
                </h3>
                {product.tagline && (
                  <p className="text-sm text-[var(--foreground-muted)] line-clamp-1 mt-0.5">
                    {product.tagline}
                  </p>
                )}
              </div>

              {/* Score */}
              {score !== null && (
                <div className={cn(
                  "flex-shrink-0 text-lg font-semibold font-mono",
                  getScoreColor(score)
                )}>
                  {score}
                </div>
              )}
            </div>

            {/* Meta */}
            <div className="flex items-center gap-3 mt-2 text-xs text-[var(--foreground-subtle)]">
              {product.category && (
                <span>{product.category}</span>
              )}
              {(product.upvotes > 0 || product.stars > 0) && (
                <span>
                  {product.stars > 0 
                    ? `${formatNumber(product.stars)} ★` 
                    : `${formatNumber(product.upvotes)} ↑`}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

export function ProductCardSkeleton() {
  return (
    <div className="p-4 rounded-2xl bg-[var(--card)] border border-[var(--card-border)]">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl skeleton" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-24 skeleton" />
          <div className="h-3 w-full skeleton" />
          <div className="h-3 w-16 skeleton" />
        </div>
      </div>
    </div>
  );
}
