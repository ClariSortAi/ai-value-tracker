"use client";

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
  return (
    <div className="sticky top-16 z-40 bg-[var(--background)]/95 backdrop-blur-sm border-b border-[var(--card-border)]">
      <div className="container-wide">
        <nav className="flex items-center gap-1 overflow-x-auto scrollbar-hide py-2 -mx-2 px-2">
          {ROLES.map((role) => {
            const isActive = activeRole === role.id;
            const Icon = role.icon;
            return (
              <button
                key={role.id}
                onClick={() => onRoleChange(role.id)}
                className={cn(
                  "relative flex items-center gap-2 px-4 py-2.5 text-sm font-medium whitespace-nowrap rounded-lg transition-all",
                  "focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]",
                  isActive
                    ? "text-[var(--accent)] bg-[var(--accent-light)]"
                    : "text-[var(--foreground-muted)] hover:text-[var(--foreground)] hover:bg-[var(--background-secondary)]"
                )}
              >
                <Icon className="w-4 h-4" />
                {role.label}
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
}

export { ROLES };
