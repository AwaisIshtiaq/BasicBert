"use client";

import { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  Check,
  Copy,
  Loader2,
  RotateCcw,
  ScanSearch,
  ThumbsDown,
  ThumbsUp,
  TriangleAlert,
} from "lucide-react";
import { toast } from "sonner";
import { SectionHeading } from "@/components/section-heading";
import { Reveal } from "@/components/reveal";
import { CLASSIFICATION_EXAMPLES, type Example } from "@/lib/examples";
import { classifyText, type ClassificationResponse } from "@/lib/api";
import { cn, copyToClipboard, formatPercent } from "@/lib/utils";

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

function ConfidenceGauge({ confidence }: { confidence: number }) {
  const reduce = useReducedMotion();
  const clamped = Math.max(0, Math.min(1, confidence));
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - clamped);

  return (
    <div className="relative h-[140px] w-[140px] shrink-0">
      <svg
        viewBox="0 0 128 128"
        className="h-full w-full -rotate-90"
        aria-hidden
      >
        <circle
          cx="64"
          cy="64"
          r={radius}
          fill="none"
          strokeWidth="10"
          className="stroke-surface-2"
        />
        <motion.circle
          cx="64"
          cy="64"
          r={radius}
          fill="none"
          strokeWidth="10"
          strokeLinecap="round"
          className={cn(clamped >= 0.5 ? "stroke-accent" : "stroke-negative")}
          strokeDasharray={circumference}
          initial={
            reduce
              ? { strokeDashoffset: offset }
              : { strokeDashoffset: circumference }
          }
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-semibold tabular-nums">
          {Math.round(clamped * 100)}
          <span className="text-base font-medium text-muted-foreground">%</span>
        </span>
        <span className="text-[11px] uppercase tracking-wider text-muted-foreground">
          confidence
        </span>
      </div>
    </div>
  );
}

function ResultCard({ result }: { result: ClassificationResponse }) {
  const [copied, setCopied] = useState(false);
  const isPositive = result.label.toLowerCase().startsWith("pos");
  const isNegative = result.label.toLowerCase().startsWith("neg");
  const confidence =
    result.confidence <= 1 ? result.confidence : result.confidence / 100;

  const displayName =
    result.label.toLowerCase() === "positive"
      ? "Positive"
      : result.label.toLowerCase() === "negative"
        ? "Negative"
        : result.label;

  const Icon = isPositive ? ThumbsUp : isNegative ? ThumbsDown : ScanSearch;

  const handleCopy = async () => {
    const ok = await copyToClipboard(
      `Sentiment: ${displayName} (${formatPercent(result.confidence)})`,
    );
    if (ok) {
      setCopied(true);
      toast.success("Result copied");
      setTimeout(() => setCopied(false), 1600);
    } else {
      toast.error("Could not copy to clipboard");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="flex w-full flex-col items-center gap-6 rounded-2xl border border-border bg-surface-2 p-6 sm:flex-row sm:items-center sm:gap-8"
    >
      <ConfidenceGauge confidence={confidence} />

      <div className="min-w-0 flex-1 text-center sm:text-left">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Predicted sentiment
        </p>
        <div className="mt-2 flex items-center justify-center gap-3 sm:justify-start">
          <span
            className={cn(
              "inline-flex h-10 w-10 items-center justify-center rounded-xl",
              isPositive
                ? "bg-accent/15 text-accent"
                : isNegative
                  ? "bg-negative/15 text-negative"
                  : "bg-brand/15 text-brand",
            )}
          >
            <Icon className="h-5 w-5" aria-hidden />
          </span>
          <span
            className={cn(
              "text-3xl font-semibold tracking-tight",
              isPositive && "text-accent",
              isNegative && "text-negative",
            )}
          >
            {displayName}
          </span>
        </div>

        <div className="mt-4">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Confidence</span>
            <span className="font-mono tabular-nums">
              {formatPercent(result.confidence)}
            </span>
          </div>
          <div
            className="mt-1.5 h-2 overflow-hidden rounded-full bg-surface"
            role="progressbar"
            aria-valuenow={Math.round(confidence * 100)}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Confidence score"
          >
            <motion.div
              className={cn(
                "h-full rounded-full",
                isPositive
                  ? "bg-gradient-to-r from-accent to-accent/60"
                  : isNegative
                    ? "bg-gradient-to-r from-negative to-negative/60"
                    : "bg-gradient-to-r from-brand to-brand/60",
              )}
              initial={{ width: 0 }}
              animate={{
                width: `${Math.min(100, Math.max(2, confidence * 100))}%`,
              }}
              transition={{
                duration: 0.9,
                delay: 0.15,
                ease: [0.22, 1, 0.36, 1],
              }}
            />
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            {confidence >= 0.75
              ? "The model is fairly certain about this prediction."
              : confidence >= 0.5
                ? "A leaning, but not a decisive signal."
                : "Low confidence — the sentence reads as ambiguous."}
          </p>
        </div>

        <button
          type="button"
          onClick={handleCopy}
          className="mt-4 inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-xs text-muted-foreground transition-all duration-200 hover:border-foreground/20 hover:text-foreground"
        >
          {copied ? (
            <Check className="h-3.5 w-3.5 text-accent" />
          ) : (
            <Copy className="h-3.5 w-3.5" />
          )}
          Copy result
        </button>
      </div>
    </motion.div>
  );
}

export function Classification() {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ClassificationResponse | null>(null);
  const [activeExample, setActiveExample] = useState<string | null>(null);

  const canSubmit = text.trim().length > 0 && !loading;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    setLoading(true);
    setError(null);

    const response = await classifyText(text.trim());
    setLoading(false);

    if (response.ok) {
      setResult(response.data);
      toast.success("Sentiment analyzed");
    } else {
      setResult(null);
      setError(response.message);
      toast.error("Analysis failed", { description: response.message });
    }
  };

  const handleReset = () => {
    setText("");
    setResult(null);
    setError(null);
    setActiveExample(null);
  };

  return (
    <section
      id="classification"
      aria-labelledby="classification-title"
      className="relative scroll-mt-28 border-t border-border py-20 sm:py-28"
    >
      <div
        aria-hidden
        className="bg-grid absolute inset-x-0 top-0 h-64 opacity-60"
      />

      <div className="container relative">
        <SectionHeading
          id="classification-title"
          index="02"
          eyebrow="Text Classification"
          title={
            <>
              Sentiment analysis in{" "}
              <span className="text-gradient">one call</span>
            </>
          }
          description="A fine-tuned classification head on top of the same encoder returns a label and a confidence score — for English and Urdu sentences alike."
        />

        <div className="mt-10 grid gap-6 lg:grid-cols-2 lg:gap-8">
          <Reveal className="min-w-0">
            <form
              onSubmit={handleSubmit}
              className="card-surface h-full p-5 sm:p-6"
              aria-label="Sentiment classification form"
            >
              <div className="mb-4 flex items-center justify-between gap-3">
                <label htmlFor="cls-input" className="text-sm font-medium">
                  Text to analyze
                </label>
                <span className="font-mono text-[11px] text-muted-foreground">
                  POST /predict/classification
                </span>
              </div>

              <textarea
                id="cls-input"
                value={text}
                onChange={(e) => {
                  setText(e.target.value);
                  setActiveExample(null);
                }}
                rows={6}
                placeholder="BasicBERT is fast, clean, and the Urdu support is surprisingly good!"
                aria-describedby="cls-hint"
                className={cn(
                  "field scrollbar-thin min-h-[160px]",
                  isUrdu(text) && "font-urdu",
                )}
              />

              <p id="cls-hint" className="mt-3 text-xs text-muted-foreground">
                Works with English and Urdu text.
              </p>

              <div className="mt-5">
                <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Examples
                </p>
                <div className="flex flex-wrap gap-2">
                  {CLASSIFICATION_EXAMPLES.map((example) => (
                    <ExampleChip
                      key={example.label}
                      example={example}
                      active={activeExample === example.label}
                      onClick={() => {
                        setText(example.text);
                        setActiveExample(example.label);
                        setResult(null);
                        setError(null);
                      }}
                    />
                  ))}
                </div>
              </div>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <button
                  type="submit"
                  disabled={!canSubmit}
                  className="btn-primary h-11 flex-1 px-6"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                      Analyzing…
                    </>
                  ) : (
                    <>
                      <ScanSearch className="h-4 w-4" aria-hidden />
                      Analyze Sentiment
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={handleReset}
                  disabled={loading || (!text && !result)}
                  className="btn-secondary h-11 px-5"
                >
                  <RotateCcw className="h-4 w-4" aria-hidden />
                  Reset
                </button>
              </div>
            </form>
          </Reveal>

          <Reveal delay={0.1} className="min-w-0">
            <div
              className="card-surface h-full p-5 sm:p-6"
              aria-label="Sentiment result"
            >
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-sm font-medium">Result</h3>
                <span className="text-xs text-muted-foreground">
                  Positive / Negative
                </span>
              </div>

              <div
                aria-live="polite"
                role="status"
                className="flex min-h-[300px] items-center"
              >
                {loading && (
                  <div className="w-full space-y-4">
                    <div className="skeleton h-[176px] w-full" />
                    <div className="skeleton h-4 w-2/3" />
                    <div className="skeleton h-4 w-1/2" />
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
                        <p className="text-sm font-medium">Analysis failed</p>
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

                {!loading && !error && result && <ResultCard result={result} />}

                {!loading && !error && !result && (
                  <div className="flex h-[280px] w-full flex-col items-center justify-center rounded-xl border border-dashed border-border px-6 text-center">
                    <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-surface-2">
                      <ScanSearch className="h-5 w-5 text-accent" aria-hidden />
                    </div>
                    <p className="text-sm font-medium">Awaiting input</p>
                    <p className="mt-1 max-w-[30ch] text-sm text-muted-foreground">
                      Paste a sentence and press Analyze Sentiment to see the
                      label and confidence.
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
