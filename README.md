# BasicBERT

**A from-scratch implementation of BERT (encoder-only Transformer) — English + Urdu — with a FastAPI inference backend and an interactive Next.js frontend.**

BasicBERT is a two-part project:

| Part | Stack | Role |
| --- | --- | --- |
| **`backend/`** | PyTorch, Hugging Face `tokenizers`, FastAPI, Uvicorn | Model implementation, training pipeline, and the JSON inference API |
| **`frontend/`** | Next.js 15, React 19, TypeScript, Tailwind CSS, Framer Motion | Product site with two **live** model playgrounds (MLM + sentiment) |

The goal is a **basic but complete** version of BERT: faithful to the original architecture, built only from fundamental building blocks, yet industrial in structure — config-driven, tested, servable, and deployable.

---

## Table of contents

- [How the two parts fit together](#how-the-two-parts-fit-together)
- [Tech stack](#tech-stack)
- [Repository structure](#repository-structure)
- [Quick start](#quick-start)
- [Backend](#backend)
  - [Architecture](#backend-architecture)
  - [Model architecture](#model-architecture)
  - [Tokenizer & data](#tokenizer--data)
  - [Training pipeline](#training-pipeline)
  - [Configs](#configs)
  - [Scripts](#scripts)
  - [API reference](#api-reference)
  - [Inference & predictor](#inference--predictor)
  - [Tests](#tests)
  - [Checkpoints](#checkpoints)
- [Frontend](#frontend)
  - [Page structure](#page-structure)
  - [Playgrounds & states](#playgrounds--states)
  - [Design system & theming](#design-system--theming)
  - [Accessibility & responsive behavior](#accessibility--responsive-behavior)
  - [QA & visual test scripts](#qa--visual-test-scripts)
- [End-to-end workflow](#end-to-end-workflow)
- [Configuration reference](#configuration-reference)
- [Known limitations & roadmap](#known-limitations--roadmap)
- [License](#license)

---

## How the two parts fit together

```
┌─────────────────────────────────────────────────────────────────────────┐
│  frontend/  (Next.js 15 — http://localhost:3000)                        │
│                                                                         │
│  lib/api.ts ──── fetch + tolerant response normalizers                  │
│      │                                                                  │
│      │  GET  /                     ← health pill (polled every 30s)     │
│      │  POST /predict/mlm          ← masked-language-modeling results   │
│      │  POST /predict/classification ← sentiment label + confidence     │
└──────┼──────────────────────────────────────────────────────────────────┘
       │  JSON over HTTP  (NEXT_PUBLIC_API_URL, default :8000)
┌──────┼──────────────────────────────────────────────────────────────────┐
│  backend/  (FastAPI — http://localhost:8000)                            │
│      ▼                                                                  │
│  app/main.py  →  dependencies.get_predictor()  [lazy singleton]         │
│      ▼                                                                  │
│  BasicBERTPredictor  =  BasicBERTTokenizer (BPE)                        │
│                      +  BasicBERT (encoder + MLM / classification head) │
│                      +  checkpoints/pretrain/final_model.pt             │
└─────────────────────────────────────────────────────────────────────────┘
```

Both services run independently during development; the frontend never touches PyTorch, and the backend never renders HTML.

---

## Tech stack

### Backend

| Layer | Choice | Notes |
| --- | --- | --- |
| Deep learning | **PyTorch** (`torch>=2.1.0`) | Everything — attention, embeddings, layers, heads — written by hand |
| Tokenization | **Hugging Face `tokenizers`** (`>=0.15.0`) | BPE with a custom special-token set |
| API | **FastAPI** + **Uvicorn** | Pydantic v2 request/response schemas, auto `/docs` |
| Config | **PyYAML** | `configs/*.yaml`, deep-merged at load time |
| Training utilities | `tqdm`, `numpy`, `pandas`, `scikit-learn`, `tensorboard` | tqdm progress + console logging |
| Python | **3.11** (venv built on 3.11.9) | See `backend/requirements.txt` |

### Frontend

| Layer | Choice | Notes |
| --- | --- | --- |
| Framework | **Next.js 15** (App Router) | Server components by default, `next/font` self-hosted fonts |
| Language / UI | **TypeScript (strict)** + **React 19** | Typed API contract via `lib/api.ts` |
| Styling | **Tailwind CSS 3.4** + CSS `@layer` design tokens | Semantic tokens → free light/dark theming |
| Animation | **Framer Motion 12** | Scroll reveals, staggered results, `useReducedMotion` |
| Icons / toasts / theme | **Lucide**, **sonner**, **next-themes** | Consistent iconography, themed toasts, flash-free dark mode |
| Class utils | `clsx` + `tailwind-merge` (`cn()`) | Conditional classes without merge conflicts |
| QA | **playwright-core** + **axe-core** | Local-Chrome screenshots, state captures, WCAG A/AA scans |

---

## Repository structure

```text
BasicBert/
├── README.md                  ← you are here (root overview of both parts)
├── .gitignore                 ← ignores venvs, checkpoints, .next, .env*.local, …
│
├── backend/                   ── PyTorch model + FastAPI service ──
│   ├── README.md              # backend-specific notes
│   ├── app/
│   │   ├── main.py            # FastAPI app, CORS, 3 endpoints
│   │   ├── schemas.py         # Pydantic request/response models
│   │   └── dependencies.py    # lazy singleton predictor loader
│   ├── src/
│   │   ├── model/             # attention, embedding, encoder, bert, heads
│   │   ├── data/              # tokenizer, dataset, MLM collator
│   │   ├── training/          # trainer, optimizer/scheduler, metrics
│   │   ├── inference/         # BasicBERTPredictor
│   │   └── utils/             # config loader (logger/seed reserved)
│   ├── configs/               # base.yaml, pretrain.yaml, finetune.yaml
│   ├── scripts/               # create_tokenizer, pretrain, finetune, test_inference
│   ├── checkpoints/pretrain/  # trained .pt files (git-ignored, ~768 MB total)
│   ├── data/                  # raw sample corpus + trained tokenizer.json
│   ├── notebooks/             # exploration (placeholder)
│   ├── tests/                 # script-style smoke tests
│   ├── requirements.txt
│   └── LICENSE                # GPL-3.0
│
└── frontend/                  ── Next.js 15 UI ──
    ├── README.md              # exhaustive frontend/design-system docs
    ├── app/                   # layout.tsx, page.tsx, globals.css, icon.svg
    ├── components/            # header, hero, 2 playgrounds, features, footer, …
    ├── lib/                   # api.ts, examples.ts, constants.ts, utils.ts
    ├── scripts/               # preview.mjs, states.mjs, a11y.mjs (QA)
    ├── tailwind.config.ts     # token mapping, shadows, keyframes
    └── .env.local.example     # NEXT_PUBLIC_API_URL=http://localhost:8000
```

---

## Quick start

### Prerequisites

- **Python 3.11+** (backend)
- **Node.js 18.18+** (ideally 20 LTS) for Next.js 15
- A GPU is optional — the trainer falls back to CPU automatically

### 1. Backend

```bash
cd backend

python -m venv venv
# Windows:  venv\Scripts\activate
# Linux/OSX: source venv/bin/activate

pip install -r requirements.txt

# Train the tokenizer (writes data/processed/tokenizer.json)
python scripts/create_tokenizer.py

# Serve the API on http://localhost:8000
uvicorn app.main:app --reload
```

> Pretrained checkpoints already live in `backend/checkpoints/pretrain/`, so
> **you can skip straight to `uvicorn`** and the model loads on first request.

### 2. Frontend

```bash
cd frontend

npm install

cp .env.local.example .env.local   # NEXT_PUBLIC_API_URL=http://localhost:8000

npm run dev                        # http://localhost:3000
```

Open **http://localhost:3000**. The header shows a live **API connected / API offline** pill (it polls `GET /` every 30 seconds), so you can immediately tell whether the backend is reachable.

> `NEXT_PUBLIC_*` values are inlined at **build** time — restart `next dev` after changing `.env.local`.

---

## Backend

### Backend architecture

```
backend/
├── app/                      FastAPI layer (thin — no ML logic)
│   ├── main.py               app + CORS + routes
│   ├── schemas.py            MLMRequest/Response, ClassificationRequest/Response
│   └── dependencies.py       get_predictor() → singleton, lazy on first request
│
├── src/
│   ├── model/                pure nn.Module building blocks
│   │   ├── attention.py      MultiHeadAttention (Q/K/V/O projections, scaled dot-product)
│   │   ├── embedding.py      token embedding (×√d_model) + fixed sinusoidal positions
│   │   ├── encoder.py        AddNorm, PositionwiseFeedForward, EncoderLayer, Encoder
│   │   ├── bert.py           BasicBERT = embedding → encoder → task head
│   │   └── heads.py          MaskedLMHead (GELU+LN decoder), ClassificationHead ([CLS] pool)
│   ├── data/
│   │   ├── tokenizer.py      BasicBERTTokenizer (BPE, special tokens, pad/truncate)
│   │   ├── dataset.py        BasicBERTDataset (encode → pad → attention_mask)
│   │   └── collator.py       MLMCollator — 15% masking, 80/10/10 corruption
│   ├── training/
│   │   ├── trainer.py        Trainer: loop, grad-accum, clipping, eval, checkpoints
│   │   ├── optimizer.py      AdamW (no-decay groups) + linear warmup/decay LambdaLR
│   │   └── metrics.py        compute_loss, MLM accuracy, classification accuracy
│   ├── inference/predictor.py  BasicBERTPredictor (load + predict_mlm / predict_classification)
│   └── utils/config.py       load_config(), merge_configs()
│
├── configs/                  YAML hyperparameters
├── scripts/                  CLI entry points (run from backend/)
└── tests/                    smoke tests
```

**Design principles**

- **Config-driven** — model and training hyperparameters come from YAML, not hard-coded constants.
- **Thin API** — `app/` only validates input and calls `BasicBERTPredictor`; all ML lives in `src/`.
- **Lazy singleton** — the checkpoint is loaded only when the first prediction request arrives, and only once.
- **From scratch** — no `transformers`, no `nn.TransformerEncoder`; every layer is explicit code you can read line by line.

### Model architecture

All values come from `configs/*.yaml` (defaults shown are what the code falls back to):

| Component | Value | Detail |
| --- | --- | --- |
| Hidden size `d_model` | **512** | Shared width for embeddings, layers and heads |
| Encoder layers | **6** | `nn.ModuleList` of `EncoderLayer` + a final LayerNorm |
| Attention heads | **8** | `d_k = 512 / 8 = 64` per head |
| FFN hidden dim `d_ff` | **2048** | `Linear(512→2048) → ReLU → Dropout → Linear(2048→512)` |
| Max positions `max_len` | **512** | Model capacity; dataset default `max_length: 128` |
| Positional encoding | **fixed sinusoidal** | sin/cos, registered as a buffer, + dropout (not learned) |
| Token embedding | `nn.Embedding(vocab, 512)` | Output scaled by **√d_model** (per the paper) |
| Normalization | **post-norm** (Add & Norm) | `LayerNorm(x + Dropout(sublayer(x)))` |
| Dropout | **0.1** | Applied to attention weights, FFN, embeddings, heads |
| MLM head | `Linear(512→512) → GELU → LayerNorm → Linear(512→vocab, bias=False) + bias` | Softmax over the full vocabulary |
| Classification head | **[CLS] pooling** → Dropout → `Linear(512→num_classes)` | Uses the first token's hidden state |
| `num_classes` | **2** | Positive / Negative |
| Vocab size | **219** (actual) | Config says 30000, tokenizer target 8000 — the tiny demo corpus only yields 219 merges; the predictor reads the real size from `tokenizer.json` |

**Forward pass**

```python
input_ids  →  TokenEmbedding (×√d_model)
           →  + Sinusoidal Positional Encoding (dropout)
           →  Encoder × N  (MHA → Add&Norm → FFN → Add&Norm)  + final LayerNorm
           →  task == "mlm"           ? MaskedLMHead      → (B, seq_len, vocab)
             task == "classification" ? ClassificationHead → (B, num_classes)
```

`attention_mask` is produced by the dataset/collator and accepted by the API, and is wired through `EncoderLayer`; see [Known limitations](#known-limitations--roadmap) for its current status inside the attention block.

### Tokenizer & data

- **Type:** Hugging Face `tokenizers` **BPE** with `Whitespace` pre-tokenizer, `min_frequency=2`.
- **Special tokens (in id order):** `<PAD>` `<UNK>` `<SOS>` `<EOS>` `<MASK>` `<CLS>` `<SEP>`
- **Post-processor:** `<CLS> $A <SEP>` (single) / `<CLS> $A <SEP> $B <SEP>` (pair)
- **Padding:** `<PAD>` (id 0) · **Truncation:** longest-first, right-padded, max length 512
- **Urdu support is real** — Urdu words are in the trained vocabulary, and the dataset simply mixes EN/UR lines.
- **Demo corpus:** `data/raw/sample.txt` — 12 unique sentences (8 English incl. sentiment examples, 3 Urdu, 1 mixed) repeated ×20 = 240 lines. It is generated by `scripts/create_tokenizer.py`.
- **MLM corruption** (`MLMCollator`, rate **15%**):
  - `<CLS>`, `<SEP>`, `<PAD>` are **never** masked
  - of selected positions: **80%** → `<MASK>`, **10%** → random vocabulary token, **10%** → unchanged
  - all non-masked positions get label `-100` so `cross_entropy` ignores them

> `pretrain.yaml` lists `data/processed/train.txt` and `val.txt`, but those files do not exist yet — the training scripts currently use small built-in English/Urdu demo sets (see [roadmap](#known-limitations--roadmap)).

### Training pipeline

`Trainer` (`src/training/trainer.py`) implements:

| Feature | Detail |
| --- | --- |
| Device | `cuda` if available, else `cpu` |
| Loop | forward → `compute_loss` → scaled by `gradient_accumulation_steps` → `backward()` |
| Gradient clipping | `clip_grad_norm_(…, max_grad_norm=1.0)` on every optimizer step |
| Optimizer | **AdamW** — `weight_decay=0.01`, `betas=(0.9,0.999)`, `eps=1e-8`; **0 decay** for bias & LayerNorm weights |
| Scheduler | **`LambdaLR` linear warmup + linear decay** ("BERT style"); `warmup_ratio=0.1` (or explicit `warmup_steps`) |
| Metrics | MLM masked-token accuracy (`ignore_index=-100`) or classification accuracy; val loss |
| Logging | console/tqdm every `log_every=50` steps |
| Evaluation | every `eval_every=500` steps → saves `best_model.pt` when val loss improves |
| Checkpointing | every `save_every=1000` steps → `checkpoint_step_N.pt`; every epoch → `epoch_N.pt`; at the end → `final_model.pt` |
| Saved state | `model_state_dict`, `optimizer_state_dict`, `scheduler_state_dict`, `global_step`, `config` |

**Not currently implemented:** mixed precision (AMP), early stopping/patience, resume-from-checkpoint, experiment tracking (TensorBoard is a dependency but unused).

### Configs

**`configs/base.yaml`** (base defaults)

```yaml
model:     { vocab_size: 30000, d_model: 512, num_heads: 8, num_layers: 6,
             d_ff: 2048, max_len: 512, dropout: 0.1, num_classes: 2 }
training:  { batch_size: 16, learning_rate: 5e-5, weight_decay: 0.01, epochs: 3,
             gradient_accumulation_steps: 1, max_grad_norm: 1.0, seed: 42 }
data:      { max_length: 128, mlm_probability: 0.15 }
optimizer: { name: AdamW, betas: [0.9, 0.999], eps: 1e-8 }
scheduler: { name: linear, warmup_steps: 1000 }
logging:   { log_every: 50, eval_every: 500, save_every: 1000 }
paths:     { output_dir: checkpoints, log_dir: logs, tokenizer_path: data/processed/tokenizer.json }
```

**`configs/pretrain.yaml`** (what `pretrain.py` and `finetune.py` load)

```yaml
training:  { batch_size: 16, learning_rate: 5e-5, epochs: 5,
             gradient_accumulation_steps: 2, max_grad_norm: 1.0, seed: 42, task: mlm }
data:      { max_length: 128, mlm_probability: 0.15,
             train_file: data/processed/train.txt, val_file: data/processed/val.txt }
scheduler: { name: linear, warmup_ratio: 0.1 }
paths:     { output_dir: checkpoints/pretrain, tokenizer_path: data/processed/tokenizer.json }
```

`configs/finetune.yaml` is a reserved, currently empty placeholder — `finetune.py` loads `pretrain.yaml` and overrides `task`, `epochs`, and `output_dir` in code.

### Scripts

All scripts use **CWD-relative paths** and append the project root to `sys.path` — **run them from `backend/`**. None take CLI arguments; paths and hyperparameters live in the YAML configs.

| Command | What it does | Output |
| --- | --- | --- |
| `python scripts/create_tokenizer.py` | Writes `data/raw/sample.txt`, trains the BPE tokenizer (target vocab 8000), saves it | `data/processed/tokenizer.json` |
| `python scripts/pretrain.py` | MLM pretraining: loads tokenizer + `pretrain.yaml`, builds dataset/collator/model, runs `Trainer.train()` | `checkpoints/pretrain/*.pt` |
| `python scripts/finetune.py` | Classification fine-tuning (2-class sentiment, 3 epochs, `task=classification`) | `checkpoints/finetune/` |
| `python scripts/test_inference.py` | Offline smoke test of the predictor: 3 MLM sentences + 2 classification sentences | console output |
| `python scripts/prepare_data.py` | *Reserved placeholder (currently empty)* | — |
| `python scripts/evaluate.py` | *Reserved placeholder (currently empty)* | — |

Expected `pretrain.py` console flow:

```text
Loading tokenizer...
Creating datasets...
Model created with X.XXM parameters
Training...
```

### API reference

Base URL: `http://localhost:8000` · Interactive docs: **`/docs`** (Swagger), `/redoc`, `/openapi.json`
CORS: `allow_origins=["*"]` so the Next.js origin can call it directly.

#### `GET /` — health

```json
{ "status": "ok", "model_loaded": true }
```

`model_loaded` reflects whether the lazy singleton has been created yet. The frontend polls this every 30 s (4 s timeout) for the header status pill.

#### `POST /predict/mlm` — masked language modeling

```jsonc
// request
{ "text": "BasicBERT is a <MASK> model for English and Urdu", "top_k": 5 }
//   top_k: default 5, validated 1…20 (422 outside that range)
//   "[MASK]" is also accepted and normalized to "<MASK>"
```

```jsonc
// 200 response  — one inner list per <MASK> occurrence in the input
{
  "input_text": "BasicBERT is a <MASK> model for English and Urdu",
  "predictions": [
    [ { "token": "good", "probability": 0.4217 },
      { "token": "great", "probability": 0.1903 },
      { "token": "new",  "probability": 0.0874 },
      { "token": "small", "probability": 0.0551 },
      { "token": "powerful", "probability": 0.0310 } ]
  ]
}
```

Errors: `422` for schema violations, `500` with `{ "detail": "…" }` on inference failure.

#### `POST /predict/classification` — sentiment classification

```jsonc
// request
{ "text": "this movie is amazing and wonderful" }
```

```jsonc
// 200 response
{
  "text": "this movie is amazing and wonderful",
  "label": "Positive",
  "confidence": 0.9412,
  "probabilities": { "Negative": 0.0588, "Positive": 0.9412 }
}
```

#### Curl examples

```bash
curl http://localhost:8000/
curl -X POST http://localhost:8000/predict/mlm \
  -H "Content-Type: application/json" \
  -d '{"text": "basic bert is a <MASK> model", "top_k": 5}'
curl -X POST http://localhost:8000/predict/classification \
  -H "Content-Type: application/json" \
  -d '{"text": "what a terrible and boring movie"}'
```

### Inference & predictor

`BasicBERTPredictor` (`src/inference/predictor.py`):

1. Loads the tokenizer from `data/processed/tokenizer.json`.
2. `torch.load`s `checkpoints/pretrain/final_model.pt`, rebuilds `BasicBERT` from the checkpoint config + `tokenizer.get_vocab_size()`, applies `load_state_dict`, moves to CUDA/CPU and calls `.eval()`.
3. Both prediction methods run under `@torch.no_grad()`.

- **`predict_mlm(text, top_k)`** — normalizes `[MASK]` → `<MASK>`, encodes, finds *every* mask position, softmaxes, takes `topk`, decodes each id back to a token, rounds probabilities to 4 decimals. Returns `List[List[{token, probability}]]`.
- **`predict_classification(text)`** — forward with `task="classification"`, softmax + argmax, returns `{label, confidence, probabilities}` where class 1 → `"Positive"`, class 0 → `"Negative"`.

> Model and tokenizer paths in `app/dependencies.py` are **relative**, so the API server must be started from the `backend/` directory.

### Tests

```bash
cd backend
python tests/test_model.py     # builds BasicBERT, checks MLM (2,16,5000) and classification (2,2) shapes
python scripts/test_inference.py  # end-to-end predictor smoke test (needs a checkpoint)
```

These are **script-style smoke tests** (plain prints, no pytest fixtures) — `pytest` is not a dependency. `tests/test_data.py` is reserved for future data-pipeline tests.

### Checkpoints

`backend/checkpoints/pretrain/` (git-ignored, ~768 MB total):

| File | Size | Meaning |
| --- | --- | --- |
| `epoch_1.pt` … `epoch_5.pt` | 103 MB each | End-of-epoch snapshots from the completed 5-epoch pretraining run |
| `best_model.pt` | 76 MB | Lowest validation loss (no optimizer state) |
| `final_model.pt` | 103 MB | **Loaded by the API** |
| `checkpoint_step_0.pt` | 76 MB | First periodic step checkpoint |

Each full checkpoint contains model + optimizer + scheduler state dicts, `global_step`, and the merged training config.

---

## Frontend

The frontend README (`frontend/README.md`) is the exhaustive reference (design tokens, component tables, per-section anatomy). This is the condensed picture:

A single-page product site with **two live playgrounds** that call the backend:

1. **MLM Playground** (`#mlm`, section 01) — type a sentence, insert `<MASK>`, pick **top 3 / 5 / 10**, get ranked tokens with animated probability bars, per-token and copy-all.
2. **Sentiment Classification** (`#classification`, section 02) — get a label with an animated SVG confidence gauge, a confidence bar, and a plain-language caption.

Both work with **English and Urdu** — Urdu input auto-switches the textarea to Noto Nastaliq RTL, and Urdu tokens/labels get an explicit **UR** badge.

### Page structure

```
<SiteHeader>  fixed floating navbar — logo, anchors, API status pill, GitHub, theme, mobile menu
<main id="main">
  ├── <Hero>            headline, CTAs, stats, faux-terminal API card
  ├── <MlmPlayground>   01 · Masked Language Modeling
  ├── <Classification>  02 · Text Classification
  └── <Features>        03 · Under the hood (layer-stack diagram + repo CTA)
</main>
<SiteFooter>  brand, links, stack chips, © year
```

Key components: `site-header`, `hero`, `mlm-playground`, `classification`, `features`, `site-footer`, plus shared primitives — `SectionHeading`, `Reveal` (scroll fade-up), `ApiStatus`, `ThemeToggle`, `ThemeProvider`/`AppToaster`, `Logo`.

Data layer: `lib/api.ts` exposes `checkHealth()`, `predictMlm()`, `predictClassification()` returning a discriminated union `{ ok: true, data } | { ok: false, message }` — components never throw. Responses are **normalized defensively**: field aliases (`token|word|prediction|label|text`, `probability|prob|score|confidence`) and 0–1 vs 0–100 probabilities are all handled.

### Playgrounds & states

Both playgrounds share a four-state machine inside an `aria-live="polite"` region with a fixed `min-h` (no layout jump):

| State | Trigger | UI |
| --- | --- | --- |
| Empty | initial / after reset | dashed box + instruction |
| Loading | request in flight | shimmer skeletons; Predict button spins |
| Error | non-2xx / network failure | `role="alert"` panel + **Try again**; FastAPI `detail` surfaced |
| Success | normalized payload | staggered prediction cards / gauge result |

Shared behaviors: submit disabled while empty/in-flight, example chips (EN/UR) fill the field, Reset clears everything, a toast warns when no `<MASK>` is present, every result is copy-to-clipboard, success/failure raise a sonner toast.

### Design system & theming

- **Tokens** live in `app/globals.css` (`:root` light / `.dark`) and are mapped in `tailwind.config.ts`; components use semantic classes (`bg-surface`, `text-muted-foreground`, `text-accent`, …).
- **Palette**: near-neutral greys, **green accent** (primary/positive), **violet brand** (secondary), **red** (negative).
- **Fonts** (via `next/font`, self-hosted): Inter (sans), JetBrains Mono (code/numbers), Noto Nastaliq Urdu (RTL).
- **Components**: `.card-surface`, `.btn`/`.btn-primary`/`.btn-secondary`/`.btn-ghost`, `.chip`, `.field`, `.skeleton`, `.bg-grid`, `.text-gradient`, `.font-urdu`.
- **Motion**: Framer Motion with ease `[0.22, 1, 0.36, 1]`, `Reveal` fires once on scroll; everything respects `prefers-reduced-motion`.
- **Light/dark**: `next-themes` class-based, no theme flash, themed sonner toasts.

### Accessibility & responsive behavior

- Landmarks (`header`/`main#main`/`footer`), labelled forms, real `<label htmlFor>` pairs, skip link via `href="#main"`.
- Result regions are `aria-live="polite" role="status"`; failures `role="alert"`; bars carry full `role="progressbar"` attributes; toggles expose `aria-pressed` / `aria-expanded`.
- Visible accent `:focus-visible` ring everywhere; decorative layers `aria-hidden`.
- Verified with axe-core against **WCAG 2.1 A/AA in both themes**.
- Responsive at **375 / 768 / 1024 / 1440**: single column → hamburger nav at `md-` → side-by-side playgrounds and 3-column features at `lg`.

### QA & visual test scripts

Playwright-core drives your **locally installed Chrome** (no browser download). Start a server first, then:

```bash
cd frontend
npm run start -- -p 3003

# full-page screenshots: dark / light / mobile + console error capture
PREVIEW_URL=http://localhost:3003 node scripts/preview.mjs

# loading / success / error / empty states with the API mocked in-page
PREVIEW_URL=http://localhost:3003 node scripts/states.mjs

# axe-core WCAG 2.1 A/AA scan in dark and light themes
PREVIEW_URL=http://localhost:3003 node scripts/a11y.mjs
```

Screenshots default to `%TEMP%/bb-shots` (`PREVIEW_OUT` overrides).

**Other frontend commands**

| Command | Purpose |
| --- | --- |
| `npm run dev` | Dev server (Strict Mode on) |
| `npm run build` / `npm run start` | Production build / serve |
| `npm run lint` | ESLint (`next/core-web-vitals` + TS) |
| `npx tsc --noEmit` | Type check |

---

## End-to-end workflow

```bash
# ── 1. tokenizer + corpus ────────────────────────────────────────────
cd backend && python scripts/create_tokenizer.py

# ── 2. MLM pretraining (5 epochs → checkpoints/pretrain/) ────────────
python scripts/pretrain.py

# ── 3. offline sanity check of the predictor ────────────────────────
python scripts/test_inference.py
python tests/test_model.py

# ── 4. serve the API (port 8000) ────────────────────────────────────
uvicorn app.main:app --reload

# ── 5. in a second terminal — UI (port 3000) ────────────────────────
cd frontend && npm install && npm run dev
```

Then open http://localhost:3000 and use the two playgrounds.

---

## Configuration reference

| File | Purpose |
| --- | --- |
| `backend/configs/base.yaml` | Base model/training/optimizer/scheduler/logging/paths defaults |
| `backend/configs/pretrain.yaml` | Pretraining overrides (loaded by `pretrain.py` **and** `finetune.py`) |
| `backend/configs/finetune.yaml` | Reserved (empty) — fine-tuning overrides applied in code today |
| `backend/requirements.txt` | Python dependencies (`torch>=2.1.0`, `fastapi>=0.104.0`, `tokenizers>=0.15.0`, …) |
| `frontend/.env.local` | `NEXT_PUBLIC_API_URL` (see `.env.local.example`) — restart `next dev` after edits |
| `frontend/tailwind.config.ts` | Dark-mode strategy, token → color mapping, shadows, keyframes |
| `frontend/app/globals.css` | HSL design tokens + component/utility layers |
| `frontend/lib/constants.ts` | `GITHUB_URL` — point this at your repository |

**Environment & secrets:** the root `.gitignore` excludes `backend/venv/`, `backend/checkpoints/`, `backend/data/raw/`, `*.pt`, `frontend/.next/`, `frontend/.env*.local`, `.env`, editor folders and logs — so weights, corpora, environments and local env files never reach git.

---

## Known limitations & roadmap

Honest status of the project so you know what works today and what's next:

**Works today**

- ✅ End-to-end MLM pretraining on the demo corpus, with epoch/best/final checkpoints
- ✅ FastAPI serving MLM top-k and classification predictions; live UI playgrounds
- ✅ Complete, readable from-scratch encoder code; config-driven hyperparameters
- ✅ BPE tokenizer with real Urdu vocabulary; EN/UR UI with RTL handling
- ✅ Frontend design system, a11y (axe WCAG A/AA) and visual QA scripts

**Known issues / planned work**

1. **Encoder loop early-return** — in `src/model/encoder.py::Encoder.forward`, the final LayerNorm and `return x` are indented *inside* the `for` loop, so only the **first** encoder layer runs per forward pass (layers 2–6 never receive gradients). Move `x = self.norm(x)` and `return x` out of the loop.
2. **Attention mask not applied** — `mask` is accepted by `MultiHeadAttention.forward` but never added to the scores in `scaled_dot_product_attention`, so padding tokens can attend and be attended to. Apply the mask (`scores.masked_fill(mask == 0, -1e9)`) *before* the softmax — after fixing issue 1.
3. **Fine-tuning path** — `scripts/finetune.py` builds `MLMCollator(mlm_probability=0.0)`; class labels land in `batch["class_labels"]`, which `Trainer` never reads, while the all-`-100` MLM labels tensor is fed to the classification loss (shape mismatch). The collator/trainer need a classification branch.
4. **Real datasets** — `pretrain.yaml` points at `data/processed/train.txt` / `val.txt` which don't exist; both training scripts use small built-in demo sentence sets. Implement `scripts/prepare_data.py` for real English + Urdu corpora.
5. **Vocabulary scale** — the demo corpus yields a 219-token vocab (vs. the 8000/30000 targets). Bigger data ⇒ a real tokenizer ⇒ meaningfully better predictions.
6. **Empty placeholders** — `scripts/evaluate.py`, `tests/test_data.py`, `src/utils/logger.py`, `src/utils/seed.py`, `notebooks/exploration.ipynb`, `configs/finetune.yaml`, `Dockerfile`, `pyproject.toml`.
7. **Reproducibility & scale** — `seed: 42` is declared but `seed.py` is empty (seeding never applied); no AMP, early stopping, checkpoint resume, or experiment logging yet.
8. **`GITHUB_URL`** in `frontend/lib/constants.ts` is still `https://github.com/` — set it to the real repository.

---

## License

Backend code is licensed under **GNU GPLv3** — see [`backend/LICENSE`](backend/LICENSE).

