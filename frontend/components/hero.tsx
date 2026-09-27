"use client";

import { motion, useReducedMotion } from "framer-motion";
import { ArrowDown, Cpu, Languages, Sparkles } from "lucide-react";
import { Logo } from "@/components/logo";

const STATS = [
  { icon: Cpu, label: "Encoder-only", value: "Transformer from scratch" },
  { icon: Languages, label: "Languages", value: "English + Urdu" },
  { icon: Sparkles, label: "Objectives", value: "MLM + Classification" },
];

const SNIPPET = [
  { tone: "muted", text: "$ curl -X POST \\" },
  { tone: "plain", text: "    $NEXT_PUBLIC_API_URL/predict/mlm \\" },
  { tone: "plain", text: '    -H "Content-Type: application/json" \\' },
  {
    tone: "accent",
    text: '    -d \'{"text": "BasicBERT is a <MASK> model"}\'',
  },
];

export function Hero() {
  const reduce = useReducedMotion();

  const item = (delay: number) => ({
    initial: reduce ? { opacity: 1 } : { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] as const },
  });

  return (
    <section className="relative overflow-hidden pb-20 pt-36 sm:pb-28 sm:pt-44">
      {/* Background layers */}
      <div aria-hidden className="bg-grid absolute inset-0" />
      <div
        aria-hidden
        className="absolute -top-40 left-1/2 h-[520px] w-[720px] -translate-x-1/2 rounded-full opacity-[0.14] blur-[120px] animate-aurora dark:opacity-30"
        style={{
          background:
            "radial-gradient(closest-side, hsl(var(--accent) / 0.75), transparent 70%)",
        }}
      />
      <div
        aria-hidden
        className="absolute right-[-10%] top-1/3 h-[380px] w-[380px] rounded-full opacity-[0.08] blur-[110px] animate-aurora [animation-delay:-6s] dark:opacity-20"
        style={{
          background:
            "radial-gradient(closest-side, hsl(var(--brand) / 0.8), transparent 70%)",
        }}
      />

      <div className="container relative">
        <div className="grid items-center gap-14 lg:grid-cols-[1.05fr_0.95fr] lg:gap-10">
          {/* Copy */}
          <div className="text-center lg:text-left">
            <motion.div
              {...item(0)}
              className="flex justify-center lg:justify-start"
            >
              <span className="chip">
                <span className="flex h-4 w-4 items-center justify-center rounded-full bg-accent/15">
                  <Logo className="h-3.5 w-3.5" />
                </span>
                Built from scratch with PyTorch
              </span>
            </motion.div>

            <motion.h1
              {...item(0.08)}
              className="mt-6 text-balance text-5xl font-semibold leading-[1.05] tracking-tight sm:text-6xl lg:text-7xl"
            >
              Basic<span className="text-gradient">BERT</span>
            </motion.h1>

            <motion.p
              {...item(0.16)}
              className="text-balance mx-auto mt-5 max-w-xl text-lg leading-relaxed text-muted-foreground lg:mx-0 lg:max-w-lg"
            >
              A from-scratch BERT implementation with{" "}
              <span className="font-medium text-foreground">
                English + Urdu
              </span>{" "}
              support — tokenizer, embeddings, attention and training loop
              written by hand in PyTorch.
            </motion.p>

            <motion.div
              {...item(0.24)}
              className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center lg:justify-start"
            >
              <a
                href="#mlm"
                className="btn-primary h-12 w-full px-6 text-[15px] sm:w-auto"
              >
                Try MLM
                <ArrowDown className="h-4 w-4" aria-hidden />
              </a>
              <a
                href="#classification"
                className="btn-secondary h-12 w-full px-6 text-[15px] sm:w-auto"
              >
                Try Classification
              </a>
            </motion.div>

            <motion.dl
              {...item(0.32)}
              className="mt-10 grid max-w-lg grid-cols-1 gap-3 sm:grid-cols-3 lg:mx-0"
            >
              {STATS.map((stat) => (
                <div
                  key={stat.label}
                  className="card-surface px-4 py-3 text-left transition-colors duration-200 hover:border-foreground/15"
                >
                  <dt className="flex items-center gap-2 text-[11px] uppercase tracking-wide text-muted-foreground">
                    <stat.icon className="h-4 w-4 shrink-0 text-accent" aria-hidden />
                    {stat.label}
                  </dt>
                  <dd className="mt-1 text-[13px] font-medium leading-snug">
                    {stat.value}
                  </dd>
                </div>
              ))}
            </motion.dl>
          </div>

          {/* API card */}
          <motion.div
            initial={
              reduce ? { opacity: 1 } : { opacity: 0, y: 26, scale: 0.98 }
            }
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="relative mx-auto w-full max-w-md lg:max-w-none"
          >
            <div
              aria-hidden
              className="absolute -inset-6 rounded-4xl opacity-60 blur-2xl"
              style={{
                background:
                  "radial-gradient(60% 60% at 50% 30%, hsl(var(--accent) / 0.18), transparent 70%)",
              }}
            />
            <div className="card-surface relative overflow-hidden !shadow-card">
              <div className="flex items-center justify-between border-b border-border px-4 py-3">
                <div className="flex items-center gap-2" aria-hidden>
                  <span className="h-2.5 w-2.5 rounded-full bg-negative/70" />
                  <span className="h-2.5 w-2.5 rounded-full bg-accent/70" />
                  <span className="h-2.5 w-2.5 rounded-full bg-brand/70" />
                </div>
                <span className="font-mono text-[11px] text-muted-foreground">
                  fastapi · uvicorn
                </span>
                <span className="w-12" aria-hidden />
              </div>

              <div className="space-y-4 p-5 font-mono text-[13px] leading-relaxed">
                <div>
                  <p className="mb-2 text-[11px] uppercase tracking-wider text-muted-foreground">
                    request
                  </p>
                  <pre className="overflow-x-auto whitespace-pre-wrap break-words rounded-xl bg-surface-2 p-3 scrollbar-thin">
                    {SNIPPET.map((line, i) => (
                      <code
                        key={i}
                        className={
                          line.tone === "accent"
                            ? "text-accent"
                            : line.tone === "muted"
                              ? "text-muted-foreground"
                              : "text-foreground/90"
                        }
                      >
                        {line.text}
                        {"\n"}
                      </code>
                    ))}
                  </pre>
                </div>

                <div>
                  <p className="mb-2 text-[11px] uppercase tracking-wider text-muted-foreground">
                    response <span className="text-positive">200 OK</span>
                  </p>
                  <pre className="overflow-x-auto rounded-xl bg-surface-2 p-3 text-[13px] scrollbar-thin">
                    <code>
                      {"{"}
                      {"\n  "}
                      <span className="text-brand">
                        &quot;label&quot;
                      </span>:{" "}
                      <span className="text-accent">&quot;positive&quot;</span>,
                      {"\n  "}
                      <span className="text-brand">&quot;confidence&quot;</span>
                      : <span className="text-foreground">0.94</span>
                      {"\n"}
                      {"}"}
                    </code>
                  </pre>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
