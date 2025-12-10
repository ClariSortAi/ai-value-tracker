"use client";

import { useEffect, useState, useCallback } from "react";
import { Search, Sparkles, TrendingUp, RefreshCw, Database } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { DiscoverySearch } from "@/components/discovery-search";
import { RoleTabs } from "@/components/role-tabs";
import { ToolCard, ToolCardSkeleton } from "@/components/tool-card";
import { OpenSourceCard } from "@/components/open-source-card";
import { AdminControls } from "@/components/admin-controls";
import { FadeIn } from "@/components/ui/fade-in";
import { FeaturedCard } from "@/components/featured-card";

interface Product {
  id: string;
  name: string;
  slug: string;
  tagline: string | null;
  description?: string | null;
  logo: string | null;
  category: string | null;
  tags: string[];
  targetRoles: string[];
  launchDate: string;
  source?: string | null;
  upvotes?: number;
  stars?: number;
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
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [loadingFeatured, setLoadingFeatured] = useState(true);
  const [openSourceTools, setOpenSourceTools] = useState<OpenSourceTool[]>([]);
  const [loadingOpenSource, setLoadingOpenSource] = useState(true);
  const [search, setSearch] = useState("");
  const [activeRole, setActiveRole] = useState("all");
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);
  const [totalProducts, setTotalProducts] = useState(0);

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
      setTotalProducts(data.total || data.products?.length || 0);
    } catch (error) {
      console.error("Failed to fetch products:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchOpenSource = useCallback(async () => {
    setLoadingOpenSource(true);
    try {
      const res = await fetch(`/api/open-source?sortBy=score&limit=6`);
      const data = await res.json();
      setOpenSourceTools(data.tools || []);
    } catch (error) {
      console.error("Failed to fetch open-source tools:", error);
    } finally {
      setLoadingOpenSource(false);
    }
  }, []);

  const fetchFeatured = useCallback(async () => {
    setLoadingFeatured(true);
    try {
      const res = await fetch(`/api/products?sortBy=score&limit=3`);
      const data = await res.json();
      setFeaturedProducts(data.products || []);
    } catch (error) {
      console.error("Failed to fetch featured products:", error);
    } finally {
      setLoadingFeatured(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchProducts("", "all");
    fetchOpenSource();
    fetchFeatured();
  }, [fetchProducts, fetchOpenSource, fetchFeatured]);

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

  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* Hero Section with Gradient */}
      <section className="hero-gradient text-white relative overflow-hidden">
        <div className="container-wide py-16 md:py-24 relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            {/* Mission badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 mb-6">
              <Sparkles className="w-4 h-4" />
              <span className="text-sm font-medium">Discover the next wave of AI</span>
            </div>
            
            <h1 className="text-white mb-4">
              Rising Stars in AI Tools
            </h1>
            
            {/* AI Discovery Search */}
            <div className="mb-12">
              <DiscoverySearch />
            </div>
            
            {/* Trust indicators */}
            <div className="flex flex-wrap items-center justify-center gap-4 mt-8">
              <div className="trust-badge">
                <Database className="w-4 h-4" />
                <span>{totalProducts > 0 ? `${totalProducts}+` : "100+"} tools tracked</span>
              </div>
              <div className="trust-badge">
                <Sparkles className="w-4 h-4" />
                <span>AI-scored quality</span>
              </div>
              <div className="trust-badge">
                <RefreshCw className="w-4 h-4" />
                <span>Updated weekly</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Admin Controls - Collapsible */}
      <section className="py-4 border-b border-[var(--card-border)]">
        <div className="container-wide">
          <AdminControls />
        </div>
      </section>

      {/* Rising Stars Featured Section */}
      {!loadingFeatured && featuredProducts.length > 0 && (
        <section className="section border-b border-[var(--card-border)]">
          <div className="container-wide">
            <FadeIn>
              <div className="flex items-center justify-between gap-4 mb-6">
                <div>
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--brand-accent)]/10 text-[var(--brand-accent-dark)] text-xs font-medium mb-2">
                    <TrendingUp className="w-3 h-3" />
                    Top Rated
                  </div>
                  <h2 className="text-xl font-semibold text-[var(--foreground)]">
                    Rising Stars
                  </h2>
                  <p className="text-sm text-[var(--foreground-muted)] mt-1">
                    The highest-scored AI tools making waves right now.
                  </p>
                </div>
              </div>
            </FadeIn>

            <motion.div
              initial="hidden"
              animate="visible"
              variants={{
                hidden: {},
                visible: {
                  transition: {
                    staggerChildren: 0.1,
                  },
                },
              }}
              className="grid grid-cols-1 md:grid-cols-3 gap-5"
            >
              {featuredProducts.map((product, idx) => (
                <motion.div
                  key={product.id}
                  variants={{
                    hidden: { opacity: 0, y: 20 },
                    visible: { opacity: 1, y: 0 },
                  }}
                  transition={{
                    duration: 0.4,
                    ease: [0.21, 0.47, 0.32, 0.98],
                  }}
                >
                  <FeaturedCard product={product} rank={idx + 1} />
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>
      )}

      {/* Role Tabs */}
      <RoleTabs activeRole={activeRole} onRoleChange={handleRoleChange} />

      {/* Tools Grid */}
      <section className="section">
        <div className="container-wide">
          {/* Section header */}
          <FadeIn delay={0.1}>
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
              <div>
                <h2 className="text-xl font-semibold text-[var(--foreground)]">
                  {activeRole === "all" ? "All Tools" : `Tools for ${activeRole}`}
                </h2>
                {!loading && (
                  <p className="text-sm text-[var(--foreground-subtle)] mt-1">
                    {products.length} {products.length === 1 ? "tool" : "tools"}
                    {search && ` matching "${search}"`}
                  </p>
                )}
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center w-full md:w-auto">
                {/* Search Input */}
                <div className="relative w-full sm:w-64">
                  <input
                    type="text"
                    placeholder="Filter by name..."
                    value={search}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 text-sm bg-[var(--card-bg)] border border-[var(--card-border)] rounded-lg focus:border-[var(--brand-primary)] focus:ring-2 focus:ring-[var(--brand-primary-light)]/20 transition-all outline-none"
                  />
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--foreground-subtle)] pointer-events-none" />
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <TrendingUp className="w-4 h-4 text-[var(--foreground-subtle)]" />
                  <span className="text-sm text-[var(--foreground-subtle)]">Sorted by newest</span>
                </div>
              </div>
            </div>
          </FadeIn>

          {/* Responsive Grid */}
          <AnimatePresence mode="wait">
            {loading ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"
              >
                {Array.from({ length: 9 }).map((_, i) => (
                  <ToolCardSkeleton key={i} />
                ))}
              </motion.div>
            ) : products.length === 0 ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="text-center py-20 card"
              >
                <Search className="w-12 h-12 text-[var(--foreground-subtle)] mx-auto mb-4" />
                <p className="text-[var(--foreground-muted)] text-lg mb-2">
                  No tools found
                </p>
                <p className="text-[var(--foreground-subtle)]">
                  Try adjusting your search or filter
                </p>
              </motion.div>
            ) : (
              <motion.div
                key="products"
                initial="hidden"
                animate="visible"
                variants={{
                  hidden: {},
                  visible: {
                    transition: {
                      staggerChildren: 0.03,
                    },
                  },
                }}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"
              >
                {products.map((product) => (
                  <motion.div
                    key={product.id}
                    variants={{
                      hidden: { opacity: 0, y: 16 },
                      visible: { opacity: 1, y: 0 },
                    }}
                    transition={{
                      duration: 0.3,
                      ease: [0.21, 0.47, 0.32, 0.98],
                    }}
                  >
                    <ToolCard product={product} />
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>

      {/* Open Source Section */}
      <section className="section bg-[var(--background-secondary)]">
        <div className="container-wide">
          <FadeIn>
            <div className="flex items-start justify-between gap-4 mb-6">
              <div>
                <p className="text-xs font-medium text-[var(--accent)] uppercase tracking-wider mb-1">
                  Hugging Face Spaces
                </p>
                <h2 className="text-xl font-semibold text-[var(--foreground)]">
                  Open Source Spotlight
                </h2>
                <p className="text-sm text-[var(--foreground-muted)] mt-1">
                  Quality open-source AI tools, ranked with the same scoring system.
                </p>
              </div>
            </div>
          </FadeIn>

          {loadingOpenSource ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {Array.from({ length: 6 }).map((_, i) => (
                <ToolCardSkeleton key={i} />
              ))}
            </div>
          ) : openSourceTools.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-10 card"
            >
              <p className="text-[var(--foreground-muted)]">
                No open-source tools available yet.
              </p>
            </motion.div>
          ) : (
            <motion.div
              initial="hidden"
              animate="visible"
              variants={{
                hidden: {},
                visible: {
                  transition: {
                    staggerChildren: 0.05,
                  },
                },
              }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"
            >
              {openSourceTools.map((tool) => (
                <motion.div
                  key={tool.id}
                  variants={{
                    hidden: { opacity: 0, y: 16 },
                    visible: { opacity: 1, y: 0 },
                  }}
                  transition={{
                    duration: 0.3,
                    ease: [0.21, 0.47, 0.32, 0.98],
                  }}
                >
                  <OpenSourceCard tool={tool} />
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>
      </section>
    </div>
  );
}
