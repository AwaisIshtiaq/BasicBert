# BasicBERT

**A From-Scratch Implementation of BERT (Encoder-only Transformer)**  
English + Urdu Support 

---

## Overview

BasicBERT is a clean, from-scratch implementation of the Transformer **Encoder** based on the original paper [*Attention Is All You Need*](https://arxiv.org/abs/1706.03762).  

This project aims to create a **basic but complete version of BERT** using only fundamental techniques (no advanced tricks). The goal is to build a proper, industrial-style project that can produce real results and be deployed.

### Key Goals
- Implement Transformer Encoder completely from scratch (PyTorch)
- Support both **English** and **Urdu**
- Pre-train with Masked Language Modeling (MLM)
- Fine-tune on real downstream tasks
- Serve the model using FastAPI
- Keep the architecture basic (faithful to the original paper)

---

## Features

- Clean Transformer Encoder (Multi-Head Attention + Position-wise FFN + Add & Norm)
- Sinusoidal Positional Encoding
- Hugging Face `tokenizers` (BPE)
- Masked Language Modeling Head
- Classification Head
- Full training pipeline (optimizer, scheduler, trainer)
- Inference / Predictor class
- Industrial project structure
- Config-driven design
- FastAPI inference (coming next)
- English + Urdu support

---

## Project Structure

```text
basicbert/
├── configs/                 # Configuration files
├── data/                    # Raw & processed data
├── src/
│   ├── model/               # Model components
│   ├── data/                # Dataset & tokenization
│   ├── training/            # Trainer, optimizer, metrics
│   ├── inference/           # Prediction logic
│   └── utils/               # Config, logger, seed
├── app/                     # FastAPI application
├── scripts/                 # Training & evaluation scripts
├── notebooks/               # Exploration
├── tests/                   # Unit tests
├── requirements.txt
└── README.md