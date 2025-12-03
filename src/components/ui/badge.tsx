"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors",
  {
    variants: {
      variant: {
        default:
          "bg-[var(--accent)]/20 text-[var(--accent)] border border-[var(--accent)]/30",
        secondary:
          "bg-[var(--card)] text-[var(--foreground-muted)] border border-[var(--card-border)]",
        success:
          "bg-[var(--success)]/20 text-[var(--success)] border border-[var(--success)]/30",
        warning:
          "bg-[var(--warning)]/20 text-[var(--warning)] border border-[var(--warning)]/30",
        error:
          "bg-[var(--error)]/20 text-[var(--error)] border border-[var(--error)]/30",
        outline:
          "border border-[var(--card-border)] text-[var(--foreground)]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };

