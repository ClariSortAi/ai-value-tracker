"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Plus, X } from "lucide-react";
import { CATEGORIES } from "@/lib/utils";

interface Score {
  compositeScore: number;
  functionalCoverage: number;
  usability: number;
  innovation: number;
  pricing: number;
  integration: number;
  security: number;
}

interface Product {
  id: string;
  name: string;
  slug: string;
  tagline: string | null;
  logo: string | null;
  category: string | null;
  scores: Score[];
}

export default function ComparePage() {
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [selected, setSelected] = useState<Product[]>([]);
  const [showPicker, setShowPicker] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch("/api/products?limit=50")
      .then((res) => res.json())
      .then((data) => setAllProducts(data.products || []));
  }, []);

  const addProduct = (product: Product) => {
    if (selected.length < 4 && !selected.find((p) => p.id === product.id)) {
      setSelected([...selected, product]);
    }
    setShowPicker(false);
    setSearch("");
  };

  const removeProduct = (id: string) => {
    setSelected(selected.filter((p) => p.id !== id));
  };

  const filteredProducts = allProducts.filter(
    (p) =>
      !selected.find((s) => s.id === p.id) &&
      (search === "" || p.name.toLowerCase().includes(search.toLowerCase()))
  );

  const getHighestScore = (key: keyof Score) => {
    const scores = selected
      .map((p) => p.scores?.[0]?.[key] ?? 0)
      .filter((s) => s > 0);
    return Math.max(...scores, 0);
  };

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <div className="container-wide py-16">
        {/* Header */}
        <header className="text-center mb-12">
          <h1 className="text-[var(--foreground)] mb-4">Compare Tools</h1>
          <p className="text-[var(--foreground-muted)]">
            Select up to 4 tools to compare side-by-side
          </p>
        </header>

        {/* Product Selector */}
        <div className="flex flex-wrap items-center justify-center gap-4 mb-12">
          {selected.map((product) => (
            <div
              key={product.id}
              className="relative flex items-center gap-3 px-4 py-3 card"
            >
              <div className="w-8 h-8 rounded-lg bg-[var(--background-secondary)] overflow-hidden">
                {product.logo ? (
                  <Image
                    src={product.logo}
                    alt={product.name}
                    width={32}
                    height={32}
                    className="w-full h-full object-cover"
                    unoptimized
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-sm font-medium text-[var(--foreground-muted)]">
                    {product.name.charAt(0)}
                  </div>
                )}
              </div>
              <span className="text-sm font-medium text-[var(--foreground)]">
                {product.name}
              </span>
              <button
                onClick={() => removeProduct(product.id)}
                className="ml-2 p-1 rounded hover:bg-[var(--background-secondary)] text-[var(--foreground-subtle)] hover:text-[var(--foreground)]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}

          {selected.length < 4 && (
            <button
              onClick={() => setShowPicker(true)}
              className="flex items-center gap-2 px-4 py-3 border-2 border-dashed border-[var(--card-border)] rounded-xl text-[var(--foreground-muted)] hover:border-[var(--foreground-subtle)] hover:text-[var(--foreground)] transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span className="text-sm">Add Tool</span>
            </button>
          )}
        </div>

        {/* Product Picker Modal */}
        {showPicker && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
            <div className="w-full max-w-md m-4 p-6 bg-[var(--card-bg)] rounded-2xl border border-[var(--card-border)] shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-[var(--foreground)]">
                  Select Tool
                </h3>
                <button
                  onClick={() => {
                    setShowPicker(false);
                    setSearch("");
                  }}
                  className="p-1 rounded hover:bg-[var(--background-secondary)] text-[var(--foreground-muted)]"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <input
                type="text"
                placeholder="Search tools..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full mb-4"
                autoFocus
              />
              <div className="max-h-80 overflow-y-auto space-y-1">
                {filteredProducts.map((product) => (
                  <button
                    key={product.id}
                    onClick={() => addProduct(product)}
                    className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-[var(--background-secondary)] text-left transition-colors"
                  >
                    <div className="w-8 h-8 rounded-lg bg-[var(--background-secondary)] overflow-hidden flex-shrink-0">
                      {product.logo ? (
                        <Image
                          src={product.logo}
                          alt={product.name}
                          width={32}
                          height={32}
                          className="w-full h-full object-cover"
                          unoptimized
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-sm font-medium text-[var(--foreground-muted)]">
                          {product.name.charAt(0)}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-[var(--foreground)] truncate">
                        {product.name}
                      </div>
                      {product.category && (
                        <div className="text-xs text-[var(--foreground-subtle)]">
                          {product.category}
                        </div>
                      )}
                    </div>
                    {product.scores?.[0] && (
                      <span className="text-sm font-medium text-[var(--foreground-muted)]">
                        {product.scores[0].compositeScore}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Comparison Table */}
        {selected.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  <th className="text-left py-4 pr-4 text-sm font-medium text-[var(--foreground-muted)]">
                    Category
                  </th>
                  {selected.map((product) => (
                    <th
                      key={product.id}
                      className="text-center py-4 px-4 text-sm font-medium text-[var(--foreground)]"
                    >
                      {product.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {/* Overall Score */}
                <tr className="border-t border-[var(--card-border)]">
                  <td className="py-4 pr-4 text-sm font-medium text-[var(--foreground)]">
                    Overall Score
                  </td>
                  {selected.map((product) => (
                    <td key={product.id} className="py-4 px-4 text-center">
                      {product.scores?.[0] ? (
                        <span className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-[var(--score-bg)] text-lg font-semibold text-[var(--score-text)]">
                          {product.scores[0].compositeScore}
                        </span>
                      ) : (
                        <span className="text-[var(--foreground-subtle)]">—</span>
                      )}
                    </td>
                  ))}
                </tr>

                {/* Category Scores */}
                {(
                  Object.keys(CATEGORIES) as Array<keyof typeof CATEGORIES>
                ).map((key) => {
                  const highest = getHighestScore(key as keyof Score);
                  return (
                    <tr
                      key={key}
                      className="border-t border-[var(--card-border)]"
                    >
                      <td className="py-4 pr-4">
                        <div className="text-sm text-[var(--foreground)]">
                          {CATEGORIES[key].label}
                        </div>
                        <div className="text-xs text-[var(--foreground-subtle)]">
                          {CATEGORIES[key].weight}% weight
                        </div>
                      </td>
                      {selected.map((product) => {
                        const score = product.scores?.[0]?.[
                          key as keyof Score
                        ] as number | undefined;
                        const isHighest = score === highest && highest > 0;
                        return (
                          <td key={product.id} className="py-4 px-4 text-center">
                            {score !== undefined ? (
                              <span
                                className={`text-base ${
                                  isHighest
                                    ? "font-semibold text-[var(--foreground)]"
                                    : "text-[var(--foreground-muted)]"
                                }`}
                              >
                                {score}/10
                              </span>
                            ) : (
                              <span className="text-[var(--foreground-subtle)]">
                                —
                              </span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}

                {/* Category */}
                <tr className="border-t border-[var(--card-border)]">
                  <td className="py-4 pr-4 text-sm text-[var(--foreground-muted)]">
                    Category
                  </td>
                  {selected.map((product) => (
                    <td
                      key={product.id}
                      className="py-4 px-4 text-center text-sm text-[var(--foreground-muted)]"
                    >
                      {product.category || "—"}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {/* Empty State */}
        {selected.length === 0 && (
          <div className="text-center py-16">
            <p className="text-[var(--foreground-muted)]">
              Add tools to start comparing
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
