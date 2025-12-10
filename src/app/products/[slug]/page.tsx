"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ExternalLink } from "lucide-react";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { ScoreBadgeCompact } from "@/components/score-badge";
import { getScoreLabel } from "@/lib/utils";

interface Score {
  compositeScore: number;
  functionalCoverage: number;
  usability: number;
  innovation: number;
  pricing: number;
  integration: number;
  security: number;
  reasoning: string | null;
}

interface Product {
  id: string;
  name: string;
  slug: string;
  tagline: string | null;
  description: string | null;
  website: string | null;
  logo: string | null;
  category: string | null;
  tags: string[];
  targetRoles?: string[];
  source?: string | null;
  launchDate: string;
  upvotes?: number | null;
  comments?: number | null;
  stars?: number | null;
  scores: Score[];
  // Enriched data
  extendedDescription?: string | null;
  keyFeatures?: string[];
  useCases?: string[];
  limitations?: string[];
  bestFor?: string[];
  enrichedAt?: string | null;
}

const SCORE_LABELS: Record<string, string> = {
  functionalCoverage: "Features",
  usability: "Usability",
  innovation: "Innovation",
  pricing: "Value",
  integration: "Integration",
  security: "Security",
};

// Generate consistent gradient from name
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
  
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  return gradients[Math.abs(hash) % gradients.length];
}

// Get score color class
function getScoreColor(score: number): string {
  if (score >= 8) return "var(--score-high)";
  if (score >= 6) return "var(--score-mid)";
  return "var(--score-low)";
}

function getCompositeScoreClass(score: number): string {
  if (score >= 80) return "score-high";
  if (score >= 65) return "score-mid";
  return "score-low";
}

function ScoreBar({ label, value }: { label: string; value: number }) {
  const percentage = (value / 10) * 100;
  const color = getScoreColor(value);
  
  return (
    <div className="py-3">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-[var(--foreground-muted)]">{label}</span>
        <span className="text-sm font-semibold text-[var(--foreground)]">{value}/10</span>
      </div>
      <div className="score-bar">
        <div 
          className="score-bar-fill"
          style={{ 
            width: `${percentage}%`,
            backgroundColor: color
          }}
        />
      </div>
    </div>
  );
}

export default function ProductDetailPage() {
  const params = useParams();
  const slug = params?.slug as string;
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    if (!slug) return;
    fetch(`/api/products/${slug}`)
      .then((res) => res.json())
      .then((data) => {
        setProduct(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-[var(--foreground)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-[var(--background)]">
        <div className="container-wide py-10">
          <Breadcrumb
            items={[
              { label: "Discover", href: "/" },
              { label: "Not Found" },
            ]}
            className="mb-8"
          />
          <div className="text-center py-20 card">
            <p className="text-lg text-[var(--foreground-muted)] mb-4">Product not found</p>
            <Link
              href="/"
              className="btn btn-primary inline-flex"
            >
              Browse All Tools
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const score = product.scores?.[0];
  const showFallback = !product.logo || imageError;
  const roles = product.targetRoles || [];

  // Use enriched data if available, otherwise fallback to basic parsing
  const hasEnrichedData = !!product.extendedDescription || (product.keyFeatures && product.keyFeatures.length > 0);
  
  const displayUseCases = product.useCases && product.useCases.length > 0
    ? product.useCases
    : (product.description || product.tagline || "")
        .split(".")
        .map((s) => s.trim())
        .filter(Boolean)
        .slice(0, 3);

  const signals = [
    product.upvotes ? { label: "Upvotes", value: product.upvotes } : null,
    product.stars ? { label: "Stars", value: product.stars } : null,
    product.comments ? { label: "Comments", value: product.comments } : null,
  ].filter(Boolean) as { label: string; value: number }[];

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <div className="container-wide py-10">
        {/* Breadcrumb navigation */}
        <Breadcrumb
          items={[
            { label: "Discover", href: "/" },
            { label: product.name },
          ]}
          className="mb-8"
        />

        {/* Product Header */}
        <header className="mb-12">
          <div className="flex flex-col md:flex-row md:items-start gap-6">
            {/* Logo */}
            <div 
              className="w-20 h-20 md:w-24 md:h-24 rounded-2xl overflow-hidden flex-shrink-0 flex items-center justify-center"
              style={showFallback ? { background: getAvatarGradient(product.name) } : { background: 'var(--background-secondary)' }}
            >
              {!showFallback ? (
                <Image
                  src={product.logo!}
                  alt={product.name}
                  width={96}
                  height={96}
                  className="w-full h-full object-cover"
                  unoptimized
                  onError={() => setImageError(true)}
                />
              ) : (
                <span className="text-3xl md:text-4xl font-semibold text-white">
                  {product.name.charAt(0)}
                </span>
              )}
            </div>

            {/* Info */}
            <div className="flex-1">
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                <div>
                  <h1 className="text-3xl md:text-4xl font-semibold text-[var(--foreground)] mb-2">
                    {product.name}
                  </h1>
                  {product.tagline && (
                    <p className="text-lg text-[var(--foreground-muted)] mb-4">
                      {product.tagline}
                    </p>
                  )}
                  
                  {/* Category + Tags inline */}
                  <div className="flex flex-wrap gap-2">
                    {product.category && (
                      <span className="tag tag-accent">{product.category}</span>
                    )}
                    {product.tags?.slice(0, 3).map((tag) => (
                      <span key={tag} className="tag">{tag}</span>
                    ))}
                  </div>
                </div>

                {/* Score badge with accessibility */}
                {score && (
                  <div
                    className="flex-shrink-0"
                    role="img"
                    aria-label={`AI Score: ${score.compositeScore} - ${getScoreLabel(score.compositeScore)}`}
                  >
                    <div
                      className={`w-20 h-20 rounded-2xl flex flex-col items-center justify-center ${getCompositeScoreClass(score.compositeScore)}`}
                      style={{ background: `var(--${getCompositeScoreClass(score.compositeScore).replace('score-', 'score-')}-bg)` }}
                    >
                      <span
                        className="text-3xl font-bold"
                        style={{ color: `var(--${getCompositeScoreClass(score.compositeScore).replace('score-', 'score-')})` }}
                      >
                        {score.compositeScore}
                      </span>
                    </div>
                    <p className="text-xs text-[var(--foreground-subtle)] mt-2 text-center">
                      {getScoreLabel(score.compositeScore)}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <div className="grid lg:grid-cols-3 gap-10">
          {/* Left: Description + Key Features + Use cases + Best For + CTA */}
          <div className="lg:col-span-2 space-y-8">
            {/* About - Use enriched description if available */}
            {(product.extendedDescription || product.description) && (
              <section className="card p-6">
                <h2 className="text-xl font-semibold text-[var(--foreground)] mb-4">
                  About
                </h2>
                <div className="text-[var(--foreground-muted)] leading-relaxed text-lg whitespace-pre-line">
                  {product.extendedDescription || product.description}
                </div>
              </section>
            )}

            {/* Key Features - only show if enriched */}
            {product.keyFeatures && product.keyFeatures.length > 0 && (
              <section className="card p-6">
                <h2 className="text-xl font-semibold text-[var(--foreground)] mb-4">
                  Key Features
                </h2>
                <ul className="grid sm:grid-cols-2 gap-3">
                  {product.keyFeatures.map((feature, idx) => (
                    <li key={idx} className="flex gap-3 text-[var(--foreground-muted)]">
                      <span className="mt-1 h-2 w-2 rounded-full bg-[var(--accent)] flex-shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* Use Cases / Why it matters */}
            {displayUseCases.length > 0 && (
              <section className="card p-6">
                <h2 className="text-xl font-semibold text-[var(--foreground)] mb-4">
                  {hasEnrichedData ? "Use Cases" : "Why it matters"}
                </h2>
                <ul className="space-y-3 text-[var(--foreground-muted)]">
                  {displayUseCases.map((uc, idx) => (
                    <li key={idx} className="flex gap-3">
                      <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-[var(--foreground-subtle)] flex-shrink-0" />
                      <span>{uc}</span>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* Best For - only show if enriched */}
            {product.bestFor && product.bestFor.length > 0 && (
              <section className="card p-6">
                <h2 className="text-xl font-semibold text-[var(--foreground)] mb-4">
                  Best For
                </h2>
                <div className="flex flex-wrap gap-2">
                  {product.bestFor.map((persona, idx) => (
                    <span key={idx} className="tag tag-accent">
                      {persona}
                    </span>
                  ))}
                </div>
              </section>
            )}

            {/* Limitations - only show if enriched and has content */}
            {product.limitations && product.limitations.length > 0 && (
              <section className="card p-6 border-amber-200 bg-amber-50/30">
                <h2 className="text-xl font-semibold text-[var(--foreground)] mb-4">
                  Considerations
                </h2>
                <ul className="space-y-2 text-[var(--foreground-muted)]">
                  {product.limitations.map((limitation, idx) => (
                    <li key={idx} className="flex gap-3">
                      <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-amber-500 flex-shrink-0" />
                      <span>{limitation}</span>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* CTA */}
            {product.website && (
              <div className="card p-6 flex items-center justify-between gap-4">
                <div>
                  <h3 className="text-lg font-semibold text-[var(--foreground)]">Visit {product.name}</h3>
                  <p className="text-sm text-[var(--foreground-subtle)]">Open the product website in a new tab.</p>
                </div>
                <a
                  href={product.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-primary inline-flex"
                >
                  Visit Website
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            )}
          </div>

          {/* Right column: At a Glance + Score Breakdown */}
          <div className="lg:col-span-1 space-y-6">
            <div className="card p-6 sticky top-20 space-y-5">
              <h2 className="text-lg font-semibold text-[var(--foreground)]">At a Glance</h2>
              <div className="grid grid-cols-1 gap-3 text-sm">
                {score && (
                  <div className="flex items-center justify-between">
                    <span className="text-[var(--foreground-subtle)]">AI Score</span>
                    <ScoreBadgeCompact score={score.compositeScore} />
                  </div>
                )}
                {product.source && (
                  <div className="flex items-center justify-between">
                    <span className="text-[var(--foreground-subtle)]">Source</span>
                    <span className="tag text-xs">{product.source}</span>
                  </div>
                )}
                {roles.length > 0 && (
                  <div>
                    <span className="text-[var(--foreground-subtle)]">Roles</span>
                    <div className="flex flex-wrap gap-1.5 mt-1.5">
                      {roles.slice(0, 3).map((role) => (
                        <span key={role} className="tag text-xs">{role}</span>
                      ))}
                    </div>
                  </div>
                )}
                {product.launchDate && (
                  <div className="flex items-center justify-between">
                    <span className="text-[var(--foreground-subtle)]">Launched</span>
                    <span className="text-[var(--foreground)] text-sm">
                      {new Date(product.launchDate).toLocaleDateString()}
                    </span>
                  </div>
                )}
                {product.tags?.length > 0 && (
                  <div>
                    <span className="text-[var(--foreground-subtle)]">Tags</span>
                    <div className="flex flex-wrap gap-1.5 mt-1.5">
                      {product.tags.slice(0, 5).map((tag) => (
                        <span key={tag} className="tag text-xs">{tag}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {signals.length > 0 && (
                <div className="pt-3 border-t border-[var(--card-border)]">
                  <h3 className="text-sm font-semibold text-[var(--foreground)] mb-2">Signals</h3>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    {signals.map((sig) => (
                      <div key={sig.label} className="rounded-lg bg-[var(--background-secondary)] px-3 py-2">
                        <div className="text-[var(--foreground-subtle)]">{sig.label}</div>
                        <div className="text-[var(--foreground)] font-semibold">{sig.value}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {score && (
              <div className="card p-6">
                <h2 className="text-lg font-semibold text-[var(--foreground)] mb-2">
                  Score Breakdown
                </h2>
                <p className="text-sm text-[var(--foreground-subtle)] mb-6">
                  AI-generated evaluation across 6 dimensions
                </p>
                <div className="space-y-1">
                  <ScoreBar label={SCORE_LABELS.functionalCoverage} value={score.functionalCoverage} />
                  <ScoreBar label={SCORE_LABELS.usability} value={score.usability} />
                  <ScoreBar label={SCORE_LABELS.innovation} value={score.innovation} />
                  <ScoreBar label={SCORE_LABELS.pricing} value={score.pricing} />
                  <ScoreBar label={SCORE_LABELS.integration} value={score.integration} />
                  <ScoreBar label={SCORE_LABELS.security} value={score.security} />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
