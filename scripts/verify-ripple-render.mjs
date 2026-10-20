import { chromium } from "playwright";
import fs from "node:fs/promises";
import assert from "node:assert/strict";
const browser = await chromium.launch({
  executablePath:
    process.platform === "win32"
      ? "C:/Program Files/Google/Chrome/Application/chrome.exe"
      : undefined,
});
try {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
    colorScheme: "light",
  });
  const page = await context.newPage();
  const cdp = await context.newCDPSession(page);
  const traceEvents = [];
  cdp.on("Tracing.dataCollected", ({ value }) => traceEvents.push(...value));
  page.on("pageerror", (e) => console.log("ERROR", e.message));
  await page.goto("http://127.0.0.1:5173/");
  await page.waitForTimeout(1500);
  await fs.mkdir(".impeccable/review/compositor-ripple", { recursive: true });
  await cdp.send("Tracing.start", {
    categories: "devtools.timeline,blink.animations",
  });
  for (const scenario of [
    { width: 1440, scroll: 0 },
    { width: 768, scroll: 0 },
    { width: 390, scroll: 0 },
    { width: 1440, scroll: 900 },
  ]) {
    await page.setViewportSize({ width: scenario.width, height: 1000 });
    await cdp.send("Emulation.setCPUThrottlingRate", {
      rate: scenario.scroll ? 4 : 1,
    });
    await page.evaluate((y) => window.scrollTo(0, y), scenario.scroll);
    for (const next of ["dark", "light"]) {
      if (scenario.scroll)
        await page.evaluate(() =>
          document.querySelector(".theme-toggle").click(),
        );
      else
        await page
          .getByRole("button", { name: `Switch to ${next} mode`, exact: true })
          .click();
      await page.waitForFunction(() =>
        document
          .getAnimations()
          .some(
            (a) =>
              a.effect?.pseudoElement ===
                "::view-transition-group(theme-incoming)" &&
              a.playState === "running" &&
              a.currentTime > 50,
          ),
      );
      await page.evaluate(() => {
        for (const a of document.getAnimations())
          if (a.effect?.pseudoElement?.includes("theme-incoming")) {
            a.pause();
            a.currentTime = 300;
          }
      });
      await page.evaluate(
        () =>
          new Promise((resolve) =>
            requestAnimationFrame(() => requestAnimationFrame(resolve)),
          ),
      );
      const geometry = await page.evaluate(() =>
        [
          "::view-transition-group(theme-incoming)",
          "::view-transition-image-pair(theme-incoming)",
          "::view-transition-new(theme-incoming)",
        ].map((p) => {
          const s = getComputedStyle(document.documentElement, p);
          return {
            pseudo: p,
            transform: s.transform,
            left: s.left,
            top: s.top,
            width: s.width,
            height: s.height,
            origin: s.transformOrigin,
          };
        }),
      );
      assert.equal(geometry[0].transform, "matrix(0.5, 0, 0, 0.5, 0, 0)");
      assert.equal(geometry[1].transform, "matrix(2, 0, 0, 2, 0, 0)");
      assert.equal(
        geometry[1].origin,
        next === "dark" ? "0px 0px" : `${scenario.width}px 1000px`,
      );
      await page.screenshot({
        path: `.impeccable/review/compositor-ripple/${scenario.width}-${scenario.scroll}-${next}-mid.png`,
      });
      await page.evaluate(() => {
        for (const a of document.getAnimations())
          if (a.effect?.pseudoElement?.includes("theme-incoming")) a.play();
      });
      await page.waitForFunction(
        () => !document.documentElement.dataset.themeRipple,
      );
      await page.screenshot({
        path: `.impeccable/review/compositor-ripple/${scenario.width}-${scenario.scroll}-${next}-end.png`,
      });
      assert.equal(await page.evaluate(() => scrollY), scenario.scroll);
    }
  }
  const complete = new Promise((resolve) =>
    cdp.once("Tracing.tracingComplete", resolve),
  );
  await cdp.send("Tracing.end");
  await complete;
  const animations = traceEvents.filter((event) => event.name === "Animation");
  await fs.writeFile(
    ".impeccable/review/compositor-ripple/animation-trace.json",
    JSON.stringify(animations),
  );
  const owners = new Map();
  let compositingChecks = 0;
  for (const event of animations.sort((a, b) => a.ts - b.ts)) {
    const key = `${event.pid}:${event.tid}:${event.id2?.local}`;
    const data = event.args?.data;
    if (data?.nodeName) owners.set(key, data.nodeName);
    if (
      event.ph === "n" &&
      owners.get(key)?.includes("theme-incoming") &&
      data
    ) {
      assert.equal(
        data.compositeFailed ?? 0,
        0,
        "Ripple transforms must be composited",
      );
      compositingChecks++;
    }
  }
  assert(compositingChecks > 0);
  console.log(
    `PASS both circular reveals preserve page geometry; ${compositingChecks} Chrome compositing checks show no failures`,
  );
} finally {
  await browser.close();
}
