"use client";

import { cn } from "@/lib/utils";

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-lg bg-[var(--card)] skeleton",
        className
      )}
      {...props}
    />
  );
}

export { Skeleton };

