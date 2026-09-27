import { Github, Heart } from "lucide-react";
import { Logo } from "@/components/logo";
import { GITHUB_URL } from "@/lib/constants";

const STACK = [
  { name: "Next.js", color: "bg-foreground/70" },
  { name: "TypeScript", color: "bg-sky-500" },
  { name: "Tailwind CSS", color: "bg-cyan-500" },
  { name: "PyTorch", color: "bg-orange-500" },
  { name: "FastAPI", color: "bg-teal-500" },
  { name: "Uvicorn", color: "bg-emerald-500" },
];

const LINKS = [
  { href: "#mlm", label: "MLM Playground" },
  { href: "#classification", label: "Sentiment" },
  { href: "#features", label: "Architecture" },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-surface/40">
      <div className="container py-12 sm:py-16">
        <div className="flex flex-col items-center gap-8 md:flex-row md:items-start md:justify-between">
          <div className="max-w-sm text-center md:text-left">
            <a
              href="#main"
              className="inline-flex cursor-pointer items-center gap-2.5 transition-opacity hover:opacity-80"
            >
              <Logo />
              <span className="text-[15px] font-semibold tracking-tight">
                Basic<span className="text-accent">BERT</span>
              </span>
            </a>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              A from-scratch BERT-style Transformer encoder with MLM, sentiment
              classification and English + Urdu support.
            </p>
            <p className="mt-4 flex items-center justify-center gap-1.5 text-sm text-muted-foreground md:justify-start">
              Made with
              <Heart
                className="h-4 w-4 fill-negative text-negative"
                aria-label="love"
              />
              for learning &amp; portfolio
            </p>
          </div>

          <nav
            aria-label="Footer"
            className="flex flex-col items-center gap-2 md:items-start"
          >
            <p className="mb-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Explore
            </p>
            {LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="cursor-pointer text-sm text-muted-foreground transition-colors duration-200 hover:text-foreground"
              >
                {link.label}
              </a>
            ))}
            <a
              href={GITHUB_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-flex cursor-pointer items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2 text-sm transition-all duration-200 hover:border-foreground/20 hover:text-foreground"
            >
              <Github className="h-4 w-4" aria-hidden />
              GitHub
            </a>
          </nav>
        </div>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-2 border-t border-border pt-8 md:justify-start">
          {STACK.map((item) => (
            <span
              key={item.name}
              className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-1 text-xs font-medium text-muted-foreground"
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${item.color}`}
                aria-hidden
              />
              {item.name}
            </span>
          ))}
        </div>

        <div className="mt-6 flex flex-col items-center justify-between gap-2 text-xs text-muted-foreground sm:flex-row">
          <p>© {new Date().getFullYear()} BasicBERT. Built for learning.</p>
          <p className="font-mono">encoder-only · MLM · classification</p>
        </div>
      </div>
    </footer>
  );
}
