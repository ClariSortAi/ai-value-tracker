"use client";

import { useEffect, useState, useCallback } from "react";
import { Search } from "lucide-react";
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
  scores: { compositeScore: number }[];
}

export default function DiscoverPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeRole, setActiveRole] = useState("all");
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);

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

  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* Hero Section */}
      <section className="pt-20 pb-10 md:pt-28 md:pb-14">
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
        </div>
      </section>

      {/* Role Tabs */}
      <RoleTabs activeRole={activeRole} onRoleChange={handleRoleChange} />

      {/* Tools Grid */}
      <section className="py-10">
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
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
