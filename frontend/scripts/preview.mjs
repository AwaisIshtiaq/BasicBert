import { chromium } from "playwright-core";
import { mkdirSync } from "node:fs";

const CHROME =
  "C:/Program Files/Google/Chrome/Application/chrome.exe";
const URL = process.env.PREVIEW_URL ?? "http://localhost:3001";
const OUT = process.env.PREVIEW_OUT ?? "C:/Users/Dell/AppData/Local/Temp/opencode/bb-shots";

mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({ executablePath: CHROME, headless: true });
const errors = [];

async function shoot({ name, width, height, scheme, theme }) {
  const ctx = await browser.newContext({
    viewport: { width, height },
    colorScheme: scheme,
    deviceScaleFactor: 1,
  });
  if (theme) await ctx.addInitScript((t) => localStorage.setItem("theme", t), theme);
  const page = await ctx.newPage();
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(`[${name}] ${m.text()}`);
  });
  page.on("pageerror", (e) => errors.push(`[${name}] pageerror: ${e.message}`));
  await page.goto(URL, { waitUntil: "networkidle" });
  await page.waitForTimeout(600);

  // Scroll through the page so whileInView reveals fire before capture.
  await page.evaluate(async () => {
    const step = Math.round(window.innerHeight * 0.6);
    for (let y = 0; y < document.body.scrollHeight; y += step) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 220));
    }
    window.scrollTo(0, 0);
    await new Promise((r) => setTimeout(r, 400));
  });
  await page.waitForTimeout(900);
  await page.screenshot({ path: `${OUT}/${name}.png`, fullPage: true });
  await ctx.close();
  console.log("captured", name);
}

await shoot({ name: "desktop-dark", width: 1440, height: 900, scheme: "dark", theme: "dark" });
await shoot({
  name: "desktop-light",
  width: 1440,
  height: 900,
  scheme: "light",
  theme: "light",
});
await shoot({ name: "mobile-dark", width: 390, height: 844, scheme: "dark", theme: "dark" });
await shoot({ name: "desktop-default", width: 1440, height: 900, scheme: "light" });
await shoot({
  name: "mobile-light",
  width: 390,
  height: 844,
  scheme: "light",
  theme: "light",
});

console.log(errors.length ? "CONSOLE ERRORS:\n" + errors.join("\n") : "no console errors");
await browser.close();
