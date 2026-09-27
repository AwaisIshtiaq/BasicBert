export type MlmPrediction = {
  token: string;
  probability: number;
};

export type MlmResponse = {
  predictions: MlmPrediction[];
};

export type ClassificationResponse = {
  label: "positive" | "negative" | string;
  confidence: number;
};

export type ApiResult<T> =
  { ok: true; data: T } | { ok: false; message: string };

const API_URL = (
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"
).replace(/\/+$/, "");

export function getApiUrl() {
  return API_URL;
}

/** Returns true when the FastAPI health check responds. */
export async function checkHealth(timeoutMs = 4000): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    const res = await fetch(`${API_URL}/`, { signal: controller.signal });
    clearTimeout(timer);
    return res.ok;
  } catch {
    return false;
  }
}

class ApiError extends Error {}

async function post<T>(path: string, body: unknown): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch {
    throw new ApiError(
      `Could not reach the BasicBERT API at ${API_URL}. Make sure the FastAPI server is running.`,
    );
  }

  const text = await res.text();
  let json: unknown = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    /* non-JSON payload handled below */
  }

  if (!res.ok) {
    const detail = extractDetail(json) ?? text?.slice(0, 200);
    throw new ApiError(
      detail || `The API returned an error (status ${res.status}).`,
    );
  }

  if (json === null) {
    throw new ApiError("The API returned an empty response.");
  }

  return json as T;
}

function extractDetail(json: unknown): string | null {
  if (!json || typeof json !== "object") return null;
  const detail = (json as Record<string, unknown>).detail;
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail))
    return detail.map((d) => JSON.stringify(d)).join(" ");
  return null;
}

/* ----------------------------- MLM ----------------------------- */

function normalizeProbability(raw: unknown): number {
  const n = typeof raw === "string" ? Number(raw) : raw;
  return typeof n === "number" && Number.isFinite(n) ? n : 0;
}

function normalizeToken(raw: unknown): string {
  if (typeof raw === "string") return raw;
  if (typeof raw === "number") return String(raw);
  return "•";
}

/** Accepts a range of plausible FastAPI response shapes and normalizes them. */
export function normalizeMlm(raw: unknown): MlmPrediction[] {
  const container = (raw ?? {}) as Record<string, unknown>;
  const list =
    (Array.isArray(container.predictions) && container.predictions) ||
    (Array.isArray(container.results) && container.results) ||
    (Array.isArray(container.top_k) && container.top_k) ||
    (Array.isArray(container.tokens) && container.tokens) ||
    (Array.isArray(raw) && raw) ||
    [];

  return list
    .map((item) => {
      if (Array.isArray(item)) {
        // ["mask", 0.87] style pairs
        return {
          token: normalizeToken(item[0]),
          probability: normalizeProbability(item[1]),
        };
      }
      const entry = (item ?? {}) as Record<string, unknown>;
      const token =
        entry.token ??
        entry.word ??
        entry.prediction ??
        entry.label ??
        entry.text;
      const probability =
        entry.probability ??
        entry.prob ??
        entry.score ??
        entry.confidence ??
        entry.prob_pred;
      return {
        token: normalizeToken(token),
        probability: normalizeProbability(probability),
      };
    })
    .filter((p) => p.token !== "•")
    .slice(0, 20);
}

export async function predictMlm(
  text: string,
  topK = 5,
): Promise<ApiResult<MlmResponse>> {
  try {
    const raw = await post<unknown>("/predict/mlm", { text, top_k: topK });
    const predictions = normalizeMlm(raw);
    if (predictions.length === 0) {
      return {
        ok: false,
        message:
          "The API responded, but no predictions were found in the payload.",
      };
    }
    return { ok: true, data: { predictions: predictions.slice(0, topK) } };
  } catch (error) {
    return { ok: false, message: toMessage(error) };
  }
}

/* ------------------------- Classification ------------------------ */

function normalizeLabel(raw: unknown): string {
  if (typeof raw !== "string") return String(raw ?? "unknown");
  const value = raw.trim().toLowerCase();
  if (
    ["positive", "pos", "+", "1", "true", "pass", "good", "مثبت"].includes(
      value,
    )
  )
    return "positive";
  if (
    ["negative", "neg", "-", "0", "false", "fail", "bad", "منفی"].includes(
      value,
    )
  )
    return "negative";
  return raw.trim();
}

export function normalizeClassification(
  raw: unknown,
): ClassificationResponse | null {
  const container = (raw ?? {}) as Record<string, unknown>;
  const label =
    container.label ??
    container.prediction ??
    container.sentiment ??
    container.result;
  const confidence =
    container.confidence ??
    container.score ??
    container.probability ??
    container.prob;

  if (label === undefined || label === null) return null;

  return {
    label: normalizeLabel(label),
    confidence: normalizeProbability(confidence),
  };
}

export async function classifyText(
  text: string,
): Promise<ApiResult<ClassificationResponse>> {
  try {
    const raw = await post<unknown>("/predict/classification", { text });
    const normalized = normalizeClassification(raw);
    if (!normalized) {
      return {
        ok: false,
        message: "The API responded, but no label was found in the payload.",
      };
    }
    return { ok: true, data: normalized };
  } catch (error) {
    return { ok: false, message: toMessage(error) };
  }
}

function toMessage(error: unknown): string {
  if (error instanceof ApiError) return error.message;
  if (error instanceof Error) return error.message;
  return "Something went wrong while contacting the API.";
}
