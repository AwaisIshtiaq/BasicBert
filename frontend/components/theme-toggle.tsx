"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";

export function ThemeToggle({ className }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const isDark = resolvedTheme === "dark";

  return (
    <button
      type="button"
      aria-label={
        mounted
          ? `Switch to ${isDark ? "light" : "dark"} mode`
          : "Toggle color mode"
      }
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className={cn(
        "group relative inline-flex h-9 w-9 cursor-pointer items-center justify-center overflow-hidden rounded-lg border border-border bg-surface text-muted-foreground transition-all duration-200 hover:border-foreground/20 hover:text-foreground active:scale-95",
        className,
      )}
    >
      <Sun
        className={cn(
          "h-[18px] w-[18px] transition-all duration-300",
          mounted && isDark
            ? "rotate-0 scale-100 opacity-100"
            : "rotate-90 scale-50 opacity-0",
        )}
      />
      <Moon
        className={cn(
          "absolute h-[18px] w-[18px] transition-all duration-300",
          mounted && !isDark
            ? "rotate-0 scale-100 opacity-100"
            : "-rotate-90 scale-50 opacity-0",
        )}
      />
    </button>
  );
}
