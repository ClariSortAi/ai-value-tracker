"use client";

import { useEffect, useState, useCallback } from "react";
import { Search, Play, CheckCircle2, AlertTriangle } from "lucide-react";
import { RoleTabs } from "@/components/role-tabs";
import { ToolCard, ToolCardSkeleton } from "@/components/tool-card";
import { OpenSourceCard } from "@/components/open-source-card";

interface Product {
  id: string;
  name: string;
  slug: string;
  tagline: string | null;
  logo: string | null;
  category: string | null;
  tags: string[];
  targetRoles: string[];
  launchDate: string;
  source?: string | null;
  scores: { compositeScore: number }[];
}

interface OpenSourceTool {
  id: string;
  name: string;
  slug: string;
  tagline: string | null;
  description: string | null;
  logo: string | null;
  runtime: string | null;
  license: string | null;
  tags: string[];
  likes?: number | null;
  downloads?: number | null;
  spaceUrl?: string | null;
  repoUrl?: string | null;
  scores: { compositeScore: number }[];
}

export default function DiscoverPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [openSourceTools, setOpenSourceTools] = useState<OpenSourceTool[]>([]);
  const [loadingOpenSource, setLoadingOpenSource] = useState(true);
  const [search, setSearch] = useState("");
  const [activeRole, setActiveRole] = useState("all");
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);
  const [runStatus, setRunStatus] = useState<{
    scrape: "idle" | "running" | "success" | "error";
    assess: "idle" | "running" | "success" | "error";
    score: "idle" | "running" | "success" | "error";
    cleanup: "idle" | "running" | "success" | "error";
  }>({ scrape: "idle", assess: "idle", score: "idle", cleanup: "idle" });
  const [runMessage, setRunMessage] = useState<string>("");
  const [cleanupResult, setCleanupResult] = useState<string>("");

  const fetchProducts = useCallback(async (searchQuery: string, role: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        sortBy: "date",
        limit: "50",
      });
      
      if (searchQuery) params.set("search", searchQuery);
      if (role && role !== "all") params.set("role", role);

      const res = await fetch(`/api/products?${params}`);
      const data = await res.json();
      setProducts(data.products || []);
    } catch (error) {
      console.error("Failed to fetch products:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchOpenSource = useCallback(async () => {
    setLoadingOpenSource(true);
    try {
      const res = await fetch(`/api/open-source?sortBy=score&limit=24`);
      const data = await res.json();
      setOpenSourceTools(data.tools || []);
    } catch (error) {
      console.error("Failed to fetch open-source tools:", error);
    } finally {
      setLoadingOpenSource(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchProducts("", "all");
    fetchOpenSource();
  }, [fetchProducts, fetchOpenSource]);

  // Handle search with debounce
  const handleSearchChange = (value: string) => {
    setSearch(value);
    
    if (searchTimeout) clearTimeout(searchTimeout);
    
    const timeout = setTimeout(() => {
      fetchProducts(value, activeRole);
    }, 300);
    
    setSearchTimeout(timeout);
  };

  // Handle role change
  const handleRoleChange = (role: string) => {
    setActiveRole(role);
    fetchProducts(search, role);
  };

  const runAction = async (
    action:
      | "scrape"
      | "assess"
      | "score"
      | "cleanup-identify"
      | "cleanup-remove"
      | "cleanup-prune"
  ) => {
    setRunMessage("");
    const key =
      action === "cleanup-identify" || action === "cleanup-remove" || action === "cleanup-prune"
        ? "cleanup"
        : action;
    setRunStatus((prev) => ({ ...prev, [key]: "running" }));
    try {
      const res = await fetch("/api/admin/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (!res.ok) {
        setRunStatus((prev) => ({ ...prev, [key]: "error" }));
        setRunMessage(`Failed to run ${action}: ${data?.message || data?.error || res.status}`);
      } else {
        setRunStatus((prev) => ({ ...prev, [key]: "success" }));
        setRunMessage(`${action} completed`);
        if (key === "cleanup") {
          const result =
            action === "cleanup-identify"
              ? `Found ${data?.data?.total ?? data?.data?.products?.length ?? "0"} low-quality products`
              : action === "cleanup-remove"
              ? `Removed ${data?.data?.removed?.lowQuality ?? 0} low-quality, pruned ${data?.data?.removed?.stale ?? 0} stale`
              : `Pruned ${data?.data?.pruned ?? 0} stale products`;
          setCleanupResult(result);
        }
      }
    } catch (error) {
      setRunStatus((prev) => ({ ...prev, [key]: "error" }));
      setRunMessage(`Failed to run ${action}: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  };

  const disableAssess = runStatus.scrape !== "success";
  const disableScore = runStatus.assess !== "success";

  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* Hero Section */}
      <section className="pt-20 pb-12 md:pt-28 md:pb-16">
        <div className="container-wide text-center">
          <h1 className="mb-4">
            Discover AI Tools
          </h1>
          <p className="text-lg md:text-xl text-[var(--foreground-muted)] max-w-xl mx-auto mb-10">
            Find the best AI products to power your work
          </p>
          
          {/* Search Bar */}
          <div className="max-w-xl mx-auto relative">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--foreground-subtle)] pointer-events-none" />
            <input
              type="text"
              placeholder="Search tools..."
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full pl-14 pr-6 py-4 text-base rounded-full"
            />
          </div>

          {/* Run pipeline controls */}
          <div className="mt-10 max-w-4xl mx-auto grid gap-5">
            <div className="rounded-xl border border-[var(--card-border)] bg-[var(--card-bg)] p-6 text-left shadow-sm">
              <p className="text-sm text-[var(--foreground-subtle)] mb-4">
                Run the pipeline in order. Assess performs smart classification (gatekeeper). Score comes last.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <button
                  onClick={() => runAction("scrape")}
                  disabled={runStatus.scrape === "running"}
                  className="flex items-center justify-center gap-2 rounded-full bg-[var(--brand-orange)] text-white px-4 py-3 font-semibold transition hover:opacity-90 disabled:opacity-60"
                >
                  <Play className="w-4 h-4" />
                  {runStatus.scrape === "running" ? "Running Scrape..." : "Run Scrape Now"}
                </button>
                <button
                  onClick={() => runAction("assess")}
                  disabled={runStatus.assess === "running" || disableAssess}
                  className="flex items-center justify-center gap-2 rounded-full border border-[var(--card-border)] bg-white px-4 py-3 font-semibold transition hover:border-[var(--brand-orange)] disabled:opacity-60"
                >
                  <Play className="w-4 h-4" />
                  {runStatus.assess === "running" ? "Assessing..." : "Run Assess Now"}
                </button>
                <button
                  onClick={() => runAction("score")}
                  disabled={runStatus.score === "running" || disableScore}
                  className="flex items-center justify-center gap-2 rounded-full border border-[var(--card-border)] bg-white px-4 py-3 font-semibold transition hover:border-[var(--brand-orange)] disabled:opacity-60"
                >
                  <Play className="w-4 h-4" />
                  {runStatus.score === "running" ? "Scoring..." : "Run Score Now"}
                </button>
              </div>
              {runMessage && (
                <p className="mt-3 text-sm text-[var(--foreground-muted)]">{runMessage}</p>
              )}
              <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                <StatusBadge label="Scrape" status={runStatus.scrape} />
                <StatusBadge label="Assess" status={runStatus.assess} />
                <StatusBadge label="Score" status={runStatus.score} />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Role Tabs */}
      <RoleTabs activeRole={activeRole} onRoleChange={handleRoleChange} />

      {/* Tools Grid */}
      <section className="py-12">
        <div className="container-wide">
          {/* Results count */}
          {!loading && (
            <p className="text-sm text-[var(--foreground-subtle)] mb-6">
              {products.length} {products.length === 1 ? "tool" : "tools"}
              {activeRole !== "all" && ` for ${activeRole}`}
              {search && ` matching "${search}"`}
            </p>
          )}

          {/* Responsive Grid */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 9 }).map((_, i) => (
                <ToolCardSkeleton key={i} />
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-[var(--foreground-muted)] text-lg mb-2">
                No tools found
              </p>
              <p className="text-[var(--foreground-subtle)]">
                Try adjusting your search or filter
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((product) => (
                <ToolCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Cleanup Controls */}
      <section className="py-8">
        <div className="container-wide">
          <div className="rounded-xl border border-[var(--card-border)] bg-[var(--card-bg)] p-6 shadow-sm">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm text-[var(--foreground-subtle)] uppercase tracking-wide">Data hygiene</p>
                <h3 className="text-xl font-semibold text-[var(--foreground)]">Cleanup low-quality products</h3>
                <p className="text-sm text-[var(--foreground-subtle)]">
                  Identify and remove games, tutorials, hobby projects, excluded domains, and stale items.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => runAction("cleanup-identify")}
                  disabled={runStatus.cleanup === "running"}
                  className="rounded-full border border-[var(--card-border)] bg-white px-4 py-2 text-sm font-semibold transition hover:border-[var(--brand-orange)] disabled:opacity-60"
                >
                  {runStatus.cleanup === "running" ? "Identifying..." : "Identify"}
                </button>
                <button
                  onClick={() => runAction("cleanup-remove")}
                  disabled={runStatus.cleanup === "running"}
                  className="rounded-full bg-[var(--brand-orange)] text-white px-4 py-2 text-sm font-semibold transition hover:opacity-90 disabled:opacity-60"
                >
                  {runStatus.cleanup === "running" ? "Cleaning..." : "Cleanup Now"}
                </button>
                <button
                  onClick={() => runAction("cleanup-prune")}
                  disabled={runStatus.cleanup === "running"}
                  className="rounded-full border border-[var(--card-border)] bg-white px-4 py-2 text-sm font-semibold transition hover:border-[var(--brand-orange)] disabled:opacity-60"
                >
                  {runStatus.cleanup === "running" ? "Pruning..." : "Prune Stale"}
                </button>
              </div>
            </div>
            {cleanupResult && (
              <p className="mt-3 text-sm text-[var(--foreground-muted)]">{cleanupResult}</p>
            )}
          </div>
        </div>
      </section>

      {/* Open Source Section */}
      <section className="py-12 bg-[var(--background-secondary)]">
        <div className="container-wide">
          <div className="flex items-center justify-between gap-4 mb-6">
            <div>
              <p className="text-sm text-[var(--foreground-subtle)] uppercase tracking-wide">
                Hugging Face Spaces
              </p>
              <h2 className="text-2xl font-semibold text-[var(--foreground)]">
                Open Source Spotlight
              </h2>
              <p className="text-[var(--foreground-muted)]">
                Ranked with the same AI scoring used across the site.
              </p>
            </div>
          </div>

          {loadingOpenSource ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <ToolCardSkeleton key={i} />
              ))}
            </div>
          ) : openSourceTools.length === 0 ? (
            <div className="text-center py-10 text-[var(--foreground-muted)]">
              No open-source tools available yet.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {openSourceTools.map((tool) => (
                <OpenSourceCard key={tool.id} tool={tool} />
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function StatusBadge({ label, status }: { label: string; status: "idle" | "running" | "success" | "error" }) {
  const color =
    status === "success"
      ? "text-green-600"
      : status === "running"
      ? "text-amber-600"
      : status === "error"
      ? "text-red-600"
      : "text-[var(--foreground-subtle)]";

  const icon =
    status === "success" ? (
      <CheckCircle2 className="w-4 h-4" />
    ) : status === "running" ? (
      <Play className="w-4 h-4" />
    ) : status === "error" ? (
      <AlertTriangle className="w-4 h-4" />
    ) : null;

  return (
    <div className={`flex items-center gap-2 ${color}`}>
      {icon}
      <span>{label}: {status}</span>
    </div>
  );
}
