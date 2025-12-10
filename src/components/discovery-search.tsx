"use client";

import { useState, useCallback } from "react";
import { Search, Sparkles, ExternalLink, Github, Loader2, Star, ArrowUp } from "lucide-react";

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
    if (score >= 80) return { label: "Perfect Match", color: "bg-emerald-500" };
    if (score >= 60) return { label: "Good Match", color: "bg-blue-500" };
    if (score >= 40) return { label: "Relevant", color: "bg-amber-500" };
    return { label: "Partial Match", color: "bg-gray-500" };
  };

  const getSourceLabel = (source: string) => {
    switch (source) {
      case "PRODUCT_HUNT": return "Product Hunt";
      case "TAVILY_LIVE": return "🔍 Just Found";
      case "FUTURETOOLS": return "FutureTools";
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
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-violet-500/10 to-fuchsia-500/10 border border-violet-500/20 mb-4">
          <Sparkles className="w-4 h-4 text-violet-500" />
          <span className="text-sm font-medium text-violet-600 dark:text-violet-400">
            AI-Powered Tool Discovery
          </span>
        </div>
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          What do you need?
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
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
            className="w-full px-6 py-4 pl-14 text-lg rounded-2xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:border-violet-500 focus:ring-4 focus:ring-violet-500/20 transition-all"
            disabled={isSearching}
          />
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
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
            <div className="w-11 h-6 bg-gray-200 dark:bg-gray-700 rounded-full peer-checked:bg-violet-500 transition-colors"></div>
            <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-5"></div>
          </div>
          <span className="text-sm text-gray-600 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white transition-colors">
            Include open source tools
          </span>
        </label>

        <button
          onClick={handleSearch}
          disabled={isSearching || query.length < 3}
          className="px-6 py-3 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white font-medium rounded-xl hover:from-violet-700 hover:to-fuchsia-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2 shadow-lg shadow-violet-500/25"
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
        <div className="p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-center mb-6">
          {error}
        </div>
      )}

      {/* Results */}
      {results && (
        <div className="space-y-4">
          {/* Results Header */}
          <div className="flex items-center justify-between pb-4 border-b border-gray-200 dark:border-gray-700">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {results.totalResults} tool{results.totalResults !== 1 ? "s" : ""} found
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                for &quot;{results.query}&quot;
                {results.searchedLive && " • includes live web results"}
              </p>
            </div>
          </div>

          {/* Results Grid */}
          {results.results.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 dark:text-gray-400">
                No matching tools found. Try a different search term.
              </p>
            </div>
          ) : (
            <div className="grid gap-4">
              {results.results.map((result, index) => {
                const badge = getRelevanceBadge(result.relevanceScore);
                return (
                  <div
                    key={result.id}
                    className="group p-5 rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-violet-500/50 hover:shadow-lg hover:shadow-violet-500/10 transition-all"
                  >
                    <div className="flex items-start gap-4">
                      {/* Rank */}
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-sm font-bold text-gray-500 dark:text-gray-400">
                        {index + 1}
                      </div>

                      {/* Logo/Icon */}
                      <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 flex items-center justify-center text-xl font-bold text-violet-600 dark:text-violet-400">
                        {result.logo ? (
                          <img src={result.logo} alt="" className="w-full h-full rounded-xl object-cover" />
                        ) : result.isOpenSource ? (
                          <Github className="w-6 h-6" />
                        ) : (
                          result.name.charAt(0).toUpperCase()
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold text-gray-900 dark:text-white truncate">
                            {result.name}
                          </h4>
                          {result.isOpenSource && (
                            <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400">
                              Open Source
                            </span>
                          )}
                          <span className={`px-2 py-0.5 text-xs font-medium rounded-full text-white ${badge.color}`}>
                            {badge.label}
                          </span>
                        </div>
                        
                        <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-2">
                          {result.tagline || result.description || "No description available"}
                        </p>

                        <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-500">
                          <span className="flex items-center gap-1">
                            <Sparkles className="w-3 h-3 text-violet-500" />
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
                          
                          <span className="px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-700">
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
                          className="flex-shrink-0 p-3 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-violet-100 dark:hover:bg-violet-900/30 hover:text-violet-600 dark:hover:text-violet-400 transition-colors"
                        >
                          <ExternalLink className="w-5 h-5" />
                        </a>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Example Queries */}
      {!results && !isSearching && (
        <div className="mt-8">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-3 text-center">
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
                className="px-4 py-2 text-sm rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-violet-100 dark:hover:bg-violet-900/30 hover:text-violet-600 dark:hover:text-violet-400 transition-colors"
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

