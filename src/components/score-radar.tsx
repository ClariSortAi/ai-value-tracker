"use client";

import { CATEGORIES, type CategoryKey } from "@/lib/utils";
import {
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
} from "recharts";

interface ScoreRadarProps {
  scores: Record<CategoryKey, number>;
  className?: string;
}

export function ScoreRadar({ scores, className }: ScoreRadarProps) {
  const data = Object.entries(CATEGORIES).map(([key, meta]) => ({
    category: meta.label.split(" ")[0], // Short label
    fullLabel: meta.label,
    score: scores[key as CategoryKey] || 0,
    fullMark: 10,
  }));

  return (
    <div className={className}>
      <ResponsiveContainer width="100%" height={300}>
        <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
          <PolarGrid
            stroke="var(--card-border)"
            strokeDasharray="3 3"
          />
          <PolarAngleAxis
            dataKey="category"
            tick={{
              fill: "var(--foreground-muted)",
              fontSize: 11,
            }}
          />
          <Radar
            name="Score"
            dataKey="score"
            stroke="var(--accent)"
            fill="var(--accent)"
            fillOpacity={0.3}
            strokeWidth={2}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}

// Category breakdown list
interface CategoryBreakdownProps {
  scores: Record<CategoryKey, number>;
  reasoning?: Record<string, string>;
  className?: string;
}

export function CategoryBreakdown({
  scores,
  reasoning,
  className,
}: CategoryBreakdownProps) {
  return (
    <div className={className}>
      <div className="space-y-4">
        {Object.entries(CATEGORIES).map(([key, meta]) => {
          const score = scores[key as CategoryKey] || 0;
          const reason = reasoning?.[key];
          const percentage = (score / 10) * 100;

          return (
            <div key={key} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-[var(--foreground)]">
                    {meta.label}
                  </span>
                  <span className="text-xs text-[var(--foreground-muted)]">
                    ({meta.weight}%)
                  </span>
                </div>
                <span className="text-sm font-mono font-semibold text-[var(--foreground)]">
                  {score}/10
                </span>
              </div>
              <div className="h-2 rounded-full bg-[var(--card)] overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[var(--accent-start)] to-[var(--accent-end)] transition-all duration-500"
                  style={{ width: `${percentage}%` }}
                />
              </div>
              {reason && (
                <p className="text-xs text-[var(--foreground-muted)] leading-relaxed">
                  {reason}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

