"use client";

import { useRef, useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import {
  Layers,
  Megaphone,
  Users,
  Lightbulb,
  Code,
  Palette,
  Settings,
  UserCircle,
  Cpu,
} from "lucide-react";

const ROLES = [
  { id: "all", label: "All", icon: Layers },
  { id: "llm", label: "LLMs", icon: Cpu },
  { id: "marketing", label: "Marketing", icon: Megaphone },
  { id: "sales", label: "Sales", icon: Users },
  { id: "product", label: "Product", icon: Lightbulb },
  { id: "engineering", label: "Engineering", icon: Code },
  { id: "design", label: "Design", icon: Palette },
  { id: "operations", label: "Ops", icon: Settings },
  { id: "hr", label: "HR", icon: UserCircle },
];

interface RoleTabsProps {
  activeRole: string;
  onRoleChange: (role: string) => void;
}

export function RoleTabs({ activeRole, onRoleChange }: RoleTabsProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showLeftFade, setShowLeftFade] = useState(false);
  const [showRightFade, setShowRightFade] = useState(false);

  // Check scroll position to show/hide fade indicators
  const checkScroll = () => {
    const el = scrollRef.current;
    if (!el) return;

    const { scrollLeft, scrollWidth, clientWidth } = el;
    setShowLeftFade(scrollLeft > 10);
    setShowRightFade(scrollLeft < scrollWidth - clientWidth - 10);
  };

  useEffect(() => {
    checkScroll();
    const el = scrollRef.current;
    if (el) {
      el.addEventListener("scroll", checkScroll);
      window.addEventListener("resize", checkScroll);
    }
    return () => {
      if (el) {
        el.removeEventListener("scroll", checkScroll);
        window.removeEventListener("resize", checkScroll);
      }
    };
  }, []);

  return (
    <div className="sticky top-16 z-40 bg-[var(--background)]/95 backdrop-blur-sm border-b border-[var(--card-border)]">
      <div className="container-wide relative">
        {/* Left fade indicator */}
        <div
          className={cn(
            "absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-[var(--background)] to-transparent pointer-events-none z-10 transition-opacity duration-200",
            showLeftFade ? "opacity-100" : "opacity-0"
          )}
          aria-hidden="true"
        />

        {/* Right fade indicator */}
        <div
          className={cn(
            "absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-[var(--background)] to-transparent pointer-events-none z-10 transition-opacity duration-200",
            showRightFade ? "opacity-100" : "opacity-0"
          )}
          aria-hidden="true"
        />

        {/* Scrollable tabs container */}
        <nav
          ref={scrollRef}
          className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide py-3 -mx-2 px-2"
          role="tablist"
          aria-label="Filter by role"
        >
          {ROLES.map((role) => {
            const isActive = activeRole === role.id;
            const Icon = role.icon;
            return (
              <button
                key={role.id}
                onClick={() => onRoleChange(role.id)}
                role="tab"
                aria-selected={isActive}
                aria-controls={`${role.id}-panel`}
                className={cn(
                  // Base styles with improved touch targets
                  "relative flex items-center gap-2 px-4 py-2.5 min-h-[44px] text-sm font-medium whitespace-nowrap rounded-lg transition-all",
                  // Focus styles
                  "focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2",
                  // State styles
                  isActive
                    ? "text-[var(--accent)] bg-[var(--accent-light)] shadow-sm"
                    : "text-[var(--foreground-muted)] hover:text-[var(--foreground)] hover:bg-[var(--background-secondary)] active:bg-[var(--background-tertiary)]"
                )}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                <span>{role.label}</span>
                {isActive && (
                  <span
                    className="absolute bottom-0 left-4 right-4 h-0.5 rounded-full bg-[var(--accent)]"
                    aria-hidden="true"
                  />
                )}
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
}

export { ROLES };
