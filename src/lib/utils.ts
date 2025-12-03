import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/--+/g, "-")
    .trim();
}

export function formatDate(date: Date | string): string {
  const d = new Date(date);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + "M";
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + "K";
  }
  return num.toString();
}

export function getScoreColor(score: number): string {
  if (score >= 70) return "score-high";
  if (score >= 50) return "score-mid";
  return "score-low";
}

export function getScoreLabel(score: number): string {
  if (score >= 80) return "Excellent";
  if (score >= 60) return "Good";
  if (score >= 40) return "Average";
  return "Below Average";
}

export function calculateCompositeScore(scores: {
  functionalCoverage: number;
  usability: number;
  innovation: number;
  pricing: number;
  integration: number;
  security: number;
}): number {
  const weights = {
    functionalCoverage: 0.2,
    usability: 0.2,
    innovation: 0.2,
    pricing: 0.15,
    integration: 0.15,
    security: 0.1,
  };

  const weighted =
    scores.functionalCoverage * weights.functionalCoverage +
    scores.usability * weights.usability +
    scores.innovation * weights.innovation +
    scores.pricing * weights.pricing +
    scores.integration * weights.integration +
    scores.security * weights.security;

  return Math.round(weighted * 10);
}

export function debounce<T extends (...args: string[]) => void>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

export function truncate(text: string, length: number): string {
  if (text.length <= length) return text;
  return text.slice(0, length).trim() + "...";
}

export const CATEGORIES = {
  functionalCoverage: {
    label: "Functional Coverage",
    shortLabel: "Coverage",
    description: "Breadth of use cases and features",
    weight: 20,
  },
  usability: {
    label: "Usability",
    shortLabel: "Usability",
    description: "Ease of learning and use",
    weight: 20,
  },
  innovation: {
    label: "Innovation",
    shortLabel: "Innovation",
    description: "Uniqueness and novel capabilities",
    weight: 20,
  },
  pricing: {
    label: "Pricing",
    shortLabel: "Pricing",
    description: "Value for money",
    weight: 15,
  },
  integration: {
    label: "Integration",
    shortLabel: "Integration",
    description: "API and ecosystem compatibility",
    weight: 15,
  },
  security: {
    label: "Security",
    shortLabel: "Security",
    description: "Data protection and compliance",
    weight: 10,
  },
} as const;

export type CategoryKey = keyof typeof CATEGORIES;
