import { chromium } from "playwright-core";
import { readFileSync } from "node:fs";

const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";
const URL = process.env.PREVIEW_URL ?? "http://localhost:3003";
const AXE = readFileSync("node_modules/axe-core/axe.min.js", "utf8");

const browser = await chromium.launch({ executablePath: CHROME, headless: true });

for (const scheme of ["dark", "light"]) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 940 }, colorScheme: scheme });
  if (scheme === "light") await ctx.addInitScript(() => localStorage.setItem("theme", "light"));
  const page = await ctx.newPage();
  await page.goto(URL, { waitUntil: "networkidle" });
  await page.evaluate(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += 500) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 60));
    }
    window.scrollTo(0, 0);
  });
  await page.waitForTimeout(900);
  await page.evaluate(AXE);
  const results = await page.evaluate(async () => {
    const r = await window.axe.run(document, {
      runOnly: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"],
    });
    return r.violations.map((v) => ({
      id: v.id,
      impact: v.impact,
      help: v.help,
      nodes: v.nodes.slice(0, 3).map((n) => n.html.slice(0, 140)),
    }));
  });
  console.log(`\n=== ${scheme} mode ===`);
  console.log(results.length ? JSON.stringify(results, null, 2) : "no WCAG A/AA violations");
  await ctx.close();
}

await browser.close();
