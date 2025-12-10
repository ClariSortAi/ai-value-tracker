import { ReactNode } from "react";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface SectionHeaderProps {
  label?: string;
  labelIcon?: LucideIcon;
  title: string;
  description?: string;
  variant?: "default" | "accent" | "muted";
  className?: string;
  action?: ReactNode;
}

export function SectionHeader({
  label,
  labelIcon: LabelIcon,
  title,
  description,
  variant = "default",
  className,
  action,
}: SectionHeaderProps) {
  const labelVariants = {
    default: "text-[var(--brand-primary-dark)] bg-[var(--accent-light)]",
    accent: "text-[var(--brand-accent-dark)] bg-[var(--brand-accent)]/10",
    muted: "text-[var(--foreground-muted)] bg-[var(--background-secondary)]",
  };

  return (
    <div className={cn("section-header", className)}>
      <div className="flex items-start justify-between gap-4">
        <div>
          {label && (
            <div
              className={cn(
                "section-header__label",
                labelVariants[variant]
              )}
            >
              {LabelIcon && <LabelIcon className="w-3 h-3" />}
              {label}
            </div>
          )}
          <h2 className="section-header__title">{title}</h2>
          {description && (
            <p className="section-header__description">{description}</p>
          )}
        </div>
        {action && <div className="flex-shrink-0">{action}</div>}
      </div>
    </div>
  );
}
