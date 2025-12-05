"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { useState } from "react";

interface ToolCardProps {
  product: {
    id: string;
    name: string;
    slug: string;
    tagline?: string | null;
    logo?: string | null;
    category?: string | null;
    tags?: string[];
  targetRoles?: string[];
  source?: string | null;
    launchDate: string | Date;
    scores?: {
      compositeScore: number;
    }[];
  };
}

// Generate consistent gradient colors from product name
function getAvatarGradient(name: string): string {
  const gradients = [
    "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
    "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
    "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)",
    "linear-gradient(135deg, #fa709a 0%, #fee140 100%)",
    "linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)",
    "linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)",
    "linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)",
  ];
  
  // Hash the name to get consistent index
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  return gradients[Math.abs(hash) % gradients.length];
}

// Get score tier class
function getScoreClass(score: number): string {
  if (score >= 80) return "score-high";
  if (score >= 65) return "score-mid";
  return "score-low";
}

function formatRelativeDate(date: string | Date): string {
  const now = new Date();
  const then = new Date(date);
  const diffInMs = now.getTime() - then.getTime();
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

  if (diffInDays === 0) return "Today";
  if (diffInDays === 1) return "Yesterday";
  if (diffInDays < 7) return `${diffInDays}d ago`;
  if (diffInDays < 30) {
    const weeks = Math.floor(diffInDays / 7);
    return `${weeks}w ago`;
  }
  if (diffInDays < 365) {
    const months = Math.floor(diffInDays / 30);
    return `${months}mo ago`;
  }
  const years = Math.floor(diffInDays / 365);
  return `${years}y ago`;
}

export function ToolCard({ product }: ToolCardProps) {
  const [imageError, setImageError] = useState(false);
  const score = product.scores?.[0]?.compositeScore ?? null;
  const tags = product.tags?.slice(0, 2) || [];
  const showFallback = !product.logo || imageError;

  return (
    <Link href={`/products/${product.slug}`} className="block group">
      <article className="card card-interactive h-full p-7 flex flex-col gap-3.5">
        {/* Header: Logo + Score */}
        <div className="flex items-start justify-between gap-3">
          {/* Logo/Avatar */}
          <div 
            className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 flex items-center justify-center shadow-sm"
            style={showFallback ? { background: getAvatarGradient(product.name) } : { background: 'var(--background-secondary)' }}
          >
            {!showFallback ? (
              <Image
                src={product.logo!}
                alt={product.name}
                width={48}
                height={48}
                className="w-full h-full object-cover"
                unoptimized
                onError={() => setImageError(true)}
              />
            ) : (
              <span className="text-lg font-semibold text-white">
                {product.name.charAt(0)}
              </span>
            )}
          </div>
          
          {/* Score Badge */}
          {score !== null && (
            <div className={`score-badge ${getScoreClass(score)} shadow-sm`}>
              {score}
            </div>
          )}
        </div>

        {/* Name */}
        <h3 className="text-[17px] font-semibold text-[var(--foreground)] line-clamp-1">
          {product.name}
        </h3>

        {/* Tagline */}
        {product.tagline && (
          <p className="text-[15px] text-[var(--foreground-muted)] leading-relaxed line-clamp-2 flex-grow">
            {product.tagline}
          </p>
        )}

        {/* Tags / meta */}
        <div className="flex flex-wrap gap-2">
          {product.category && (
            <span className="tag tag-accent text-xs">
              {product.category}
            </span>
          )}
          {product.targetRoles?.[0] && (
            <span className="tag text-xs">
              {product.targetRoles[0]}
            </span>
          )}
          {product.source && (
            <span className="tag text-xs">
              {product.source === "PRODUCT_HUNT" ? "Product Hunt" : product.source === "GITHUB" ? "GitHub" : product.source === "HACKER_NEWS" ? "Hacker News" : product.source}
            </span>
          )}
          {tags.map((tag) => (
            <span key={tag} className="tag text-xs">
              {tag}
            </span>
          ))}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-[var(--card-border)] mt-auto">
          <span className="text-xs text-[var(--foreground-subtle)]">
            Discovered {formatRelativeDate(product.launchDate)}
          </span>
          
          <span className="inline-flex items-center gap-1 text-sm font-medium text-[var(--accent)] opacity-0 group-hover:opacity-100 transition-opacity">
            Explore
            <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
          </span>
        </div>
      </article>
    </Link>
  );
}

export function ToolCardSkeleton() {
  return (
    <div className="card h-full p-5 flex flex-col">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="w-12 h-12 rounded-xl bg-[var(--background-secondary)] animate-pulse" />
        <div className="w-11 h-9 rounded-lg bg-[var(--background-secondary)] animate-pulse" />
      </div>
      <div className="h-5 w-3/4 bg-[var(--background-secondary)] rounded animate-pulse mb-2" />
      <div className="h-4 w-full bg-[var(--background-secondary)] rounded animate-pulse mb-1" />
      <div className="h-4 w-2/3 bg-[var(--background-secondary)] rounded animate-pulse mb-4 flex-grow" />
      <div className="flex gap-1.5 mb-4">
        <div className="h-6 w-20 bg-[var(--background-secondary)] rounded-full animate-pulse" />
        <div className="h-6 w-14 bg-[var(--background-secondary)] rounded-full animate-pulse" />
      </div>
      <div className="flex items-center justify-between pt-3 border-t border-[var(--card-border)] mt-auto">
        <div className="h-3 w-12 bg-[var(--background-secondary)] rounded animate-pulse" />
        <div className="h-3 w-14 bg-[var(--background-secondary)] rounded animate-pulse" />
      </div>
    </div>
  );
}
