"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

const navLinks = [
  { href: "/", label: "Discover" },
  { href: "/compare", label: "Compare" },
  { href: "/about", label: "About" },
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
            className="flex items-center gap-2 text-[var(--foreground)] font-semibold text-lg tracking-tight group"
          >
            <div className="w-8 h-8 rounded-lg bg-[var(--accent)] flex items-center justify-center transition-transform group-hover:scale-105">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span>AIValue</span>
          </Link>

          {/* Navigation */}
          <div className="flex items-center gap-1">
            {navLinks.map((link) => {
              const isActive = 
                link.href === "/" 
                  ? pathname === "/" || pathname.startsWith("/products")
                  : pathname === link.href;
              
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "px-4 py-2 text-sm font-medium rounded-lg transition-all relative",
                    isActive
                      ? "text-[var(--foreground)] bg-[var(--background-secondary)]"
                      : "text-[var(--foreground-muted)] hover:text-[var(--foreground)] hover:bg-[var(--background-secondary)]"
                  )}
                >
                  {link.label}
                  {isActive && (
                    <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[var(--accent)]" />
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
