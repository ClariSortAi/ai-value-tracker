"use client";

import { cn, getScoreColor } from "@/lib/utils";

interface ScoreBadgeProps {
  score: number;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function ScoreBadge({ score, size = "md", className }: ScoreBadgeProps) {
  const colorClass = getScoreColor(score);

  const sizeClasses = {
    sm: "w-8 h-8 text-sm",
    md: "w-12 h-12 text-xl",
    lg: "w-16 h-16 text-2xl",
  };

  return (
    <div
      className={cn(
        "rounded-full flex items-center justify-center font-semibold font-mono border-2",
        colorClass === "score-high" && "border-[var(--score-high)]/30 bg-[var(--score-high)]/10",
        colorClass === "score-mid" && "border-[var(--score-mid)]/30 bg-[var(--score-mid)]/10",
        colorClass === "score-low" && "border-[var(--score-low)]/30 bg-[var(--score-low)]/10",
        sizeClasses[size],
        colorClass,
        className
      )}
    >
      {score}
    </div>
  );
}

export function ScoreInline({
  score,
  className,
}: {
  score: number;
  className?: string;
}) {
  const colorClass = getScoreColor(score);

  return (
    <span className={cn("font-mono font-semibold", colorClass, className)}>
      {score}
    </span>
  );
}
