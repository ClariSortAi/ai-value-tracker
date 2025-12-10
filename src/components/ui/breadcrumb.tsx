import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";
import { cn } from "@/lib/utils";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
}

export function Breadcrumb({ items, className }: BreadcrumbProps) {
  return (
    <nav
      className={cn("breadcrumb", className)}
      aria-label="Breadcrumb navigation"
    >
      <ol className="flex items-center gap-2 text-sm">
        <li>
          <Link
            href="/"
            className="breadcrumb__item flex items-center gap-1.5 text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-colors"
            aria-label="Home"
          >
            <Home className="w-4 h-4" />
            <span className="sr-only sm:not-sr-only">Home</span>
          </Link>
        </li>
        {items.map((item, index) => (
          <li key={index} className="flex items-center gap-2">
            <ChevronRight
              className="w-4 h-4 text-[var(--foreground-subtle)]"
              aria-hidden="true"
            />
            {item.href ? (
              <Link
                href={item.href}
                className="breadcrumb__item text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-colors"
              >
                {item.label}
              </Link>
            ) : (
              <span
                className="breadcrumb__current text-[var(--foreground)] font-medium truncate max-w-[200px] sm:max-w-none"
                aria-current="page"
              >
                {item.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
