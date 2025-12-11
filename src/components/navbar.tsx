"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Sparkles, BarChart3, Info, Search } from "lucide-react";
import { cn } from "@/lib/utils";

const navLinks = [
  { href: "/", label: "Discover", icon: Search },
  { href: "/compare", label: "Compare", icon: BarChart3 },
  { href: "/about", label: "About", icon: Info },
];

export function Navbar() {
  const pathname = usePathname();

  return (
    <header className="nav-sticky">
      <nav className="container-wide">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link
            href="/"
            className="flex items-center gap-2.5 text-[var(--foreground)] font-semibold text-lg tracking-tight group"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[var(--brand-primary)] to-[var(--brand-primary-dark)] flex items-center justify-center shadow-sm transition-all group-hover:shadow-md group-hover:scale-105">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="leading-tight">AIValue</span>
              <span className="text-[10px] font-normal text-[var(--foreground-subtle)] leading-none hidden sm:block">
                Discover AI Tools
              </span>
            </div>
          </Link>

          {/* Navigation */}
          <div className="flex items-center gap-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive =
                link.href === "/"
                  ? pathname === "/" || pathname.startsWith("/products")
                  : pathname === link.href || pathname.startsWith(link.href);

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all relative",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2",
                    isActive
                      ? "text-[var(--accent)] bg-[var(--accent-light)]"
                      : "text-[var(--foreground-muted)] hover:text-[var(--foreground)] hover:bg-[var(--background-secondary)]"
                  )}
                  aria-current={isActive ? "page" : undefined}
                >
                  <Icon className="w-4 h-4" />
                  <span>{link.label}</span>
                  {isActive && (
                    <span
                      className="absolute bottom-0 left-4 right-4 h-0.5 rounded-full bg-[var(--accent)]"
                      aria-hidden="true"
                    />
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      </nav>
    </header>
  );
}
