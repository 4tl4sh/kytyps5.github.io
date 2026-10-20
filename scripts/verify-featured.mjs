import { chromium } from "playwright";
import assert from "node:assert/strict";
import fs from "node:fs/promises";

const base = process.env.PREVIEW_URL ?? "http://127.0.0.1:5173";
const index = JSON.parse(
  await fs.readFile("public/data/compat-index.json", "utf8"),
);
const nextTestDate = new Date(
  Math.max(...index.games.map((game) => Date.parse(game.latestTested))) +
    86_400_000,
)
  .toISOString()
  .slice(0, 10);
const browser = await chromium.launch({
  executablePath:
    process.env.CHROME_PATH ??
    (process.platform === "win32"
      ? "C:/Program Files/Google/Chrome/Application/chrome.exe"
      : undefined),
});
await fs.mkdir(".impeccable/review/featured", { recursive: true });
try {
  const context = await browser.newContext({
    serviceWorkers: "block",
    reducedMotion: "reduce",
    viewport: { width: 1440, height: 1000 },
  });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  let refreshed = false;
  const next = structuredClone(index);
  for (const [key, cover] of [
    ["AUDIT-NO-ART", undefined],
    ["AUDIT-BLANK-ART", "   "],
  ]) {
    next.games.push({
      ...index.games[0],
      key,
      title: key,
      cover,
      latestTested: "2099-12-31",
      latestReport: undefined,
      screenshots: [],
    });
  }
  const game = next.games.find((g) => g.key === "PPSA21564");
  game.latestTested = nextTestDate;
  game.latestReport = { os: "macos", testedDate: nextTestDate };
  game.os.macos = "doesnt-boot";
  game.overall = "in-game"; // Latest macOS report differs from best overall progress.
  game.screenshots = [
    {
      title: game.title,
      screenshot: `${base}/images/kitty-still-v2.png`,
      testedDate: nextTestDate,
      os: "macos",
    },
  ];
  await page.route("**/data/compat-index.json", (route) =>
    route.fulfill({ json: refreshed ? next : index }),
  );
  await page.goto(base);
  await page.locator(".hero-deck-card").first().waitFor();
  const expected = index.games
    .filter((g) => Boolean(g.cover?.trim()))
    .sort(
      (a, b) =>
        b.latestTested.localeCompare(a.latestTested) ||
        a.key.localeCompare(b.key),
    )
    .slice(0, 9);
  assert.deepEqual(
    await page
      .locator(".hero-deck-card")
      .evaluateAll((cards) => cards.map((c) => c.dataset.game)),
    expected.map((g) => g.key),
  );
  assert.deepEqual(
    await page
      .locator(".carousel-track .game-card")
      .evaluateAll((cards) =>
        cards.map((c) => c.getAttribute("href").split("/").pop()),
      ),
    expected.map((g) => g.key),
  );
  assert.equal(
    await page
      .locator('.hero-deck-card[data-slot="center"]')
      .getAttribute("data-game"),
    expected[0].key,
  );
  assert.equal(
    await page
      .locator(".featured-report-meta time")
      .first()
      .getAttribute("datetime"),
    expected[0].latestTested,
  );
  console.log(
    "PASS hero and featured collection are the nine newest tested titles with artwork in date order",
  );
  refreshed = true;
  await page.evaluate(async () => {
    const resource = performance
      .getEntriesByType("resource")
      .find((entry) => new URL(entry.name).pathname === "/src/lib/cache.ts");
    const { cachedJson } = await import(resource?.name ?? "/src/lib/cache.ts");
    await cachedJson("/data/compat-index.json", { force: true });
    document.dispatchEvent(new Event("visibilitychange"));
  });
  await page
    .locator('.hero-deck-card[data-slot="center"][data-game="PPSA21564"]')
    .waitFor();
  assert.equal(
    await page
      .locator('.hero-deck-card[data-game="PPSA21564"] .status')
      .innerText(),
    "Doesn’t boot",
  );
  const card = page.locator(".carousel-track .game-card").first();
  assert.equal(await page.locator(".hero-deck-card").count(), 9);
  assert.equal(await page.locator(".carousel-track .game-card").count(), 9);
  assert.equal(
    await page.locator('.hero-deck-card[data-game^="AUDIT-"]').count(),
    0,
    "Newer titles without artwork must be skipped before taking nine",
  );
  assert.equal(await card.getAttribute("href"), "/game/PPSA21564");
  assert.equal(await card.locator(".status").innerText(), "Doesn’t boot");
  assert(
    (await card.locator(".featured-report-meta").innerText()).includes("macOS"),
  );
  assert.equal(
    await card.locator("time").getAttribute("datetime"),
    nextTestDate,
  );
  await page.locator(".capture-selector button").first().waitFor();
  assert.equal(
    await page.locator(".capture-selector button").first().innerText(),
    game.title,
  );
  await page.locator(".capture-top .status-doesnt-boot").waitFor();
  const selects = page.locator(".capture-selector button");
  for (let i = 0; i < (await selects.count()); i++) {
    const choice = selects.nth(i),
      title = await choice.innerText();
    await choice.click();
    assert((await page.locator(".capture-bottom").innerText()).includes(title));
  }
  console.log(
    "PASS an updated title moves into all featured sections without navigation; badges show latest report platform/status and selectors keep correct captures",
  );
  for (const [theme, width] of [
    ["light", 1440],
    ["dark", 390],
  ]) {
    await page.setViewportSize({ width, height: 900 });
    await page.evaluate(
      (theme) => (document.documentElement.dataset.theme = theme),
      theme,
    );
    await page.evaluate(() => scrollTo({ top: 0, behavior: "instant" }));
    assert(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth + 1,
      ),
    );
    await page.screenshot({
      path: `.impeccable/review/featured/${theme}-${width}.png`,
    });
    await card.scrollIntoViewIfNeeded();
    await page.screenshot({
      path: `.impeccable/review/featured/cards-${theme}-${width}.png`,
    });
  }
  assert.deepEqual(errors, []);
  await context.close();
} finally {
  await browser.close();
}
