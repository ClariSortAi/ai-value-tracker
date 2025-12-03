"use client";

import { cn } from "@/lib/utils";

const ROLES = [
  { id: "all", label: "All" },
  { id: "llm", label: "LLMs" },  // Foundation models & infrastructure
  { id: "marketing", label: "Marketing" },
  { id: "sales", label: "Sales" },
  { id: "product", label: "Product" },
  { id: "engineering", label: "Engineering" },
  { id: "design", label: "Design" },
  { id: "operations", label: "Ops" },
  { id: "hr", label: "HR" },
];

interface RoleTabsProps {
  activeRole: string;
  onRoleChange: (role: string) => void;
}

export function RoleTabs({ activeRole, onRoleChange }: RoleTabsProps) {
  return (
    <div className="sticky top-14 z-40 bg-[var(--background)] border-b border-[var(--card-border)]">
      <div className="container-wide">
        <nav className="flex items-center gap-8 overflow-x-auto scrollbar-hide py-1">
          {ROLES.map((role) => {
            const isActive = activeRole === role.id;
            return (
              <button
                key={role.id}
                onClick={() => onRoleChange(role.id)}
                className={cn(
                  "relative py-4 text-sm font-medium whitespace-nowrap transition-colors",
                  "focus:outline-none focus-visible:text-[var(--foreground)]",
                  isActive
                    ? "text-[var(--foreground)]"
                    : "text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
                )}
              >
                {role.label}
                {/* Active indicator line */}
                {isActive && (
                  <span 
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--foreground)] rounded-full"
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
