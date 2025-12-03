import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-[var(--card-border)] mt-auto">
      <div className="container-wide py-12">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Brand */}
          <div className="flex flex-col items-center md:items-start gap-2">
            <span className="text-lg font-semibold text-[var(--foreground)] tracking-tight">
              AIValue
            </span>
            <p className="text-sm text-[var(--foreground-subtle)]">
              Discover AI tools that matter
            </p>
          </div>

          {/* Navigation */}
          <nav className="flex items-center gap-8">
            <Link
              href="/"
              className="text-sm text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-colors"
            >
              Discover
            </Link>
            <Link
              href="/compare"
              className="text-sm text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-colors"
            >
              Compare
            </Link>
            <Link
              href="/about"
              className="text-sm text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-colors"
            >
              About
            </Link>
          </nav>
        </div>
        
        {/* Copyright */}
        <div className="mt-10 pt-6 border-t border-[var(--card-border)] text-center">
          <p className="text-xs text-[var(--foreground-subtle)]">
            © {new Date().getFullYear()} AIValue. Built for AI tool discovery.
          </p>
        </div>
      </div>
    </footer>
  );
}
