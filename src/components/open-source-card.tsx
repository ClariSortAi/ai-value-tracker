"use client";

import Image from "next/image";
import { ExternalLink, Star, Download, Github, ArrowUpRight } from "lucide-react";
import { useState } from "react";

interface OpenSourceCardProps {
  tool: {
    id: string;
    name: string;
    slug: string;
    tagline?: string | null;
    description?: string | null;
    logo?: string | null;
    runtime?: string | null;
    license?: string | null;
    tags?: string[];
    likes?: number | null;
    downloads?: number | null;
    spaceUrl?: string | null;
    repoUrl?: string | null;
    scores?: { compositeScore: number }[];
  };
}

// Generate consistent gradient colors from tool name
function getAvatarGradient(name: string): string {
  const gradients = [
    "linear-gradient(135deg, #7c3aed 0%, #a78bfa 100%)",
    "linear-gradient(135deg, #059669 0%, #34d399 100%)",
    "linear-gradient(135deg, #2563eb 0%, #60a5fa 100%)",
    "linear-gradient(135deg, #d97706 0%, #fbbf24 100%)",
    "linear-gradient(135deg, #db2777 0%, #f472b6 100%)",
    "linear-gradient(135deg, #4f46e5 0%, #818cf8 100%)",
    "linear-gradient(135deg, #0891b2 0%, #22d3ee 100%)",
    "linear-gradient(135deg, #dc2626 0%, #f87171 100%)",
  ];
  
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  return gradients[Math.abs(hash) % gradients.length];
}

function getScoreClass(score: number): string {
  if (score >= 70) return "score-high";
  if (score >= 50) return "score-mid";
  return "score-low";
}

function formatNumber(value?: number | null): string {
  if (!value) return "0";
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}k`;
  return value.toString();
}

export function OpenSourceCard({ tool }: OpenSourceCardProps) {
  const [imageError, setImageError] = useState(false);
  const score = tool.scores?.[0]?.compositeScore ?? null;
  const tags = tool.tags?.slice(0, 2) || [];
  const href = tool.spaceUrl || tool.repoUrl || "#";
  const showFallback = !tool.logo || imageError;
  
  // Get display text
  const displayText = tool.tagline || 
    (tool.description ? tool.description.split('.')[0] + '.' : null);

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="block group"
    >
      <article className="card card-interactive h-full overflow-hidden">
        {/* Main content */}
        <div className="p-5">
          {/* Header row */}
          <div className="flex items-start gap-4">
            {/* Logo */}
            <div
              className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 flex items-center justify-center"
              style={showFallback ? { background: getAvatarGradient(tool.name) } : { background: 'var(--background-secondary)' }}
            >
              {!showFallback ? (
                <Image
                  src={tool.logo!}
                  alt={tool.name}
                  width={48}
                  height={48}
                  className="w-full h-full object-cover"
                  unoptimized
                  onError={() => setImageError(true)}
                />
              ) : (
                <span className="text-lg font-bold text-white">
                  {tool.name.charAt(0)}
                </span>
              )}
            </div>
            
            {/* Name and tagline */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-base font-semibold text-[var(--foreground)] truncate">
                  {tool.name}
                </h3>
                <span className="tag tag-source text-[10px]">Open Source</span>
              </div>
              {displayText && (
                <p className="text-sm text-[var(--foreground-muted)] line-clamp-2 mt-1 leading-snug">
                  {displayText}
                </p>
              )}
            </div>
            
            {/* Score */}
            {score !== null && (
              <div className={`score-badge ${getScoreClass(score)} flex-shrink-0`}>
                {score}
              </div>
            )}
          </div>
          
          {/* Tags row */}
          <div className="flex flex-wrap items-center gap-1.5 mt-4">
            {tool.license && (
              <span className="tag tag-accent text-xs">{tool.license}</span>
            )}
            {tool.runtime && (
              <span className="tag text-xs">{tool.runtime}</span>
            )}
            {tags.map((tag) => (
              <span key={tag} className="tag text-xs">
                {tag}
              </span>
            ))}
          </div>
        </div>
        
        {/* Footer */}
        <div className="px-5 py-3 bg-[var(--background-secondary)] border-t border-[var(--card-border)] flex items-center justify-between">
          <div className="flex items-center gap-3 text-xs text-[var(--foreground-subtle)]">
            <span className="flex items-center gap-1">
              <Star className="w-3 h-3" />
              {formatNumber(tool.likes || undefined)}
            </span>
            <span className="flex items-center gap-1">
              <Download className="w-3 h-3" />
              {formatNumber(tool.downloads || undefined)}
            </span>
            {tool.repoUrl && (
              <span className="flex items-center gap-1">
                <Github className="w-3 h-3" />
              </span>
            )}
          </div>
          
          <span className="inline-flex items-center gap-1 text-xs font-medium text-[var(--accent)] opacity-0 group-hover:opacity-100 transition-opacity">
            Open
            <ArrowUpRight className="w-3 h-3" />
          </span>
        </div>
      </article>
    </a>
  );
}
