"use client";

import { useState, useCallback } from "react";
import { Search, Sparkles, ExternalLink, Github, Loader2, Star, ArrowUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface DiscoveryResult {
  id: string;
  name: string;
  tagline: string | null;
  description: string | null;
  website: string | null;
  category: string | null;
  businessCategory: string | null;
  source: string;
  relevanceScore: number;
  relevanceReason: string;
  isOpenSource: boolean;
  logo?: string | null;
  upvotes?: number;
  stars?: number;
}

interface DiscoveryResponse {
  query: string;
  totalResults: number;
  results: DiscoveryResult[];
  includesOpenSource: boolean;
  searchedLive: boolean;
}

export function DiscoverySearch() {
  const [query, setQuery] = useState("");
  const [includeOpenSource, setIncludeOpenSource] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<DiscoveryResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = useCallback(async () => {
    if (!query.trim() || query.length < 3) {
      setError("Please enter at least 3 characters");
      return;
    }

    setIsSearching(true);
    setError(null);
    setResults(null);

    try {
      const response = await fetch("/api/discover", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: query.trim(),
          includeOpenSource,
          searchLive: true,
        }),
      });

      if (!response.ok) {
        throw new Error("Search failed");
      }

      const data: DiscoveryResponse = await response.json();
      setResults(data);
    } catch (err) {
      setError("Failed to search. Please try again.");
      console.error("Discovery search error:", err);
    } finally {
      setIsSearching(false);
    }
  }, [query, includeOpenSource]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !isSearching) {
      handleSearch();
    }
  };

  const getRelevanceBadge = (score: number) => {
    if (score >= 80) return { label: "Perfect Match", className: "score-high" };
    if (score >= 60) return { label: "Good Match", className: "score-mid" };
    if (score >= 40) return { label: "Relevant", className: "score-low" };
    return { label: "Partial Match", className: "score-low" };
  };

  const getSourceLabel = (source: string) => {
    switch (source) {
      case "PRODUCT_HUNT": return "Product Hunt";
      case "TAVILY_LIVE": return "🔍 Just Found";
      case "DIRECTORY": return "📂 Directory";
      case "FUTURETOOLS": return "FutureTools";
      case "TOPAI_TOOLS": return "TopAI Tools";
      case "THERES_AN_AI": return "There's An AI";
      case "HUGGING_FACE": return "Hugging Face";
      case "GITHUB": return "GitHub";
      default: return source;
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Search Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[rgba(8,145,178,0.1)] border border-[rgba(8,145,178,0.2)] mb-4">
          <Sparkles className="w-4 h-4 text-[var(--brand-primary)]" />
          <span className="text-sm font-medium text-[var(--brand-primary-dark)]">
            AI-Powered Tool Discovery
          </span>
        </div>
        <h2 className="text-3xl font-bold text-white mb-2">
          What do you need?
        </h2>
        <p className="text-[rgba(255,255,255,0.8)]">
          Describe your need and we&apos;ll find the perfect AI tools for you
        </p>
      </div>

      {/* Search Input */}
      <div className="relative mb-4">
        <div className="relative">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="I want a tool that takes meeting notes with AI..."
            className="w-full px-6 py-4 pl-14 text-lg rounded-2xl border-2 border-transparent bg-white/95 text-[var(--foreground)] placeholder-[var(--foreground-subtle)] focus:border-[var(--brand-primary)] focus:ring-4 focus:ring-[var(--brand-primary-light)]/20 transition-all shadow-xl"
            disabled={isSearching}
          />
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--foreground-subtle)]" />
        </div>
      </div>

      {/* Options Row */}
      <div className="flex items-center justify-between mb-6">
        <label className="flex items-center gap-3 cursor-pointer group">
          <div className="relative">
            <input
              type="checkbox"
              checked={includeOpenSource}
              onChange={(e) => setIncludeOpenSource(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-white/20 rounded-full peer-checked:bg-[var(--brand-primary)] transition-colors border border-white/10"></div>
            <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-5 shadow-sm"></div>
          </div>
          <span className="text-sm text-white/80 group-hover:text-white transition-colors font-medium">
            Include open source tools
          </span>
        </label>

        <button
          onClick={handleSearch}
          disabled={isSearching || query.length < 3}
          className="px-6 py-3 bg-[var(--brand-primary)] text-white font-medium rounded-xl hover:bg-[var(--brand-primary-dark)] disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2 shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0"
        >
          {isSearching ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Searching...
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5" />
              Find Tools
            </>
          )}
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-4 rounded-xl bg-red-50 text-red-600 border border-red-200 text-center mb-6">
          {error}
        </div>
      )}

      {/* Results */}
      {results && (
        <div className="space-y-4">
          {/* Results Header */}
          <div className="flex items-center justify-between pb-4 border-b border-white/10">
            <div>
              <h3 className="text-lg font-semibold text-white">
                {results.totalResults} tool{results.totalResults !== 1 ? "s" : ""} found
              </h3>
              <p className="text-sm text-white/70">
                for &quot;{results.query}&quot;
                {results.searchedLive && " • includes live web results"}
              </p>
            </div>
          </div>

          {/* Results Grid */}
          {results.results.length === 0 ? (
            <div className="text-center py-12 bg-white/5 rounded-2xl border border-white/10">
              <p className="text-white/60">
                No matching tools found. Try a different search term.
              </p>
            </div>
          ) : (
            <div className="grid gap-4">
              <AnimatePresence>
                {results.results.map((result, index) => {
                  const badge = getRelevanceBadge(result.relevanceScore);
                  return (
                    <motion.div
                      key={result.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="group p-5 rounded-2xl bg-white border border-[var(--card-border)] hover:border-[var(--brand-primary)] shadow-sm hover:shadow-lg transition-all"
                    >
                      <div className="flex items-start gap-4">
                        {/* Rank */}
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[var(--background-secondary)] flex items-center justify-center text-sm font-bold text-[var(--foreground-muted)]">
                          {index + 1}
                        </div>

                        {/* Logo/Icon */}
                        <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-[var(--background-secondary)] to-[var(--background-tertiary)] flex items-center justify-center text-xl font-bold text-[var(--brand-primary-dark)] overflow-hidden">
                          {result.logo ? (
                            <img src={result.logo} alt="" className="w-full h-full object-cover" />
                          ) : result.isOpenSource ? (
                            <Github className="w-6 h-6" />
                          ) : (
                            result.name.charAt(0).toUpperCase()
                          )}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <h4 className="font-semibold text-[var(--foreground)] truncate">
                              {result.name}
                            </h4>
                            {result.isOpenSource && (
                              <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-emerald-100 text-emerald-700">
                                Open Source
                              </span>
                            )}
                            <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${badge.className}`}>
                              {badge.label}
                            </span>
                          </div>
                          
                          <p className="text-sm text-[var(--foreground-muted)] line-clamp-2 mb-2">
                            {result.tagline || result.description || "No description available"}
                          </p>

                          <div className="flex items-center gap-4 text-xs text-[var(--foreground-subtle)]">
                            <span className="flex items-center gap-1 font-medium text-[var(--brand-primary)]">
                              <Sparkles className="w-3 h-3" />
                              {result.relevanceReason}
                            </span>
                            
                            {result.upvotes && (
                              <span className="flex items-center gap-1">
                                <ArrowUp className="w-3 h-3" />
                                {result.upvotes.toLocaleString()}
                              </span>
                            )}
                            
                            {result.stars && (
                              <span className="flex items-center gap-1">
                                <Star className="w-3 h-3" />
                                {result.stars.toLocaleString()}
                              </span>
                            )}
                            
                            <span className="tag tag-source">
                              {getSourceLabel(result.source)}
                            </span>
                          </div>
                        </div>

                        {/* Action */}
                        {result.website && (
                          <a
                            href={result.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-shrink-0 p-3 rounded-xl bg-[var(--background-secondary)] text-[var(--foreground-muted)] hover:bg-[var(--brand-primary)] hover:text-white transition-colors"
                          >
                            <ExternalLink className="w-5 h-5" />
                          </a>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </div>
      )}

      {/* Example Queries */}
      {!results && !isSearching && (
        <div className="mt-8">
          <p className="text-sm text-white/60 mb-3 text-center">
            Try searching for:
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {[
              "meeting notes with AI",
              "organize my email inbox",
              "automate customer support",
              "generate marketing content",
              "sales lead generation",
            ].map((example) => (
              <button
                key={example}
                onClick={() => setQuery(`I want a tool that helps ${example}`)}
                className="px-4 py-2 text-sm rounded-full bg-white/10 text-white hover:bg-white/20 backdrop-blur-sm transition-colors border border-white/5"
              >
                {example}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}


