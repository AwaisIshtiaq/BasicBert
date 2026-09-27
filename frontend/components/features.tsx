"use client";

import {
  ArrowUpRight,
  GitBranch,
  Languages,
  Layers,
  Server,
  Sparkles,
} from "lucide-react";
import { SectionHeading } from "@/components/section-heading";
import { Reveal } from "@/components/reveal";
import { GITHUB_URL } from "@/lib/constants";

const FEATURES = [
  {
    icon: Layers,
    title: "Transformer Encoder from scratch",
    description:
      "Token + position embeddings, layer normalization, residual connections and the full forward pass written by hand — no hidden framework magic.",
  },
  {
    icon: GitBranch,
    title: "Multi-Head Attention",
    description:
      "Scaled dot-product attention with learnable Q, K, V projections, causal-free encoder masking and parallel heads.",
  },
  {
    icon: Sparkles,
    title: "Masked Language Modeling",
    description:
      "A [MASK] objective with a tied LM head that returns ranked token probabilities in real time.",
  },
  {
    icon: Languages,
    title: "English + Urdu support",
    description:
      "A shared subword vocabulary covers both scripts, so RTL Urdu text predicts and classifies just as well as English.",
  },
  {
    icon: Server,
    title: "FastAPI backend",
    description:
      "Typed request/response models, CORS-enabled and served with Uvicorn for instant local development.",
  },
];

const LAYER_STACK = [
  { label: "Logits over vocab", tone: "muted" },
  { label: "[CLS] pooled output", tone: "brand" },
  { label: "Transformer Encoder × N", tone: "accent" },
  { label: "Token + position embeddings", tone: "muted" },
];

export function Features() {
  return (
    <section
      id="features"
      aria-labelledby="features-title"
      className="relative scroll-mt-28 border-t border-border py-20 sm:py-28"
    >
      <div className="container">
        <SectionHeading
          id="features-title"
          index="03"
          eyebrow="Under the hood"
          title={
            <>
              Built completely{" "}
              <span className="text-gradient">from scratch</span>
            </>
          }
          description="No Hugging Face model class, no pre-built encoder. Every tensor operation is implemented in PyTorch so the whole architecture is readable, hackable and educational."
          align="center"
        />

        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {/* Architecture card */}
          <Reveal className="sm:col-span-2">
            <article className="card-surface group h-full overflow-hidden p-6 transition-all duration-200 hover:border-foreground/20">
              <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
                <div className="min-w-0 flex-1">
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-accent/15 text-accent">
                    <Layers className="h-5 w-5" aria-hidden />
                  </span>
                  <h3 className="mt-4 text-lg font-semibold tracking-tight">
                    {FEATURES[0].title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {FEATURES[0].description}
                  </p>
                </div>

                <div
                  className="flex w-full shrink-0 flex-col gap-1.5 sm:w-56"
                  aria-hidden
                >
                  {LAYER_STACK.map((layer, i) => (
                    <div
                      key={layer.label}
                      className="rounded-lg border border-border bg-surface-2 px-3 py-2 font-mono text-[11px] leading-tight text-muted-foreground transition-all duration-200 group-hover:border-foreground/15"
                      style={{
                        marginLeft: `${i * 6}px`,
                        marginRight: `${(3 - i) * 6}px`,
                      }}
                    >
                      <span
                        className={
                          layer.tone === "accent"
                            ? "text-accent"
                            : layer.tone === "brand"
                              ? "text-brand"
                              : ""
                        }
                      >
                        {layer.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </article>
          </Reveal>

          {FEATURES.slice(1).map((feature, i) => (
            <Reveal key={feature.title} delay={0.05 * i}>
              <article className="card-surface group h-full p-6 transition-all duration-200 hover:-translate-y-0.5 hover:border-foreground/20">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-surface-2 text-accent transition-colors duration-200 group-hover:bg-accent/15">
                  <feature.icon className="h-5 w-5" aria-hidden />
                </span>
                <h3 className="mt-4 text-base font-semibold tracking-tight">
                  {feature.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {feature.description}
                </p>
              </article>
            </Reveal>
          ))}
        </div>

        {/* Repo CTA */}
        <Reveal delay={0.1}>
          <div className="mt-4 flex flex-col items-center justify-between gap-4 rounded-2xl border border-border bg-surface px-6 py-6 sm:flex-row sm:px-8">
            <div className="text-center sm:text-left">
              <h3 className="text-base font-semibold tracking-tight">
                Read the model code line by line
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Architecture, training loop, tokenizer and API — all in one
                repository.
              </p>
            </div>
            <a
              href={GITHUB_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary h-11 shrink-0 px-5"
            >
              View on GitHub
              <ArrowUpRight className="h-4 w-4" aria-hidden />
            </a>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
