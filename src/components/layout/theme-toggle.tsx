"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export function ThemeToggle({
  className,
  compact = false,
}: {
  className?: string;
  compact?: boolean;
}) {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return (
      <div
        className={cn(
          "h-9 w-9 rounded-md border border-border bg-surface",
          className
        )}
      />
    );
  }

  const isDark = (theme === "system" ? resolvedTheme : theme) === "dark";

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className={cn(
        "flex items-center justify-center gap-2 rounded-md border border-gold/20 bg-surface text-muted-foreground transition-colors hover:border-gold/40 hover:text-gold",
        compact ? "h-9 w-9" : "h-9 px-3 text-xs font-space-mono",
        className
      )}
      title={isDark ? "Cambiar a tema claro" : "Cambiar a tema oscuro"}
      aria-label={isDark ? "Activar tema claro" : "Activar tema oscuro"}
    >
      {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
      {!compact && <span>{isDark ? "Claro" : "Oscuro"}</span>}
    </button>
  );
}
