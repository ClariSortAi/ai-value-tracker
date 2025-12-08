"use client";

import Image from "next/image";
import { ExternalLink, Star, Download } from "lucide-react";
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

function getScoreClass(score: number): string {
  if (score >= 80) return "score-high";
  if (score >= 65) return "score-mid";
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
  const tags = tool.tags?.slice(0, 3) || [];
  const href = tool.spaceUrl || tool.repoUrl || "#";
  const showFallback = !tool.logo || imageError;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="block group"
    >
      <article className="card card-interactive h-full p-6 flex flex-col gap-3.5">
        <div className="flex items-start justify-between gap-3">
          <div
            className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 flex items-center justify-center bg-[var(--background-secondary)]"
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
              <span className="text-lg font-semibold text-[var(--foreground)]">
                {tool.name.charAt(0)}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {score !== null && (
              <div className={`score-badge ${getScoreClass(score)} shadow-sm`}>
                {score}
              </div>
            )}
            <ExternalLink className="w-4 h-4 text-[var(--foreground-subtle)] group-hover:text-[var(--accent)] transition-colors" />
          </div>
        </div>

        <h3 className="text-[17px] font-semibold text-[var(--foreground)] line-clamp-1">
          {tool.name}
        </h3>

        {tool.tagline && (
          <p className="text-[15px] text-[var(--foreground-muted)] leading-relaxed line-clamp-2">
            {tool.tagline}
          </p>
        )}

        <div className="flex flex-wrap gap-2">
          {tool.license && (
            <span className="tag text-xs">{tool.license}</span>
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

        <div className="flex items-center gap-3 text-xs text-[var(--foreground-subtle)] pt-2 border-t border-[var(--card-border)] mt-auto">
          <span className="inline-flex items-center gap-1">
            <Star className="w-3.5 h-3.5" />
            {formatNumber(tool.likes || undefined)} likes
          </span>
          <span className="inline-flex items-center gap-1">
            <Download className="w-3.5 h-3.5" />
            {formatNumber(tool.downloads || undefined)} downloads
          </span>
        </div>
      </article>
    </a>
  );
}

