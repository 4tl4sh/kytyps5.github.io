import { chromium } from "playwright";
import fs from "node:fs/promises";
await fs.mkdir(".impeccable/review", { recursive: true });
const browser = await chromium.launch({
  executablePath:
    process.platform === "win32"
      ? "C:/Program Files/Google/Chrome/Application/chrome.exe"
      : undefined,
  headless: true,
});
const page = await browser.newPage({ reducedMotion: "reduce" });
for (const [name, width, height] of [
  ["desktop", 1440, 1000],
  ["tablet", 768, 1024],
  ["mobile", 390, 844],
]) {
  await page.setViewportSize({ width, height });
  await page.goto("http://127.0.0.1:5173/");
  await page.locator("h1").waitFor();
  await page.evaluate(() => document.fonts.ready);
  for (
    let y = 0;
    y < (await page.evaluate(() => document.documentElement.scrollHeight));
    y += 700
  ) {
    await page.evaluate((y) => window.scrollTo(0, y), y);
    await page.waitForTimeout(100);
  }
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(1000);
  await page.screenshot({
    path: `.impeccable/review/${name}.png`,
    fullPage: true,
  });
  await page.screenshot({ path: `.impeccable/review/${name}-fold.png` });
  console.log(`Captured ${name}`);
}
for (const width of [1440, 390]) {
  await page.setViewportSize({ width, height: 1000 });
  for (const path of [
    "download",
    "compatibility",
    "docs",
    "faq",
    "about",
    "contributing",
    "game/PPSA21564",
  ]) {
    await page.goto(`http://127.0.0.1:5173/${path}`);
    await page.locator("h1").waitFor();
    await page.evaluate(() => document.fonts.ready);
    if (path.startsWith("game/")) await page.locator(".report").waitFor();
    await page.screenshot({
      path: `.impeccable/review/${path.replaceAll("/", "-")}-${width}.png`,
      fullPage: true,
    });
    console.log(`Captured ${path} ${width}`);
  }
}
await browser.close();
