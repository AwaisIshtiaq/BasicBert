import { chromium } from "playwright-core";
import { mkdirSync } from "node:fs";

const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";
const URL = process.env.PREVIEW_URL ?? "http://localhost:3002";
const OUT = process.env.PREVIEW_OUT ?? "C:/Users/Dell/AppData/Local/Temp/opencode/bb-shots";

mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch({ executablePath: CHROME, headless: true });

const MLM_MOCK = {
  predictions: [
    { token: "transformer", probability: 0.4123 },
    { token: "language", probability: 0.2287 },
    { token: "deep", probability: 0.1402 },
    { token: "multilingual", probability: 0.0931 },
    { token: "منصوبہ", probability: 0.0514 },
  ],
};
const CLS_MOCK = { label: "positive", confidence: 0.9417 };
const URDU_CLS_MOCK = { label: "مثبت", confidence: 0.8712 };

const errors = [];

async function newPage(scheme = "dark", theme) {
  const ctx = await browser.newContext({
    viewport: { width: 1440, height: 940 },
    colorScheme: scheme,
  });
  if (theme) await ctx.addInitScript((t) => localStorage.setItem("theme", t), theme);
  const page = await ctx.newPage();
  page.on("pageerror", (e) => errors.push(`pageerror: ${e.message}`));
  return { ctx, page };
}

async function revealSection(page, selector) {
  await page.locator(selector).scrollIntoViewIfNeeded();
  await page.waitForTimeout(900);
}

// 1. MLM success state (dark)
{
  const { ctx, page } = await newPage("dark");
  await page.route("**/predict/mlm", (route) =>
    route.fulfill({ json: MLM_MOCK })
  );
  await page.goto(URL, { waitUntil: "networkidle" });
  await page.getByRole("button", { name: /Model card/ }).click();
  await page.getByRole("button", { name: /^Predict$/ }).click();
  await page.waitForSelector('[role="status"] >> text=transformer');
  await revealSection(page, "#mlm");
  await page.screenshot({ path: `${OUT}/state-mlm-results.png` });
  await ctx.close();
  console.log("captured state-mlm-results");
}

// 2. MLM error state
{
  const { ctx, page } = await newPage("dark");
  await page.route("**/predict/mlm", (route) => route.abort("failed"));
  await page.goto(URL, { waitUntil: "networkidle" });
  await page.locator("#mlm-input").fill("BasicBERT is a <MASK> model");
  await page.getByRole("button", { name: /^Predict$/ }).click();
  await page.waitForSelector('[role="alert"]');
  await revealSection(page, "#mlm");
  await page.screenshot({ path: `${OUT}/state-mlm-error.png` });
  await ctx.close();
  console.log("captured state-mlm-error");
}

// 3. Classification success, light mode, Urdu label
{
  const { ctx, page } = await newPage("light", "light");
  await page.route("**/predict/classification", (route) =>
    route.fulfill({ json: URDU_CLS_MOCK })
  );
  await page.goto(URL, { waitUntil: "networkidle" });
  await page.getByRole("button", { name: /مثبت/ }).click();
  await page.getByRole("button", { name: /Analyze Sentiment/ }).click();
  await page.waitForSelector("text=Predicted sentiment");
  await revealSection(page, "#classification");
  await page.screenshot({ path: `${OUT}/state-cls-urdu-light.png` });
  await ctx.close();
  console.log("captured state-cls-urdu-light");
}

// 4. Classification success, dark mode, English label
{
  const { ctx, page } = await newPage("dark");
  await page.route("**/predict/classification", (route) =>
    route.fulfill({ json: CLS_MOCK })
  );
  await page.goto(URL, { waitUntil: "networkidle" });
  await page.getByRole("button", { name: /Positive/ }).first().click();
  await page.getByRole("button", { name: /Analyze Sentiment/ }).click();
  await page.waitForSelector("text=Predicted sentiment");
  await revealSection(page, "#classification");
  await page.screenshot({ path: `${OUT}/state-cls-dark.png` });
  await ctx.close();
  console.log("captured state-cls-dark");
}

// 5. Loading skeletons (slow API)
{
  const { ctx, page } = await newPage("dark");
  await page.route("**/predict/mlm", async (route) => {
    await new Promise((r) => setTimeout(r, 1500));
    await route.fulfill({ json: MLM_MOCK });
  });
  await page.goto(URL, { waitUntil: "networkidle" });
  await page.locator("#mlm-input").fill("BasicBERT is a <MASK> model");
  await page.getByRole("button", { name: /^Predict$/ }).click();
  await page.waitForTimeout(400);
  await revealSection(page, "#mlm");
  await page.screenshot({ path: `${OUT}/state-loading.png` });
  await ctx.close();
  console.log("captured state-loading");
}

console.log(errors.length ? "ERRORS:\n" + errors.join("\n") : "no page errors");
await browser.close();
