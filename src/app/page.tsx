"use client";

import { useEffect, useState, useCallback } from "react";
import { Search, Play, CheckCircle2, AlertTriangle } from "lucide-react";
import { RoleTabs } from "@/components/role-tabs";
import { ToolCard, ToolCardSkeleton } from "@/components/tool-card";

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

export default function DiscoverPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeRole, setActiveRole] = useState("all");
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);
  const [runStatus, setRunStatus] = useState<{
    scrape: "idle" | "running" | "success" | "error";
    assess: "idle" | "running" | "success" | "error";
    score: "idle" | "running" | "success" | "error";
  }>({ scrape: "idle", assess: "idle", score: "idle" });
  const [runMessage, setRunMessage] = useState<string>("");

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

  // Initial load
  useEffect(() => {
    fetchProducts("", "all");
  }, [fetchProducts]);

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

  const runAction = async (action: "scrape" | "assess" | "score") => {
    setRunMessage("");
    setRunStatus((prev) => ({ ...prev, [action]: "running" }));
    try {
      const res = await fetch("/api/admin/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (!res.ok) {
        setRunStatus((prev) => ({ ...prev, [action]: "error" }));
        setRunMessage(`Failed to run ${action}: ${data?.message || data?.error || res.status}`);
      } else {
        setRunStatus((prev) => ({ ...prev, [action]: "success" }));
        setRunMessage(`${action} completed`);
      }
    } catch (error) {
      setRunStatus((prev) => ({ ...prev, [action]: "error" }));
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
              className="w-full pl-14 pr-6 py-4 text-base"
            />
          </div>

          {/* Run pipeline controls */}
          <div className="mt-10 max-w-4xl mx-auto grid gap-4">
            <div className="rounded-lg border border-[var(--card-border)] bg-[var(--card-bg)] p-5 text-left shadow-sm">
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
