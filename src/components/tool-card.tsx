"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight, Star, TrendingUp, Clock } from "lucide-react";
import { useState } from "react";

interface ToolCardProps {
  product: {
    id: string;
    name: string;
    slug: string;
    tagline?: string | null;
    description?: string | null;
    logo?: string | null;
    category?: string | null;
    tags?: string[];
    targetRoles?: string[];
    source?: string | null;
    launchDate: string | Date;
    upvotes?: number;
    stars?: number;
    scores?: {
      compositeScore: number;
    }[];
  };
}

// Generate consistent gradient colors from product name
function getAvatarGradient(name: string): string {
  const gradients = [
    "linear-gradient(135deg, #0891b2 0%, #22d3ee 100%)",
    "linear-gradient(135deg, #7c3aed 0%, #a78bfa 100%)",
    "linear-gradient(135deg, #059669 0%, #34d399 100%)",
    "linear-gradient(135deg, #dc2626 0%, #f87171 100%)",
    "linear-gradient(135deg, #2563eb 0%, #60a5fa 100%)",
    "linear-gradient(135deg, #d97706 0%, #fbbf24 100%)",
    "linear-gradient(135deg, #db2777 0%, #f472b6 100%)",
    "linear-gradient(135deg, #4f46e5 0%, #818cf8 100%)",
  ];
  
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  return gradients[Math.abs(hash) % gradients.length];
}

// Get score tier class
function getScoreClass(score: number): string {
  if (score >= 70) return "score-high";
  if (score >= 50) return "score-mid";
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

function isNew(date: string | Date): boolean {
  const now = new Date();
  const then = new Date(date);
  const diffInDays = Math.floor((now.getTime() - then.getTime()) / (1000 * 60 * 60 * 24));
  return diffInDays <= 14;
}

function getSourceLabel(source: string): string {
  const labels: Record<string, string> = {
    PRODUCT_HUNT: "Product Hunt",
    GITHUB: "GitHub",
    HACKER_NEWS: "Hacker News",
    HUGGING_FACE: "Hugging Face",
    THERES_AN_AI: "There's An AI",
    MANUAL: "Curated",
  };
  return labels[source] || source;
}

export function ToolCard({ product }: ToolCardProps) {
  const [imageError, setImageError] = useState(false);
  const score = product.scores?.[0]?.compositeScore ?? null;
  const showFallback = !product.logo || imageError;
  const isNewProduct = isNew(product.launchDate);
  
  // Get description - prefer tagline, fallback to first sentence of description
  const displayText = product.tagline || 
    (product.description ? product.description.split('.')[0] + '.' : null);

  return (
    <Link href={`/products/${product.slug}`} className="block group">
      <article className="card card-interactive h-full overflow-hidden">
        {/* Main content area */}
        <div className="p-5">
          {/* Header row: Logo, Name+Tagline, Score */}
          <div className="flex items-start gap-4">
            {/* Logo */}
            <div 
              className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 flex items-center justify-center"
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
                <span className="text-lg font-bold text-white">
                  {product.name.charAt(0)}
                </span>
              )}
            </div>
            
            {/* Name and tagline */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-base font-semibold text-[var(--foreground)] truncate">
                  {product.name}
                </h3>
                {isNewProduct && (
                  <span className="tag tag-new text-[10px] px-1.5 py-0.5">New</span>
                )}
              </div>
              {displayText && (
                <p className="text-sm text-[var(--foreground-muted)] line-clamp-2 mt-1 leading-snug">
                  {displayText}
                </p>
              )}
            </div>
            
            {/* Score Badge */}
            {score !== null && (
              <div className={`score-badge ${getScoreClass(score)} flex-shrink-0`}>
                {score}
              </div>
            )}
          </div>
          
          {/* Tags row */}
          <div className="flex flex-wrap items-center gap-1.5 mt-4">
            {product.category && (
              <span className="tag tag-accent text-xs">
                {product.category}
              </span>
            )}
            {product.targetRoles?.slice(0, 1).map((role) => (
              <span key={role} className="tag text-xs">
                {role}
              </span>
            ))}
            {product.tags?.slice(0, 1).map((tag) => (
              <span key={tag} className="tag text-xs">
                {tag}
              </span>
            ))}
          </div>
        </div>
        
        {/* Footer */}
        <div className="px-5 py-3 bg-[var(--background-secondary)] border-t border-[var(--card-border)] flex items-center justify-between">
          <div className="flex items-center gap-3 text-xs text-[var(--foreground-subtle)]">
            {product.source && (
              <span className="flex items-center gap-1">
                <Star className="w-3 h-3" />
                {getSourceLabel(product.source)}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {formatRelativeDate(product.launchDate)}
            </span>
            {(product.upvotes && product.upvotes > 0) && (
              <span className="flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />
                {product.upvotes}
              </span>
            )}
          </div>
          
          <span className="inline-flex items-center gap-1 text-xs font-medium text-[var(--accent)] opacity-0 group-hover:opacity-100 transition-opacity">
            View
            <ArrowUpRight className="w-3 h-3" />
          </span>
        </div>
      </article>
    </Link>
  );
}

export function ToolCardSkeleton() {
  return (
    <div className="card h-full overflow-hidden">
      <div className="p-5">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-lg skeleton" />
          <div className="flex-1 min-w-0">
            <div className="h-5 w-3/4 rounded skeleton" />
            <div className="h-4 w-full rounded skeleton mt-2" />
            <div className="h-4 w-2/3 rounded skeleton mt-1" />
          </div>
          <div className="w-10 h-8 rounded-lg skeleton" />
        </div>
        <div className="flex gap-1.5 mt-4">
          <div className="h-6 w-16 rounded skeleton" />
          <div className="h-6 w-12 rounded skeleton" />
        </div>
      </div>
      <div className="px-5 py-3 bg-[var(--background-secondary)] border-t border-[var(--card-border)]">
        <div className="flex items-center justify-between">
          <div className="flex gap-3">
            <div className="h-3 w-16 rounded skeleton" />
            <div className="h-3 w-12 rounded skeleton" />
          </div>
          <div className="h-3 w-10 rounded skeleton" />
        </div>
      </div>
    </div>
  );
}
