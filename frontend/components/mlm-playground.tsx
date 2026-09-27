"use client";

import { useMemo, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  Check,
  Copy,
  Loader2,
  Play,
  RotateCcw,
  TriangleAlert,
} from "lucide-react";
import { toast } from "sonner";
import { SectionHeading } from "@/components/section-heading";
import { Reveal } from "@/components/reveal";
import { MLM_EXAMPLES, type Example } from "@/lib/examples";
import { predictMlm, type MlmPrediction } from "@/lib/api";
import { cn, copyToClipboard, formatPercent } from "@/lib/utils";

const TOP_K_OPTIONS = [3, 5, 10];

function isUrdu(text: string) {
  return /[\u0600-\u06FF]/.test(text);
}

function ExampleChip({
  example,
  active,
  onClick,
}: {
  example: Example;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "cursor-pointer rounded-full border px-3 py-1.5 text-xs font-medium transition-all duration-200",
        active
          ? "border-accent/50 bg-accent/10 text-accent"
          : "border-border bg-surface text-muted-foreground hover:border-foreground/20 hover:text-foreground",
      )}
    >
      <span className="mr-1.5 font-mono text-[10px] font-semibold">
        {example.lang}
      </span>
      {example.label}
    </button>
  );
}

function PredictionCard({
  prediction,
  rank,
  delay,
}: {
  prediction: MlmPrediction;
  rank: number;
  delay: number;
}) {
  const reduce = useReducedMotion();
  const [copied, setCopied] = useState(false);
  const pct =
    prediction.probability <= 1
      ? prediction.probability
      : prediction.probability / 100;

  const handleCopy = async () => {
    const ok = await copyToClipboard(prediction.token);
    if (ok) {
      setCopied(true);
      toast.success(`Copied "${prediction.token}"`);
      setTimeout(() => setCopied(false), 1600);
    } else {
      toast.error("Could not copy to clipboard");
    }
  };

  return (
    <motion.div
      initial={reduce ? { opacity: 1 } : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay, ease: [0.22, 1, 0.36, 1] }}
      className="card-surface group relative overflow-hidden p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-foreground/20"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-mono text-[11px] text-muted-foreground">
              #{rank}
            </span>
            {isUrdu(prediction.token) && (
              <span className="rounded-full bg-brand/15 px-1.5 py-0.5 text-[10px] font-medium text-brand">
                UR
              </span>
            )}
          </div>
          <p className="mt-1.5 truncate text-lg font-semibold leading-tight">
            {isUrdu(prediction.token) ? (
              <span className="font-urdu">{prediction.token}</span>
            ) : (
              prediction.token
            )}
          </p>
        </div>

        <button
          type="button"
          onClick={handleCopy}
          aria-label={`Copy token ${prediction.token}`}
          className="cursor-pointer rounded-lg border border-transparent p-1.5 text-muted-foreground opacity-0 transition-all duration-200 hover:border-border hover:bg-surface-2 hover:text-foreground focus-visible:opacity-100 group-hover:opacity-100"
        >
          {copied ? (
            <Check className="h-4 w-4 text-accent" />
          ) : (
            <Copy className="h-4 w-4" />
          )}
        </button>
      </div>

      <div className="mt-3.5 flex items-center gap-3">
        <div
          className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-2"
          role="progressbar"
          aria-valuenow={Math.round(pct * 100)}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Probability of ${prediction.token}`}
        >
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-accent to-brand"
            initial={reduce ? { width: `${pct * 100}%` } : { width: 0 }}
            animate={{ width: `${Math.min(100, Math.max(2, pct * 100))}%` }}
            transition={{
              duration: 0.8,
              delay: delay + 0.1,
              ease: [0.22, 1, 0.36, 1],
            }}
          />
        </div>
        <span className="font-mono text-xs tabular-nums text-muted-foreground">
          {formatPercent(prediction.probability)}
        </span>
      </div>
    </motion.div>
  );
}

export function MlmPlayground() {
  const [text, setText] = useState("");
  const [topK, setTopK] = useState(5);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [predictions, setPredictions] = useState<MlmPrediction[] | null>(null);
  const [activeExample, setActiveExample] = useState<string | null>(null);

  const hasMask = useMemo(() => /<\s*masks?\s*>/i.test(text), [text]);
  const canSubmit = text.trim().length > 0 && !loading;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    setLoading(true);
    setError(null);

    if (!hasMask) {
      toast.info("No <MASK> token found — the model will still try its best.");
    }

    const result = await predictMlm(text.trim(), topK);
    setLoading(false);

    if (result.ok) {
      setPredictions(result.data.predictions);
      toast.success("Predictions ready");
    } else {
      setPredictions(null);
      setError(result.message);
      toast.error("Prediction failed", { description: result.message });
    }
  };

  const handleReset = () => {
    setText("");
    setPredictions(null);
    setError(null);
    setActiveExample(null);
  };

  return (
    <section
      id="mlm"
      aria-labelledby="mlm-title"
      className="relative scroll-mt-28 border-t border-border py-20 sm:py-28"
    >
      <div className="container">
        <SectionHeading
          id="mlm-title"
          index="01"
          eyebrow="Masked Language Modeling"
          title={
            <>
              Fill in the <span className="text-gradient">&lt;MASK&gt;</span>{" "}
              token
            </>
          }
          description="Type a sentence, drop a <MASK> token anywhere, and let the encoder rank the most likely replacements — with probabilities straight from the softmax head."
        />

        <div className="mt-10 grid gap-6 lg:grid-cols-[1.15fr_1fr] lg:gap-8">
          {/* Input panel */}
          <Reveal className="min-w-0">
            <form
              onSubmit={handleSubmit}
              className="card-surface h-full p-5 sm:p-6"
              aria-label="MLM prediction form"
            >
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <label htmlFor="mlm-input" className="text-sm font-medium">
                  Input sentence
                </label>
                <div className="flex items-center gap-1 rounded-lg border border-border bg-surface-2 p-1">
                  {TOP_K_OPTIONS.map((k) => (
                    <button
                      key={k}
                      type="button"
                      onClick={() => setTopK(k)}
                      aria-pressed={topK === k}
                      className={cn(
                        "cursor-pointer rounded-md px-2.5 py-1 text-xs font-medium transition-all duration-200",
                        topK === k
                          ? "bg-background text-foreground shadow-soft"
                          : "text-muted-foreground hover:text-foreground",
                      )}
                    >
                      top {k}
                    </button>
                  ))}
                </div>
              </div>

              <textarea
                id="mlm-input"
                value={text}
                onChange={(e) => {
                  setText(e.target.value);
                  setActiveExample(null);
                }}
                rows={5}
                spellCheck={false}
                aria-describedby="mlm-hint"
                placeholder="BasicBERT is a <MASK> model for English and Urdu"
                className={cn(
                  "field scrollbar-thin min-h-[140px]",
                  isUrdu(text) && "font-urdu",
                )}
              />

              <div className="mt-3 flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const next = text.trim()
                      ? `${text.trim()} <MASK>`
                      : "<MASK>";
                    setText(next);
                  }}
                  className="cursor-pointer rounded-lg border border-dashed border-border px-2.5 py-1.5 font-mono text-xs text-muted-foreground transition-all duration-200 hover:border-accent/50 hover:text-accent"
                >
                  + &lt;MASK&gt;
                </button>
                <p id="mlm-hint" className="text-xs text-muted-foreground">
                  English and Urdu both work.
                </p>
              </div>

              <div className="mt-5">
                <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Examples
                </p>
                <div className="flex flex-wrap gap-2">
                  {MLM_EXAMPLES.map((example) => (
                    <ExampleChip
                      key={example.label}
                      example={example}
                      active={activeExample === example.label}
                      onClick={() => {
                        setText(example.text);
                        setActiveExample(example.label);
                        setPredictions(null);
                        setError(null);
                      }}
                    />
                  ))}
                </div>
              </div>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
                <button
                  type="submit"
                  disabled={!canSubmit}
                  className="btn-primary h-11 flex-1 px-6"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                      Predicting…
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4" aria-hidden />
                      Predict
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={handleReset}
                  disabled={loading || (!text && !predictions)}
                  className="btn-secondary h-11 px-5"
                >
                  <RotateCcw className="h-4 w-4" aria-hidden />
                  Reset
                </button>
              </div>
            </form>
          </Reveal>

          {/* Results panel */}
          <Reveal delay={0.1} className="min-w-0">
            <div
              className="card-surface h-full p-5 sm:p-6"
              aria-label="MLM results"
            >
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-sm font-medium">Top predictions</h3>
                {predictions && predictions.length > 0 && (
                  <button
                    type="button"
                    onClick={async () => {
                      const textToCopy = predictions
                        .map(
                          (p) => `${p.token}\t${formatPercent(p.probability)}`,
                        )
                        .join("\n");
                      const ok = await copyToClipboard(textToCopy);
                      if (ok) {
                        toast.success("Predictions copied");
                      } else {
                        toast.error("Could not copy to clipboard");
                      }
                    }}
                    className="flex cursor-pointer items-center gap-1.5 rounded-lg px-2 py-1 text-xs text-muted-foreground transition-colors duration-200 hover:bg-surface-2 hover:text-foreground"
                  >
                    <Copy className="h-3.5 w-3.5" aria-hidden />
                    Copy all
                  </button>
                )}
              </div>

              <div
                aria-live="polite"
                role="status"
                className="flex min-h-[300px] items-center"
              >
                {loading && (
                  <div className="grid w-full gap-3 sm:grid-cols-2">
                    {Array.from({ length: topK }).map((_, i) => (
                      <div key={i} className="skeleton h-[104px] w-full" />
                    ))}
                  </div>
                )}

                {!loading && error && (
                  <div
                    role="alert"
                    className="w-full rounded-xl border border-negative/30 bg-negative/10 p-4"
                  >
                    <div className="flex gap-3">
                      <TriangleAlert
                        className="mt-0.5 h-5 w-5 shrink-0 text-negative"
                        aria-hidden
                      />
                      <div className="min-w-0">
                        <p className="text-sm font-medium">Prediction failed</p>
                        <p className="mt-1 break-words text-sm text-muted-foreground">
                          {error}
                        </p>
                        <button
                          type="button"
                          onClick={handleSubmit}
                          className="mt-3 cursor-pointer rounded-lg border border-negative/40 px-3 py-1.5 text-xs font-medium text-negative transition-colors duration-200 hover:bg-negative/10"
                        >
                          Try again
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {!loading &&
                  !error &&
                  predictions &&
                  predictions.length > 0 && (
                    <div className="grid w-full gap-3 sm:grid-cols-2">
                      {predictions.map((prediction, i) => (
                        <PredictionCard
                          key={`${prediction.token}-${i}`}
                          prediction={prediction}
                          rank={i + 1}
                          delay={i * 0.07}
                        />
                      ))}
                    </div>
                  )}

                {!loading && !error && !predictions && (
                  <div className="flex h-[280px] w-full flex-col items-center justify-center rounded-xl border border-dashed border-border px-6 text-center">
                    <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-surface-2">
                      <span className="font-mono text-sm font-semibold text-accent">
                        [?]
                      </span>
                    </div>
                    <p className="text-sm font-medium">No predictions yet</p>
                    <p className="mt-1 max-w-[26ch] text-sm text-muted-foreground">
                      Enter a sentence with a{" "}
                      <code className="font-mono text-foreground">
                        &lt;MASK&gt;
                      </code>{" "}
                      token and hit Predict.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
