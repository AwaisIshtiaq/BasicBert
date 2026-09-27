"use client";

import { useEffect, useState } from "react";
import { Github, Menu, X } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { ApiStatus } from "@/components/api-status";
import { Logo } from "@/components/logo";
import { cn } from "@/lib/utils";
import { GITHUB_URL } from "@/lib/constants";

const NAV = [
  { href: "#mlm", label: "MLM Playground" },
  { href: "#classification", label: "Sentiment" },
  { href: "#features", label: "Architecture" },
] as const;

export function SiteHeader() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className="fixed inset-x-0 top-0 z-50 pt-3 sm:pt-4">
      <div className="container">
        <div
          className={cn(
            "flex h-14 items-center justify-between gap-3 rounded-2xl border px-3 transition-all duration-300 sm:px-4",
            scrolled
              ? "border-border bg-background/80 shadow-soft backdrop-blur-xl"
              : "border-transparent bg-transparent",
          )}
        >
          <a
            href="#main"
            className="flex cursor-pointer items-center gap-2.5 rounded-lg px-1 py-1 transition-opacity hover:opacity-80"
          >
            <Logo />
            <span className="text-[15px] font-semibold tracking-tight">
              Basic<span className="text-accent">BERT</span>
            </span>
          </a>

          <nav
            aria-label="Primary"
            className="hidden items-center gap-1 md:flex"
          >
            {NAV.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="cursor-pointer rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors duration-200 hover:bg-surface-2 hover:text-foreground"
              >
                {item.label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <ApiStatus />
            <a
              href={GITHUB_URL}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="BasicBERT on GitHub"
              className="hidden h-9 w-9 cursor-pointer items-center justify-center rounded-lg border border-border bg-surface text-muted-foreground transition-all duration-200 hover:border-foreground/20 hover:text-foreground active:scale-95 sm:inline-flex"
            >
              <Github className="h-[18px] w-[18px]" />
            </a>
            <ThemeToggle />
            <button
              type="button"
              aria-label={open ? "Close menu" : "Open menu"}
              aria-expanded={open}
              onClick={() => setOpen((v) => !v)}
              className="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg border border-border bg-surface text-muted-foreground transition-all duration-200 hover:text-foreground md:hidden"
            >
              {open ? (
                <X className="h-[18px] w-[18px]" />
              ) : (
                <Menu className="h-[18px] w-[18px]" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        <div
          className={cn(
            "mt-2 w-full overflow-hidden rounded-2xl border border-border bg-background/95 backdrop-blur-xl transition-all duration-300 md:hidden",
            open
              ? "max-h-72 opacity-100"
              : "max-h-0 border-transparent opacity-0",
          )}
        >
          <nav aria-label="Mobile" className="flex flex-col gap-1 p-2">
            {NAV.map((item) => (
              <a
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="cursor-pointer rounded-xl px-3 py-2.5 text-sm text-muted-foreground transition-colors duration-200 hover:bg-surface-2 hover:text-foreground"
              >
                {item.label}
              </a>
            ))}
            <a
              href={GITHUB_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex cursor-pointer items-center gap-2 rounded-xl px-3 py-2.5 text-sm text-muted-foreground transition-colors duration-200 hover:bg-surface-2 hover:text-foreground sm:hidden"
            >
              <Github className="h-4 w-4" /> GitHub
            </a>
          </nav>
        </div>
      </div>
    </header>
  );
}
