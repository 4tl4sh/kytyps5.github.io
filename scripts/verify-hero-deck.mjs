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
const base = process.env.PREVIEW_URL ?? "http://127.0.0.1:5173";
await fs.mkdir(".impeccable/review/deck", { recursive: true });
try {
  const context = await browser.newContext({
    reducedMotion: "reduce",
    viewport: { width: 1440, height: 1000 },
  });
  const page = await context.newPage();
  await page.clock.install();
  await page.goto(base);
  await page.locator(".caption-chip-title").waitFor();
  const slots = () =>
    page
      .locator(".hero-deck-card")
      .evaluateAll((cards) =>
        Object.fromEntries(
          cards.map((card) => [card.dataset.game, card.dataset.slot]),
        ),
      );
  const before = await slots();
  assert(
    Object.values(before).includes("left"),
    "The hero must contain actual cards in left, center, right and behind positions",
  );
  const gameAt = (map, slot) =>
    Object.keys(map).find((key) => map[key] === slot);
  const oldLeft = gameAt(before, "left"),
    oldCenter = gameAt(before, "center"),
    oldRight = gameAt(before, "right"),
    incoming = gameAt(before, "incoming");
  await page
    .locator('.hero-deck-card[data-slot="center"]')
    .evaluate((card) => (card.dataset.persistentNode = "true"));
  await page.clock.fastForward(6600);
  const after = await slots();
  assert.equal(after[oldLeft], "behind");
  assert.equal(after[oldCenter], "left");
  assert.equal(after[oldRight], "center");
  assert.equal(after[incoming], "right");
  assert.equal(
    await page
      .locator(`.hero-deck-card[data-game="${oldCenter}"]`)
      .getAttribute("data-persistent-node"),
    "true",
  );
  console.log(
    "PASS physical card identities persist through left → behind, center → left, right → center, behind → right",
  );
  await page
    .getByRole("button", { name: "Pause game slideshow", exact: true })
    .click();
  const paused = await slots();
  await page.clock.fastForward(20000);
  assert.deepEqual(await slots(), paused);
  await page
    .getByRole("button", { name: "Play game slideshow", exact: true })
    .click();
  await page.clock.fastForward(6600);
  assert.notDeepEqual(await slots(), paused);
  const choice = page
    .locator('.hero-carousel-controls button[aria-label^="Show "]')
    .last();
  const choiceTitle = (await choice.getAttribute("aria-label")).slice(5);
  await choice.click();
  assert.equal(
    await page
      .locator('.hero-deck-card[data-slot="center"]')
      .getAttribute("data-title"),
    choiceTitle,
  );
  assert.equal(
    await page.locator(".caption-chip-title").innerText(),
    choiceTitle,
  );
  console.log(
    "PASS pause/resume and direct selection retain the same card stack",
  );
  await context.close();

  const motion = await browser.newContext({
    reducedMotion: "no-preference",
    colorScheme: "dark",
    viewport: { width: 1440, height: 1000 },
  });
  const moving = await motion.newPage();
  await moving.goto(base);
  await moving.locator('.hero-deck-card[data-slot="center"]').waitFor();
  await moving.evaluate(() => document.fonts.ready);
  await moving
    .getByRole("button", { name: "Pause game slideshow", exact: true })
    .click();
  await moving.waitForTimeout(400);
  await moving
    .locator(".hero-deck-card img")
    .evaluateAll((images) =>
      Promise.all(images.map((image) => image.decode().catch(() => {}))),
    );
  const movingId = await moving
    .locator('.hero-deck-card[data-slot="right"]')
    .getAttribute("data-game");
  const originalRect = await moving
    .locator(`.hero-deck-card[data-game="${movingId}"]`)
    .boundingBox();
  await moving.screenshot({ path: ".impeccable/review/deck/before.png" });
  await moving
    .locator('.hero-deck-card[data-slot="right"] .hero-deck-select')
    .click();
  await moving.waitForTimeout(300);
  const midway = await moving
    .locator(`.hero-deck-card[data-game="${movingId}"]`)
    .boundingBox();
  assert(
    midway.x < originalRect.x - 10,
    "The right card must physically travel towards the middle",
  );
  await moving.screenshot({ path: ".impeccable/review/deck/midway.png" });
  await moving.waitForTimeout(850);
  const endRect = await moving
    .locator(`.hero-deck-card[data-game="${movingId}"]`)
    .boundingBox();
  assert(
    endRect.width > originalRect.width + 20,
    "The new center card must grow into the foreground",
  );
  assert.match(
    await moving
      .locator('.hero-deck-card[data-slot="center"] a')
      .getAttribute("href"),
    /\/game\//,
  );
  await moving.screenshot({ path: ".impeccable/review/deck/after.png" });
  console.log("PASS real animation moves the right card into the foreground");
  for (const width of [1440, 1024, 768, 390, 320]) {
    await moving.setViewportSize({ width, height: 1000 });
    await moving.waitForTimeout(200);
    assert.equal(
      await moving.evaluate(
        () => document.documentElement.scrollWidth > innerWidth + 1,
      ),
      false,
    );
    for (const slot of ["center", "left", "right"]) {
      const box = await moving
        .locator(`.hero-deck-card[data-slot="${slot}"]`)
        .boundingBox();
      assert(box && box.width > 100);
    }
    const controls = await moving
      .locator(".hero-carousel-controls")
      .boundingBox();
    assert(
      controls.x >= 0 && controls.x + controls.width <= width,
      "All slide controls fit the viewport",
    );
    await moving.screenshot({
      path: `.impeccable/review/deck/width-${width}.png`,
    });
  }
  console.log(
    "PASS responsive stack and controls fit desktop, tablet and phone",
  );
  await motion.close();
} finally {
  await browser.close();
}
