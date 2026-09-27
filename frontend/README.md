# BasicBERT — Frontend

A production-ready **Next.js 15 + React 19** frontend for **BasicBERT**, a BERT-style
encoder-only Transformer written from scratch in PyTorch and served by a FastAPI/Uvicorn
backend.

The UI is a single-page product site with two live, interactive model playgrounds:

1. **Masked Language Modeling (MLM)** — type a sentence, drop a `<MASK>` token, get the
   top-k ranked replacement tokens with probability bars.
2. **Sentiment Classification** — get a positive/negative label with an animated
   confidence gauge.

Both playgrounds work with **English and Urdu** (RTL) text.

---

## Table of contents

- [Tech stack](#tech-stack)
- [Getting started](#getting-started)
- [Scripts](#scripts)
- [Project structure](#project-structure)
- [Page anatomy](#page-anatomy)
- [UI design system](#ui-design-system)
  - [Color tokens](#color-tokens)
  - [Typography](#typography)
  - [Shape, elevation, layout](#shape-elevation-layout)
  - [Reusable CSS primitives](#reusable-css-primitives)
  - [Animation system](#animation-system)
  - [Theming (light / dark)](#theming-light--dark)
- [Component reference](#component-reference)
- [Interactive playgrounds — states & behavior](#interactive-playgrounds--states--behavior)
- [Accessibility](#accessibility)
- [Responsive behavior](#responsive-behavior)
- [API contract](#api-contract)
- [Data flow & error handling](#data-flow--error-handling)
- [QA & visual test scripts](#qa--visual-test-scripts)
- [SEO & metadata](#seo--metadata)
- [Configuration reference](#configuration-reference)

---

## Tech stack

| Layer      | Choice                                                        | Why                                                                  |
| ---------- | ------------------------------------------------------------- | -------------------------------------------------------------------- |
| Framework  | Next.js 15 (App Router)                                       | Server-first routing, metadata API, `next/font` zero-layout-shift fonts |
| Language   | TypeScript (strict)                                           | Typed API contract, safe refactors                                    |
| UI         | React 19                                                      | Server components by default, `"use client"` only where interactive   |
| Styling    | Tailwind CSS 3.4 + CSS `@layer` design tokens                 | Utility-first layout with a semantic token layer on top               |
| Animation  | Framer Motion 12                                              | Scroll reveals, staggered results, `useReducedMotion` support         |
| Icons      | Lucide React                                                  | Consistent 24×24 stroke icons, tree-shaken                            |
| Theme      | next-themes                                                   | Class-based light/dark with no flash of wrong theme                   |
| Toasts     | sonner                                                        | Lightweight, theme-aware notifications                                |
| Class util | `clsx` + `tailwind-merge` (`cn()`)                            | Conditional classes without merge conflicts                           |
| Backend    | FastAPI + Uvicorn (separate service)                          | Typed JSON API at `NEXT_PUBLIC_API_URL`                               |
| QA         | Playwright-core + axe-core (local Chrome, no download)        | Screenshots, state captures, WCAG A/AA scans                          |

---

## Getting started

### 1. Install

```bash
npm install
```

### 2. Configure the API base URL

Copy the example env file and adjust if your backend runs elsewhere:

```bash
cp .env.local.example .env.local
```

```bash
NEXT_PUBLIC_API_URL=http://localhost:8000
```

> `NEXT_PUBLIC_*` values are inlined at build time. Restart `next dev` after changing them.

### 3. Run

```bash
npm run dev
```

Then start the backend in a second terminal:

```bash
uvicorn app.main:app --reload
```

Open [http://localhost:3000](http://localhost:3000). The header shows a live
**API connected / API offline** pill that polls `GET /` every 30 seconds, so you can tell
immediately whether the backend is reachable.

---

## Scripts

| Command            | Description                                                    |
| ------------------ | -------------------------------------------------------------- |
| `npm run dev`      | Development server (React Strict Mode on)                      |
| `npm run build`    | Production build                                               |
| `npm run start`    | Serve the production build                                     |
| `npm run lint`     | ESLint — `next/core-web-vitals` + TypeScript rules             |
| `npx tsc --noEmit` | Type check without emitting                                   |

Optional QA helpers live in `scripts/` (see [QA & visual test scripts](#qa--visual-test-scripts)).

---

## Project structure

```
app/
├── layout.tsx        # Root layout: Google fonts, metadata, ThemeProvider + Toaster
├── page.tsx          # Single page: Header → Hero → MLM → Classification → Features → Footer
├── globals.css       # Design tokens, base styles, reusable component/utility layers
└── icon.svg          # Favicon / app icon

components/
├── site-header.tsx   # Floating scroll-aware navbar + mobile menu
├── hero.tsx          # Hero: headline, stats, terminal-style API card
├── mlm-playground.tsx# Section 01 — masked language modeling UI
├── classification.tsx# Section 02 — sentiment analysis UI
├── features.tsx      # Section 03 — architecture feature grid + repo CTA
├── site-footer.tsx   # Footer: brand, nav, tech-stack chips, copyright
├── section-heading.tsx # Shared numbered section heading (index · eyebrow · title · description)
├── reveal.tsx        # Scroll-triggered fade-up wrapper (reduced-motion aware)
├── api-status.tsx    # Live API health pill
├── theme-provider.tsx# next-themes wrapper, also mounts the toaster
├── theme-toggle.tsx  # Sun/Moon animated toggle
├── app-toaster.tsx   # sonner toaster styled to match the design system
└── logo.tsx          # Inline SVG wordmark (encoder block stacked into a "B")

lib/
├── api.ts            # Fetch client, health check, response normalizers, typed results
├── examples.ts       # Pre-built EN/UR example sentences for both playgrounds
├── constants.ts      # GITHUB_URL
└── utils.ts          # cn(), formatPercent(), copyToClipboard()

scripts/
├── preview.mjs       # Full-page screenshots: dark / light / mobile
├── states.mjs        # Captures loading / success / error / empty states (API mocked)
└── a11y.mjs          # axe-core WCAG 2.1 A/AA scan in both themes

tailwind.config.ts    # Token → Tailwind color mapping, shadows, keyframes, animations
next.config.mjs       # reactStrictMode
eslint.config.mjs     # ESLint flat config
```

Path alias: `@/*` maps to the repository root (see `tsconfig.json`).

---

## Page anatomy

`app/page.tsx` composes one long scrolling page. Every section is an anchor target so the
nav links jump smoothly (`scroll-behavior: smooth` + `scroll-mt-28` compensates for the
fixed header).

```
<header>  fixed floating navbar        — logo, nav, API status, GitHub, theme, menu
<main id="main">
  ├── <Hero>             top          — headline, CTA, stats, API terminal card
  ├── <MlmPlayground>    #mlm         — "01 · Masked Language Modeling"
  ├── <Classification>   #classification — "02 · Text Classification"
  └── <Features>         #features    — "03 · Under the hood" + GitHub CTA
</main>
<footer>                             — brand, links, stack chips, copyright
```

### 1. Site header (`site-header.tsx`)

- **Floating pill navbar**: fixed at `top-3/top-4`, inset from both edges, `rounded-2xl`.
- **Scroll-aware**: transparent at the top of the page; after 12px of scroll it gains
  `bg-background/80`, `backdrop-blur-xl`, a border and `shadow-soft`.
- **Left**: SVG logo + `BasicBERT` wordmark (BERT in accent green), links to `#main`.
- **Center** (desktop `md+`): nav links — *MLM Playground*, *Sentiment*, *Architecture*
  with `hover:bg-surface-2` pill feedback.
- **Right**: `ApiStatus` pill, GitHub icon button (hidden below `sm`), `ThemeToggle`,
  hamburger button (only `md-`).
- **Mobile menu**: animated disclosure (`max-h-0 → max-h-72` + opacity), `aria-expanded`,
  closes on link click; duplicates the GitHub link for small screens where the icon is hidden.

### 2. Hero (`hero.tsx`)

Two-column layout on `lg` (`1.05fr / 0.95fr`), stacked and centered on smaller screens.

**Background layers** (all `aria-hidden`):

- `.bg-grid` — masked blueprint grid fading out radially.
- Two blurred radial "aurora" blobs (`animate-aurora`, 18s loop) in accent green and brand
  violet, with different opacities per theme.

**Copy column:**

- `chip` badge — logo glyph + "Built from scratch with PyTorch".
- `h1` — `Basic` + gradient `BERT` (`text-gradient`), scales `5xl → 6xl → 7xl`.
- Sub-paragraph with **English + Urdu** emphasized in foreground color.
- Two CTAs: `btn-primary` "Try MLM" (`#mlm`) and `btn-secondary` "Try Classification"
  (`#classification`); full-width stacked below `sm`.
- Three stat cards (`card-surface`) — *Encoder-only*, *Languages*, *Objectives* — each with
  a Lucide icon in accent color and an uppercase micro-label.

**API card column:** a faux terminal window (`card-surface !shadow-card`) with:

- Traffic-light dots + `fastapi · uvicorn` caption in the title bar.
- **request** block: a syntax-tinted `curl` snippet (`muted` / `foreground` / `accent` tones).
- **response** block: `200 OK` in positive green, JSON keys in brand violet, values in accent.
- A soft radial glow behind the card.

Everything enters with a staggered fade-up (`0 → 0.08 → 0.16 → 0.24 → 0.32s`), skipped when
`prefers-reduced-motion` is set.

### 3. MLM Playground (`mlm-playground.tsx`) — section 01

Grid `1.15fr / 1fr` on `lg`. Left = form, right = results. Both wrapped in `Reveal`.

**Input panel (`form`, `aria-label="MLM prediction form"`):**

- Label **Input sentence** + segmented **top 3 / 5 / 10** control (`aria-pressed`, active
  option gets `bg-background` + `shadow-soft`).
- `textarea.field` with placeholder `BasicBERT is a <MASK> model for English and Urdu`;
  automatically switches to `.font-urdu` (RTL, Noto Nastaliq) when Urdu characters are
  detected.
- Quick **+ `<MASK>`** dashed button appends the token (or inserts it into an empty field).
- Hint text and a row of **example chips** (`ExampleChip`) — EN/UR tagged, active chip
  highlighted in accent.
- Actions: `btn-primary` **Predict** (spins a `Loader2` while loading) and `btn-secondary`
  **Reset**; both `h-11`, disabled states handled.

**Results panel:**

- Header with **Copy all** (copies `token → percent` lines to the clipboard).
- Live region: `<div aria-live="polite" role="status">` with four mutually exclusive states
  — *loading skeletons*, *error*, *results*, *empty* (see the state table below).
- Each prediction renders a `PredictionCard`: rank `#n`, optional **UR** badge + Urdu
  font for RTL tokens, the token itself, a copy button (appears on hover/focus), an animated
  gradient probability bar with `role="progressbar"` attributes, and a tabular-nums percent.

### 4. Classification (`classification.tsx`) — section 02

Equal `lg:grid-cols-2` layout, decorative `.bg-grid` strip behind the heading.

**Input panel:** label + `POST /predict/classification` mono caption, a 6-row `field`
textarea (RTL auto-switch for Urdu), hint, five example chips (EN positive/negative/neutral,
UR مثبت/منفی), and **Analyze Sentiment** / **Reset** buttons.

**Result panel:** same four-state live region. On success it renders `ResultCard`:

- **ConfidenceGauge** — 140px SVG ring, `strokeDashoffset` animated over 1s; accent green
  at ≥50% confidence, negative red below. Center shows a large tabular-nums percentage.
- Predicted label with a tinted icon tile: `ThumbsUp` (positive/green),
  `ThumbsDown` (negative/red) or `ScanSearch` (other/brand violet).
- A horizontal confidence bar (`role="progressbar"`) plus a human-readable caption:
  - ≥ 75% — "The model is fairly certain about this prediction."
  - 50–75% — "A leaning, but not a decisive signal."
  - < 50% — "Low confidence — the sentence reads as ambiguous."
- **Copy result** button (`Sentiment: Positive (94.0%)`).

### 5. Features (`features.tsx`) — section 03

Centered `SectionHeading`, then a responsive card grid (`sm:2 / lg:3` columns):

- **Wide architecture card** (`sm:col-span-2`): encoder description on the left, and on the
  right an indented "layer stack" diagram — *Logits over vocab* → *[CLS] pooled output* →
  *Transformer Encoder × N* → *Token + position embeddings* — each row nudged by 6px per
  index for a stacked look, with accent/brand tones.
- Four feature cards: Multi-Head Attention, Masked Language Modeling, English + Urdu,
  FastAPI backend — each with an icon tile that tints to `bg-accent/15` on hover and a
  `-translate-y-0.5` lift.
- **Repo CTA** row: "Read the model code line by line" + `btn-primary` "View on GitHub".

### 6. Site footer (`site-footer.tsx`)

- Brand block (logo + wordmark, description, "Made with ♥ for learning & portfolio").
- **Explore** nav: the three section anchors + a GitHub button.
- **Stack chips**: Next.js, TypeScript, Tailwind CSS, PyTorch, FastAPI, Uvicorn — each a
  pill with a colored dot.
- Bottom row: dynamic `© {year}` and a mono tagline `encoder-only · MLM · classification`.

---

## UI design system

All design decisions live in two places:

- **`app/globals.css`** — raw HSL tokens (`:root` = light, `.dark` = dark) plus the
  `@layer components` / `@layer utilities` classes.
- **`tailwind.config.ts`** — maps those tokens to Tailwind names and defines shadows,
  keyframes and animations.

Use the **semantic token classes** (`bg-surface`, `text-muted-foreground`, `border-border`,
`text-accent`…) rather than raw hex values or `var()` wrappers — that is what makes light
and dark mode work for free.

### Color tokens

Palette: near-neutral greys for structure, **green accent** for primary/positive,
**violet brand** for secondary highlights, **red** for negative.

| Token              | Tailwind class(es)          | Light                       | Dark                         | Usage                                   |
| ------------------ | --------------------------- | --------------------------- | ---------------------------- | --------------------------------------- |
| `--background`     | `bg-background`             | `0 0% 98%` (#FAFAFA)        | `240 10% 4%` (#0A0A0C)       | Page background                         |
| `--foreground`     | `text-foreground`           | `240 10% 4%`                | `0 0% 98%`                   | Primary text                            |
| `--surface`        | `bg-surface`                | `0 0% 100%`                 | `240 8% 7%`                  | Cards, chips, inputs                    |
| `--surface-2`      | `bg-surface-2`              | `240 6% 96%`                | `240 7% 10%`                 | Nested panels, code blocks, hover rows  |
| `--border`         | `border-border`             | `240 6% 90%`                | `240 6% 16%`                 | All borders (set globally on `*`)       |
| `--muted-foreground` | `text-muted-foreground`   | `240 5% 38%`                | `240 5% 64%`                 | Secondary text (≥ 4.5:1 in both themes) |
| `--accent`         | `text-accent` / `bg-accent` | `142 72% 29%` (green)       | `142 71% 45%` (brighter)     | Primary buttons, links, highlights      |
| `--accent-fg`      | `text-accent-fg`            | `0 0% 100%`                 | `140 80% 5%`                 | Text on accent surfaces                 |
| `--brand`          | `text-brand` / `bg-brand`   | `262 83% 48%` (violet)      | `262 83% 71%`                | Secondary highlights, JSON keys         |
| `--positive`       | `bg-positive`               | `142 72% 29%`               | `142 71% 45%`                | "online", 200 OK, up-state              |
| `--negative`       | `bg-negative` / `text-negative` | `0 79% 46%`             | `0 84% 65%`                  | Errors, low confidence, offline         |
| `--ring`           | focus outline               | `142 69% 38%`               | `142 71% 45%`                | `:focus-visible` ring                   |
| `--grid-color`     | `.bg-grid`                  | `240 6% 92%`                | `240 6% 14%`                 | Blueprint grid lines                    |

Opacity modifiers (`bg-accent/15`, `border-negative/30`, `bg-surface/80`) are used
throughout for tints and glass effects.

### Typography

Loaded via `next/font/google` in `app/layout.tsx` (self-hosted, `display: swap`,
no layout shift):

| Role   | Font             | CSS variable    | Notes                                              |
| ------ | ---------------- | --------------- | -------------------------------------------------- |
| Sans   | **Inter**        | `--font-sans`   | Body, headings; `font-feature-settings: cv02…cv11` |
| Mono   | **JetBrains Mono** | `--font-mono` | Code, ranks, percentages, API captions             |
| Urdu   | **Noto Nastaliq Urdu** | `--font-urdu` | RTL, `line-height: 2.1` via `.font-urdu`       |

Type scale in use:

- `h1` hero: `text-5xl → 6xl → 7xl`, `font-semibold`, `tracking-tight`, `leading-[1.05]`.
- `h2` sections: `text-3xl → 4xl`, `font-semibold` (`SectionHeading`).
- `h3` cards: `text-base/lg`, `font-semibold`, `tracking-tight`.
- Body: `text-sm`/`text-[15px]`, `leading-relaxed`; muted copy uses `text-muted-foreground`.
- Micro labels: `text-[11px]`/`text-xs`, `uppercase`, `tracking-[0.18em]`.
- Numbers: `tabular-nums` everywhere a percentage or score can change.

`.text-gradient` applies a 100° foreground → accent → brand gradient clipped to text —
used on the `BERT` wordmark and each section title.

### Shape, elevation, layout

| Concern    | Value                                                                                        |
| ---------- | -------------------------------------------------------------------------------------------- |
| Container  | Tailwind `container`: centered, `1.25rem` side padding, capped at `1280px`                     |
| Card radius | `rounded-2xl` (16px) — `.card-surface`                                                       |
| Controls   | `rounded-xl` buttons, `rounded-2xl` textareas, `rounded-full` chips/pills                      |
| Shadows    | `shadow-soft` (default cards), `shadow-card` (hero terminal), `shadow-glow` (accent glow)      |
| Section spacing | `py-20 sm:py-28` with `border-t border-border` separators                                |
| Grid gaps  | `gap-6 lg:gap-8` between panels, `gap-4` between feature cards                                 |

### Reusable CSS primitives

Defined in `@layer components` / `@layer utilities` in `globals.css` — these are the
vocabulary the whole UI is built from:

| Class            | What it is                                                                                            |
| ---------------- | ----------------------------------------------------------------------------------------------------- |
| `.card-surface`  | `rounded-2xl border bg-surface shadow-soft` — the standard panel                                                              |
| `.btn`           | Base button: `inline-flex gap-2 rounded-xl px-4 py-2.5 text-sm font-medium`, 200ms transition, disabled → `opacity-55` + `cursor-not-allowed` |
| `.btn-primary`   | Accent green fill, accent-tinted drop shadow, `hover:brightness-*`, `active:scale-[0.98]`                                     |
| `.btn-secondary` | Surface fill + border, `hover:border-foreground/25`, `active:scale-[0.98]`                                                  |
| `.btn-ghost`     | Text-only, `hover:bg-surface-2`                                                                                            |
| `.chip`          | Small pill: bordered, `bg-surface/80`, backdrop-blur — used by the hero badge and API status                                 |
| `.field`         | Textarea/input: `rounded-2xl`, `focus:border-accent/60` + `focus:ring-4 ring-accent/15`, placeholder at 70% opacity          |
| `.skeleton`      | Loading placeholder with a `::after` shimmer sweep (`animate-shimmer`)                                                      |
| `.bg-grid`       | 56px blueprint grid, radially masked to fade toward the edges                                                               |
| `.text-gradient` | Foreground → accent → brand gradient text                                                                                   |
| `.text-balance`  | `text-wrap: balance` for headlines and descriptions                                                                         |
| `.font-urdu`     | Noto Nastaliq, `direction: rtl`, generous line-height                                                                       |
| `.scrollbar-thin`| 8px themed webkit scrollbar for code blocks and textareas                                                                   |

Global base rules: `* { border-color }`, smooth scrolling, `::selection` tinted with the
accent, and a 2px accent `:focus-visible` outline with offset.

### Animation system

**CSS keyframes** (`tailwind.config.ts`): `shimmer` (skeletons), `fade-up`, `pulse-soft`
(API "checking" dot), `aurora` (hero blobs, 18s), `caret-blink`, `bar-fill`.

**Framer Motion** conventions:

- Easing everywhere: `[0.22, 1, 0.36, 1]` (ease-out-expo style).
- `Reveal` — fade-up on scroll, `viewport: { once: true, margin: "-80px" }` so it fires
  once and only when near the viewport.
- Staggered entrances: hero (0.08s steps), prediction cards (`i * 0.07s`),
  feature cards (`0.05 * i`).
- Progress bars animate `width` from 0 (min 2% so a low score is still visible).
- The confidence ring animates `strokeDashoffset`.

**Reduced motion**: every motion component reads `useReducedMotion()` and starts at its
final state instead of animating. `globals.css` additionally forces `animation-duration`
and `transition-duration` to `0.001ms` and disables smooth scroll under
`prefers-reduced-motion: reduce`.

### Theming (light / dark)

- `next-themes` with `attribute="class"` and `defaultTheme="light"` (Tailwind
  `darkMode: "class"`).
- The `ThemeToggle` swaps a Sun and a Moon with rotate/scale/opacity transitions and waits
  for mount before reading the theme to avoid hydration mismatch.
- The sonner toaster reads `resolvedTheme` and applies matching colors/rounding.
- `viewport.themeColor` is set to `#FAFAFA` (light) / `#0A0A0C` (dark).
- Contrast was considered per theme: dark surfaces are `7–10%` lightness so borders at
  `16%` remain visible, and muted text sits at `64%` lightness.

---

## Component reference

| Component         | Type        | Responsibility                                                              |
| ----------------- | ----------- | --------------------------------------------------------------------------- |
| `ThemeProvider`   | client      | Wraps `next-themes`, mounts `AppToaster`                                    |
| `AppToaster`      | client      | sonner toaster, `bottom-right`, `richColors`, 5s duration, themed classes    |
| `SiteHeader`      | client      | Floating navbar, scroll state, mobile menu, status + toggles                 |
| `ThemeToggle`     | client      | Animated sun/moon theme switch                                              |
| `ApiStatus`       | client      | Polls `GET /` on mount + every 30s → online/offline/checking pill            |
| `Hero`            | client      | Landing copy, stats, terminal-style API card                                |
| `SectionHeading`  | server-safe | Numbered eyebrow (`01 — LABEL`), `h2`, optional description, left/center     |
| `Reveal`          | client      | Scroll-triggered fade-up wrapper, reduced-motion aware                       |
| `MlmPlayground`   | client      | MLM form + results state machine                                            |
| `Classification`  | client      | Sentiment form + gauge/result state machine                                 |
| `Features`        | client      | Architecture cards, layer-stack diagram, GitHub CTA                         |
| `SiteFooter`      | server-safe | Brand, links, tech-stack chips, copyright                                   |
| `Logo`            | server-safe | Inline SVG mark — no external asset                                          |

`"use client"` is applied only where interactivity or browser APIs are required;
the footer and section headings stay server components.

---

## Interactive playgrounds — states & behavior

Both playgrounds implement the same four-state pattern inside an
`aria-live="polite" role="status"` container with a `min-h-[300px]` so the layout never
jumps:

| State     | Trigger                       | Rendering                                                                            |
| --------- | ----------------------------- | ------------------------------------------------------------------------------------ |
| **Empty** | initial / after reset         | Dashed border box, icon tile, short instruction ("No predictions yet" / "Awaiting input") |
| **Loading** | request in flight           | Shimmer skeletons sized to the result (grid of `topK` cards / gauge + two lines)      |
| **Error** | non-OK response or network fail | `role="alert"` red panel with `TriangleAlert`, message, **Try again** button        |
| **Success** | normalized payload          | Prediction cards / `ResultCard` with staggered entrance                               |

Shared behaviors:

- Submit is disabled when the input is empty or a request is in flight.
- **Reset** clears text, results, error and the active example chip.
- Selecting an example chip fills the textarea, marks the chip active and clears stale
  results; typing manually deselects the chip.
- The MLM form warns via toast when the text has no `<MASK>` token (it still submits).
- Every result offers copy-to-clipboard (single token, whole table, or the sentiment line)
  with a success/error toast and a 1.6s check-mark confirmation.
- Success and failure both raise a sonner toast (`Predictions ready` /
  `Prediction failed`, etc.).

---

## Accessibility

- Semantic landmarks: `header`, `main#main`, `footer`, labelled `nav`s; skip link target
  via `href="#main"`.
- Every section has `aria-labelledby` pointing at its `h2`; forms have `aria-label`.
- Inputs use real `<label htmlFor>` pairs plus `aria-describedby` hints.
- Result regions are `aria-live="polite" role="status"`; failures are `role="alert"`.
- Probability/confidence bars are `role="progressbar"` with `aria-valuenow/min/max` and a
  descriptive `aria-label`.
- Toggle buttons expose state (`aria-pressed`, `aria-expanded`) and all icon-only buttons
  have `aria-label`s.
- Visible `:focus-visible` ring (2px accent + offset) on every interactive element.
- Decorative layers (grid, glows, icons inside text) are `aria-hidden`.
- Urdu tokens are marked with a visible **UR** badge — language is never conveyed by
  color alone.
- All animations respect `prefers-reduced-motion`.
- Verified with axe-core against **WCAG 2.1 A/AA** in both themes (`scripts/a11y.mjs`).

---

## Responsive behavior

Designed and checked at **375 / 768 / 1024 / 1440**:

| Breakpoint | Behavior                                                                 |
| ---------- | ------------------------------------------------------------------------ |
| < 640      | Single column; hero CTAs full width; stat cards stack; nav hidden behind hamburger; API status label collapses to the dot |
| 640–767    | Inline CTAs; GitHub icon appears; examples/results remain stacked          |
| ≥ 768 (`md`) | Full nav visible, hamburger hidden; footer becomes two-column             |
| ≥ 1024 (`lg`) | Playground panels sit side by side (`1.15fr/1fr` and `1fr/1fr`), hero becomes two columns, features hit 3 columns |

`body` has `overflow-x-hidden` so decorative blobs never create horizontal scroll; text
areas and code blocks use `scrollbar-thin` + `break-words` to stay contained.

---

## API contract

Base URL: `NEXT_PUBLIC_API_URL` (default `http://localhost:8000`, trailing slashes trimmed).
The client is intentionally tolerant about response shapes.

### Health

```http
GET /
```

Any 2xx within 4s ⇒ **API connected**; otherwise **API offline**.

### Masked language modeling

```http
POST /predict/mlm
Content-Type: application/json

{ "text": "BasicBERT is a <MASK> model", "top_k": 5 }
```

Accepted payloads:

- `{ "predictions": [{ "token": "...", "probability": 0.42 }] }`
- `{ "results": [...] }` / `{ "top_k": [...] }` / `{ "tokens": [...] }`
- a bare array, including `["token", 0.42]` pairs

Field aliases merged by the normalizer: `token | word | prediction | label | text` and
`probability | prob | score | confidence | prob_pred`. Probabilities may be `0–1` or
`0–100` — the UI converts either way. Unparseable entries are dropped, results capped at
`top_k` (max 20).

### Classification

```http
POST /predict/classification
Content-Type: application/json

{ "text": "BasicBERT is fast and clean!" }
```

Accepted payloads: `{ "label": "positive", "confidence": 0.94 }` plus
`prediction | sentiment | result` and `score | probability | prob` aliases.

Labels are normalized: `pos`, `+`, `1`, `true`, `good`, `مثبت` → **positive**;
`neg`, `-`, `0`, `false`, `bad`, `منفی` → **negative**; anything else is shown as-is
(with a neutral icon).

### Error handling

- Network failure → "Could not reach the BasicBERT API at … Make sure the FastAPI server
  is running."
- Non-2xx → FastAPI's `detail` string is surfaced when present, else the status code.
- Empty or unrecognizable payload → a specific "no predictions / no label found" message.

All client functions return a discriminated union —
`{ ok: true, data } | { ok: false, message }` — so components never throw.

---

## Data flow & error handling

```
component state (idle)
   │  submit
   ▼
lib/api.ts  ── fetch POST ──►  FastAPI
   │                              │
   │  normalize*()                │ JSON (any plausible shape)
   ▼                              ▼
ApiResult<T>  ──►  setState + sonner toast  ──►  render (loading | error | success)
```

- `post()` wraps `fetch` with a typed `ApiError` and parses the body defensively (text is
  read first, then JSON-parsed, so non-JSON error pages still produce a message).
- Normalizers are exported (`normalizeMlm`, `normalizeClassification`) so they can be
  unit-tested or reused.
- `formatPercent()` and `copyToClipboard()` live in `lib/utils.ts`; the clipboard helper
  falls back to a hidden `textarea` + `document.execCommand` when the async API is blocked.

---

## QA & visual test scripts

`scripts/` contains Playwright-core checks that drive your **locally installed Chrome**
(no browser download). They read `PREVIEW_URL` and write screenshots to
`PREVIEW_OUT` (default `%TEMP%/bb-shots`).

```bash
npm run start -- -p 3003

# dark / light / mobile full-page screenshots + console error capture
PREVIEW_URL=http://localhost:3003 node scripts/preview.mjs

# loading / results / error / empty states with the API mocked in-page
PREVIEW_URL=http://localhost:3003 node scripts/states.mjs

# axe-core WCAG 2.1 A/AA scan in dark and light themes
PREVIEW_URL=http://localhost:3003 node scripts/a11y.mjs
```

Notes:

- `preview.mjs` scrolls the whole page first so `whileInView` reveals have fired before
  capture, then records any `console.error` / `pageerror`.
- `states.mjs` intercepts `/predict/*` with fixtures (including an Urdu label) so every UI
  state can be photographed without a trained model.
- `a11y.mjs` prints violations with impact and the offending HTML snippets, or
  "no WCAG A/AA violations".

---

## SEO & metadata

Exported from `app/layout.tsx`:

- **Title**: *BasicBERT — A From-Scratch BERT Implementation*
- **Description** and **keywords**: BERT, Transformer, PyTorch, MLM, sentiment analysis,
  Urdu NLP, FastAPI, Next.js…
- **Open Graph** (`website`) and **Twitter** (`summary_large_image`) cards.
- **Viewport**: device width, `themeColor` matched to both schemes.
- `app/icon.svg` serves the favicon.

---

## Configuration reference

| File                     | Purpose                                                            |
| ------------------------ | ------------------------------------------------------------------ |
| `.env.local`             | `NEXT_PUBLIC_API_URL` (see `.env.local.example`)                   |
| `tailwind.config.ts`     | `darkMode: "class"`, token colors, `container`, shadows, animations |
| `app/globals.css`        | HSL tokens, base resets, component + utility layers                 |
| `next.config.mjs`        | `reactStrictMode: true`                                            |
| `tsconfig.json`          | `strict: true`, `@/*` path alias                                   |
| `eslint.config.mjs`      | Flat config → `next/core-web-vitals` + TypeScript                  |
| `lib/constants.ts`       | `GITHUB_URL` — point this at your repository                        |

---

## Pre-delivery UI checklist

The UI was built and reviewed against these rules:

- Icons are Lucide SVGs at a consistent 24×24 (18px in tight controls) — no emoji icons.
- Every clickable element has `cursor-pointer` and a hover/focus state.
- Transitions are 200–300ms; hover effects change color/border/shadow or lift by 0.5px —
  never a layout-shifting scale.
- Text contrast meets 4.5:1 in **both** themes; borders stay visible in both.
- Floating header keeps `top-4` + side insets; sections use `scroll-mt-28` so anchors
  never land under it.
- Container width is a single `max-w` (`1280px`) throughout.
- Responsive at 375/768/1024/1440 with no horizontal scroll.
- `prefers-reduced-motion` respected; images/marks carry `alt`/`aria-label`/`aria-hidden`.

---

## License

Built for learning and portfolio use.
