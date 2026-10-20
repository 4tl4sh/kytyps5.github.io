import { chromium } from "playwright";
import assert from "node:assert/strict";
import fs from "node:fs/promises";

const browser = await chromium.launch({
  executablePath:
    process.env.CHROME_PATH ??
    (process.platform === "win32"
      ? "C:/Program Files/Google/Chrome/Application/chrome.exe"
      : undefined),
  headless: true,
});
await fs.mkdir(".impeccable/review/cache-ripple", { recursive: true });
try {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
    colorScheme: "light",
    reducedMotion: "no-preference",
  });
  await context.addInitScript(() => {
    window.__themeAnimations = [];
    const original = Element.prototype.animate;
    Element.prototype.animate = function (frames, options) {
      const animation = original.call(this, frames, options);
      if (
        options?.pseudoElement === "::view-transition-group(theme-incoming)"
      ) {
        const root = document.documentElement;
        const sample = {
          frames,
          options,
          origin: [
            root.style.getPropertyValue("--ripple-x"),
            root.style.getPropertyValue("--ripple-y"),
          ],
          ticks: [],
        };
        window.__themeAnimations.push(sample);
        const start = performance.now();
        const tick = () => {
          if (
            animation.playState === "finished" ||
            animation.playState === "idle"
          )
            return;
          if (animation.playState === "running")
            sample.ticks.push(performance.now() - start);
          requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      }
      return animation;
    };
  });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("http://127.0.0.1:5173/");
  await page.locator("h1").waitFor();
  await page.evaluate(() => document.fonts.ready);
  await page.waitForFunction(() =>
    [...document.querySelectorAll(".hero-visual img")].some(
      (image) => image.complete && image.naturalWidth > 0,
    ),
  );
  await page
    .getByRole("button", { name: "Switch to dark mode", exact: true })
    .click();
  await page.waitForFunction(() => window.__themeAnimations.length === 1);
  const timing = await page.evaluate(() => window.__themeAnimations[0].options);
  assert.equal(timing.duration, 600);
  assert.equal(timing.easing, "linear");
  assert.deepEqual(
    await page.evaluate(() => window.__themeAnimations[0].origin),
    ["0px", "0px"],
  );
  assert(
    await page.evaluate(() =>
      window.__themeAnimations[0].frames.every((frame) =>
        Object.keys(frame).every((key) =>
          ["transform", "offset"].includes(key),
        ),
      ),
    ),
  );
  await page.waitForTimeout(120);
  await page.screenshot({
    path: ".impeccable/review/cache-ripple/dark-from-top-left.png",
  });
  await page.waitForFunction(
    () => !document.documentElement.dataset.themeRipple,
  );
  await page
    .getByRole("button", { name: "Switch to light mode", exact: true })
    .click();
  await page.waitForFunction(() => window.__themeAnimations.length === 2);
  assert.deepEqual(
    await page.evaluate(() => window.__themeAnimations[1].origin),
    ["1440px", "1000px"],
  );
  await page.waitForTimeout(120);
  await page.screenshot({
    path: ".impeccable/review/cache-ripple/light-from-bottom-right.png",
  });
  await page.waitForFunction(
    () => !document.documentElement.dataset.themeRipple,
  );
  // Interrupt an in-flight wave: the most recent choice must win.
  await page
    .getByRole("button", { name: "Switch to dark mode", exact: true })
    .click();
  await page.waitForFunction(
    () => document.documentElement.dataset.theme === "dark",
  );
  await page
    .getByRole("button", { name: "Switch to light mode", exact: true })
    .click();
  await page.waitForFunction(
    () => !document.documentElement.dataset.themeRipple,
  );
  assert.equal(await page.locator("html").getAttribute("data-theme"), "light");
  assert.equal(
    await page.evaluate(() => localStorage.getItem("kyty-theme")),
    "light",
  );
  console.log(
    "PASS real theme ripples originate top-left for dark and bottom-right for light; rapid toggles settle correctly",
  );
  // Measure separately: taking a screenshot itself stalls animation frames.
  for (const next of ["dark", "light"]) {
    await page
      .getByRole("button", { name: `Switch to ${next} mode`, exact: true })
      .click();
    await page.waitForFunction(
      () => !document.documentElement.dataset.themeRipple,
    );
  }
  const frameTiming = await page.evaluate(() =>
    window.__themeAnimations.slice(-2).map(({ ticks }) => {
      const gaps = ticks
        .slice(1)
        .map((time, i) => ({ time, gap: time - ticks[i] }));
      return Math.round(
        Math.max(
          0,
          ...gaps.filter(({ time }) => time > 350).map(({ gap }) => gap),
        ),
      );
    }),
  );
  console.log(
    `Ripple final-200ms largest frame gaps (no capture): dark ${frameTiming[0]}ms, light ${frameTiming[1]}ms`,
  );
  await page.emulateMedia({ reducedMotion: "reduce" });
  const before = await page.evaluate(() => window.__themeAnimations.length);
  await page
    .getByRole("button", { name: "Switch to dark mode", exact: true })
    .click();
  assert.equal(
    await page.evaluate(() => window.__themeAnimations.length),
    before,
  );
  assert.equal(await page.locator("html").getAttribute("data-theme"), "dark");
  console.log("PASS reduced motion changes theme immediately");
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.evaluate(() => {
    document.startViewTransition = undefined;
  });
  await page
    .getByRole("button", { name: "Switch to light mode", exact: true })
    .click();
  assert.equal(await page.locator("html").getAttribute("data-theme"), "light");
  assert.equal(
    await page.evaluate(() => window.__themeAnimations.length),
    before,
  );

  let requests = 0,
    fail = false;
  await page.route("**/data/cache-probe.json", (route) => {
    requests++;
    return fail
      ? route.abort()
      : route.fulfill({ json: { version: requests } });
  });
  const load = (opts) =>
    page.evaluate(async (opts) => {
      const { cachedJson } = await import("/src/lib/cache.ts");
      return cachedJson("/data/cache-probe.json", opts);
    }, opts);
  const data = await page.evaluate(async () => {
    const { cachedJson } = await import("/src/lib/cache.ts");
    return Promise.all([
      cachedJson("/data/cache-probe.json"),
      cachedJson("/data/cache-probe.json"),
      cachedJson("/data/cache-probe.json"),
    ]);
  });
  assert.equal(requests, 1);
  assert.deepEqual(data, [{ version: 1 }, { version: 1 }, { version: 1 }]);
  await page.reload();
  await page.locator("h1").waitFor();
  assert.deepEqual(await load({}), { version: 1 });
  assert.equal(requests, 1);
  assert.deepEqual(await load({ force: true }), { version: 2 });
  assert.equal(requests, 2);
  fail = true;
  assert.deepEqual(await load({ maxAge: 0 }), { version: 2 });
  const refreshError = await load({ force: true, allowStale: false }).then(
    () => false,
    () => true,
  );
  assert(refreshError);
  assert.deepEqual(await load({}), { version: 2 });
  assert(
    (await page.evaluate(
      async () => (await (await caches.open("kyty-json-v1")).keys()).length,
    )) <= 64,
  );
  console.log(
    "PASS JSON requests deduplicate, persist across reload, refresh explicitly, fall back offline and never cache errors",
  );
  assert.deepEqual(errors, []);
  await context.close();

  const offline = await browser.newContext({ reducedMotion: "reduce" });
  const app = await offline.newPage();
  await app.goto("http://127.0.0.1:5174/");
  await app.locator("h1").waitFor();
  await app.evaluate(() => navigator.serviceWorker.ready);
  await app.waitForFunction(() => navigator.serviceWorker.controller);
  const config = await app.evaluate(async () => {
    const names = await caches.keys();
    const name = names.find(
      (n) => n.startsWith("kyty-static-") && !n.endsWith("-dev"),
    );
    return {
      name,
      count: name ? (await (await caches.open(name)).keys()).length : 0,
    };
  });
  assert(config.name);
  assert(config.count > 10);
  // A controlled cross-origin image checks opaque caching without depending
  // on the availability or rate limits of an external artwork host in CI.
  await app.evaluate(
    () =>
      new Promise((resolve, reject) => {
        const image = new Image();
        image.onload = resolve;
        image.onerror = reject;
        image.src = "http://127.0.0.1:5173/images/kitty-still-v2.png";
        document.body.append(image);
      }),
  );
  const cover = await app.evaluate(async () => {
    const cache = await caches.open("kyty-images-v1");
    const url = "http://127.0.0.1:5173/images/kitty-still-v2.png";
    for (let attempt = 0; attempt < 200; attempt++) {
      if (await cache.match(url)) return url;
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
    throw new Error("No cross-origin artwork was cached");
  });
  assert(cover);
  await app.evaluate(
    () =>
      new Promise((resolve, reject) => {
        const image = new Image();
        image.onload = () => resolve(true);
        image.onerror = reject;
        image.src = "/favicon.svg";
        document.body.append(image);
      }),
  );
  await app.waitForFunction(
    async () =>
      !!(await (await caches.open("kyty-images-v1")).match("/favicon.svg")),
  );
  await app.goto("http://127.0.0.1:5174/game/PPSA21564");
  await app.locator(".report").waitFor();
  await offline.setOffline(true);
  await app.reload();
  await app.locator(".report").waitFor();
  assert.match(await app.locator("h1").innerText(), /ASTRO BOT/);
  assert(
    await app.evaluate(
      (src) =>
        new Promise((resolve) => {
          const image = new Image();
          image.onload = () => resolve(image.naturalWidth > 0);
          image.onerror = () => resolve(false);
          image.src = src;
          document.body.append(image);
        }),
      cover,
    ),
  );
  await app.evaluate(
    () =>
      new Promise((resolve, reject) => {
        const image = new Image();
        image.onload = () => resolve(true);
        image.onerror = reject;
        image.src = "/favicon.svg";
        document.body.append(image);
      }),
  );
  await app
    .getByRole("link", { name: "Documentation", exact: true })
    .first()
    .click();
  await app.waitForURL("**/docs");
  await app
    .getByRole("heading", { name: "Installation", exact: true })
    .waitFor();
  console.log(
    "PASS production shell, lazy routes, fonts, visited reports and cached images work offline after a reload",
  );
  await offline.close();
} finally {
  await browser.close();
}
