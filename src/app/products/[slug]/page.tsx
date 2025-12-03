"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, ExternalLink } from "lucide-react";

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
  launchDate: string;
  scores: Score[];
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
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-lg text-[var(--foreground-muted)]">Product not found</p>
        <Link href="/" className="text-[var(--accent)] hover:underline flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" />
          Back to Discover
        </Link>
      </div>
    );
  }

  const score = product.scores?.[0];
  const showFallback = !product.logo || imageError;

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <div className="container-wide py-10">
        {/* Back link */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-colors mb-10"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Discover
        </Link>

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

                {/* Score badge */}
                {score && (
                  <div className="flex-shrink-0">
                    <div className={`w-20 h-20 rounded-2xl flex flex-col items-center justify-center ${getCompositeScoreClass(score.compositeScore)}`}
                      style={{ background: `var(--${getCompositeScoreClass(score.compositeScore).replace('score-', 'score-')}-bg)` }}
                    >
                      <span className="text-3xl font-bold" style={{ color: `var(--${getCompositeScoreClass(score.compositeScore).replace('score-', 'score-')})` }}>
                        {score.compositeScore}
                      </span>
                    </div>
                    <p className="text-xs text-[var(--foreground-subtle)] mt-2 text-center">
                      AI Score
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <div className="grid lg:grid-cols-3 gap-10">
          {/* Left: Description + CTA */}
          <div className="lg:col-span-2 space-y-8">
            {/* Description */}
            {product.description && (
              <section>
                <h2 className="text-xl font-semibold text-[var(--foreground)] mb-4">
                  About
                </h2>
                <p className="text-[var(--foreground-muted)] leading-relaxed text-lg">
                  {product.description}
                </p>
              </section>
            )}

            {/* CTA */}
            {product.website && (
              <a
                href={product.website}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-primary inline-flex"
              >
                Visit Website
                <ExternalLink className="w-4 h-4" />
              </a>
            )}
          </div>

          {/* Right: Score Breakdown */}
          {score && (
            <div className="lg:col-span-1">
              <div className="card p-6 sticky top-24">
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
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
