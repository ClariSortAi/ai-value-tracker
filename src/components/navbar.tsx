"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const navLinks = [
  { href: "/", label: "Discover" },
  { href: "/compare", label: "Compare" },
  { href: "/about", label: "About" },
];

export function Navbar() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 bg-[var(--background)] border-b border-[var(--card-border)]">
      <nav className="container-wide">
        <div className="flex items-center justify-between h-14">
          {/* Logo */}
          <Link href="/" className="text-[var(--foreground)] font-semibold text-lg tracking-tight">
            AIValue
          </Link>

          {/* Navigation */}
          <div className="flex items-center gap-8">
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
                    "text-sm font-medium transition-colors",
                    isActive
                      ? "text-[var(--foreground)]"
                      : "text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
                  )}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>
        </div>
      </nav>
    </header>
  );
}
