"use client";

import { motion } from "framer-motion";
import { Briefcase, Megaphone, HeadphonesIcon, Zap, Code, Layers } from "lucide-react";

interface CategoryFilterProps {
  activeCategory: string;
  onCategoryChange: (category: string) => void;
  counts?: Record<string, number>;
}

const CATEGORIES = [
  { id: "all", label: "All", icon: Layers },
  { id: "marketing", label: "Marketing", icon: Megaphone },
  { id: "sales", label: "Sales", icon: Briefcase },
  { id: "customer_service", label: "Support", icon: HeadphonesIcon },
  { id: "productivity", label: "Productivity", icon: Zap },
  { id: "developer", label: "Developer", icon: Code },
];

export function CategoryFilter({
  activeCategory,
  onCategoryChange,
  counts = {},
}: CategoryFilterProps) {
  // Calculate total for "all" category
  const totalCount = Object.values(counts).reduce((sum, count) => sum + count, 0);

  return (
    <div className="flex flex-wrap items-center gap-2">
      {CATEGORIES.map((category) => {
        const isActive = activeCategory === category.id;
        const count = category.id === "all" ? totalCount : (counts[category.id] || 0);
        const Icon = category.icon;

        return (
          <motion.button
            key={category.id}
            onClick={() => onCategoryChange(category.id)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={`
              relative flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium
              transition-all duration-200 ease-out
              ${
                isActive
                  ? "bg-[var(--brand-primary)] text-white shadow-md"
                  : "bg-[var(--background-secondary)] text-[var(--foreground-muted)] hover:bg-[var(--background-tertiary)] hover:text-[var(--foreground)]"
              }
            `}
          >
            <Icon className="w-4 h-4" />
            <span>{category.label}</span>
            {count > 0 && (
              <span
                className={`
                  text-xs px-1.5 py-0.5 rounded-full
                  ${
                    isActive
                      ? "bg-white/20 text-white"
                      : "bg-[var(--background-tertiary)] text-[var(--foreground-subtle)]"
                  }
                `}
              >
                {count}
              </span>
            )}
          </motion.button>
        );
      })}
    </div>
  );
}


