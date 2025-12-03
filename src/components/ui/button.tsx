"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)] disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default:
          "bg-gradient-to-r from-[var(--accent-start)] to-[var(--accent-end)] text-white hover:opacity-90 shadow-lg shadow-[var(--accent)]/20",
        secondary:
          "bg-[var(--card)] text-[var(--foreground)] border border-[var(--card-border)] hover:bg-[var(--card-hover)] hover:border-[rgba(255,255,255,0.12)]",
        outline:
          "border border-[var(--card-border)] bg-transparent text-[var(--foreground)] hover:bg-[var(--card)] hover:border-[rgba(255,255,255,0.12)]",
        ghost:
          "text-[var(--foreground-muted)] hover:text-[var(--foreground)] hover:bg-[var(--card)]",
        link: "text-[var(--accent)] underline-offset-4 hover:underline",
        destructive:
          "bg-[var(--error)] text-white hover:bg-[var(--error)]/90",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 px-3 text-xs",
        lg: "h-12 px-6 text-base",
        xl: "h-14 px-8 text-lg",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };

