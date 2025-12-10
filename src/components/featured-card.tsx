"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight, TrendingUp, Award } from "lucide-react";
import { useState } from "react";
import { motion } from "framer-motion";
import { ScoreBadgeCompact } from "@/components/score-badge";

interface FeaturedCardProps {
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
  rank?: number;
}

// Generate consistent gradient colors from product name
function getAvatarGradient(name: string): string {
  const gradients = [
    "linear-gradient(135deg, #0891b2 0%, #22d3ee 100%)",
    "linear-gradient(135deg, #7c3aed 0%, #a78bfa 100%)",
    "linear-gradient(135deg, #059669 0%, #34d399 100%)",
    "linear-gradient(135deg, #2563eb 0%, #60a5fa 100%)",
    "linear-gradient(135deg, #d97706 0%, #fbbf24 100%)",
    "linear-gradient(135deg, #db2777 0%, #f472b6 100%)",
    "linear-gradient(135deg, #4f46e5 0%, #818cf8 100%)",
    "linear-gradient(135deg, #dc2626 0%, #f87171 100%)",
  ];
  
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  return gradients[Math.abs(hash) % gradients.length];
}

export function FeaturedCard({ product, rank }: FeaturedCardProps) {
  const [imageError, setImageError] = useState(false);
  const score = product.scores?.[0]?.compositeScore ?? null;
  const showFallback = !product.logo || imageError;
  
  // Get description - prefer tagline, fallback to first sentence of description
  const displayText = product.tagline || 
    (product.description ? product.description.split('.')[0] + '.' : null);

  return (
    <Link href={`/products/${product.slug}`} className="block group">
      <motion.article 
        className="relative card card-interactive h-full overflow-hidden border-2 border-transparent hover:border-[var(--accent)]"
        whileHover={{ y: -4 }}
        transition={{ duration: 0.2 }}
      >
        {/* Rank badge */}
        {rank && (
          <div className="absolute -top-px -left-px">
            <div className="flex items-center gap-1 px-3 py-1.5 bg-[var(--accent)] text-white text-xs font-bold rounded-br-lg">
              <Award className="w-3 h-3" />
              #{rank}
            </div>
          </div>
        )}

        {/* Main content */}
        <div className="p-6 pt-8">
          {/* Logo */}
          <div 
            className="w-16 h-16 rounded-xl overflow-hidden flex items-center justify-center mb-4 shadow-lg"
            style={showFallback ? { background: getAvatarGradient(product.name) } : { background: 'var(--background-secondary)' }}
          >
            {!showFallback ? (
              <Image
                src={product.logo!}
                alt={product.name}
                width={64}
                height={64}
                className="w-full h-full object-cover"
                unoptimized
                onError={() => setImageError(true)}
              />
            ) : (
              <span className="text-2xl font-bold text-white">
                {product.name.charAt(0)}
              </span>
            )}
          </div>
          
          {/* Name and score */}
          <div className="flex items-start justify-between gap-3 mb-2">
            <h3 className="text-lg font-semibold text-[var(--foreground)]">
              {product.name}
            </h3>
            {score !== null && (
              <ScoreBadgeCompact score={score} className="flex-shrink-0" />
            )}
          </div>
          
          {/* Description */}
          {displayText && (
            <p className="text-sm text-[var(--foreground-muted)] line-clamp-3 mb-4 leading-relaxed">
              {displayText}
            </p>
          )}
          
          {/* Tags */}
          <div className="flex flex-wrap items-center gap-1.5 mb-4">
            {product.category && (
              <span className="tag tag-accent text-xs">
                {product.category}
              </span>
            )}
            {product.targetRoles?.slice(0, 2).map((role) => (
              <span key={role} className="tag text-xs">
                {role}
              </span>
            ))}
          </div>
          
          {/* Footer */}
          <div className="flex items-center justify-between pt-4 border-t border-[var(--card-border)]">
            <div className="flex items-center gap-3 text-xs text-[var(--foreground-subtle)]">
              {(product.upvotes && product.upvotes > 0) && (
                <span className="flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" />
                  {product.upvotes} upvotes
                </span>
              )}
              {(product.stars && product.stars > 0) && (
                <span className="flex items-center gap-1">
                  <Star className="w-3 h-3" />
                  {product.stars}
                </span>
              )}
            </div>
            
            <span className="inline-flex items-center gap-1 text-xs font-medium text-[var(--accent)]">
              Explore
              <ArrowUpRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </span>
          </div>
        </div>
      </motion.article>
    </Link>
  );
}

