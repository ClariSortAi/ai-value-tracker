"use client";

import { cn, getScoreColor, getScoreLabel } from "@/lib/utils";

interface ScoreBadgeProps {
  score: number;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  className?: string;
}

export function ScoreBadge({ score, size = "md", showLabel = false, className }: ScoreBadgeProps) {
  const colorClass = getScoreColor(score);
  const label = getScoreLabel(score);

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
      role="img"
      aria-label={`Score: ${score} out of 100 - ${label}`}
      title={`${score} - ${label}`}
    >
      {score}
      {showLabel && (
        <span className="sr-only">{label}</span>
      )}
    </div>
  );
}

// Compact score badge for cards - rectangular with accessibility
interface ScoreBadgeCompactProps {
  score: number;
  className?: string;
}

export function ScoreBadgeCompact({ score, className }: ScoreBadgeCompactProps) {
  const label = getScoreLabel(score);

  const getScoreClass = (s: number): string => {
    if (s >= 70) return "score-high";
    if (s >= 50) return "score-mid";
    return "score-low";
  };

  return (
    <div
      className={cn("score-badge", getScoreClass(score), className)}
      role="img"
      aria-label={`Score: ${score} - ${label}`}
      title={`${score} - ${label}`}
    >
      {score}
    </div>
  );
}

export function ScoreInline({
  score,
  showLabel = false,
  className,
}: {
  score: number;
  showLabel?: boolean;
  className?: string;
}) {
  const colorClass = getScoreColor(score);
  const label = getScoreLabel(score);

  return (
    <span
      className={cn("font-mono font-semibold", colorClass, className)}
      aria-label={`Score: ${score} - ${label}`}
    >
      {score}
      {showLabel && (
        <span className="ml-1 text-xs font-normal text-[var(--foreground-muted)]">
          ({label})
        </span>
      )}
    </span>
  );
}
