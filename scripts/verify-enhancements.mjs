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
try {
  const context = await browser.newContext({
    reducedMotion: "reduce",
    viewport: { width: 1440, height: 1000 },
  });
  const page = await context.newPage();
  await page.clock.install();
  await page.goto(base);
  await page.locator(".caption-chip-title").waitFor();
  const initial = await page.locator(".caption-chip-title").innerText();
  await page.clock.fastForward(7000);
  assert.notEqual(
    await page.locator(".caption-chip-title").innerText(),
    initial,
    "Hero must automatically advance even when reduced motion is enabled",
  );
  console.log("PASS hero advances automatically with reduced motion");
  await page
    .getByRole("button", { name: "Pause game slideshow", exact: true })
    .click();
  const paused = await page.locator(".caption-chip-title").innerText();
  await page.clock.fastForward(14000);
  assert.equal(await page.locator(".caption-chip-title").innerText(), paused);
  await page
    .getByRole("button", { name: "Play game slideshow", exact: true })
    .click();
  await page.clock.fastForward(7000);
  assert.notEqual(
    await page.locator(".caption-chip-title").innerText(),
    paused,
  );
  console.log("PASS pause and resume preserve automatic rotation");
  await page.clock.resume();

  await page
    .getByRole("button", { name: "Switch to dark mode", exact: true })
    .click();
  assert.equal(await page.locator("html").getAttribute("data-theme"), "dark");
  await page.reload();
  await page.locator(".caption-chip-title").waitFor();
  assert.equal(await page.locator("html").getAttribute("data-theme"), "dark");
  await page
    .getByRole("link", { name: "Compatibility", exact: true })
    .first()
    .click();
  await page.waitForURL("**/compatibility");
  await page.locator(".game-table-row").first().waitFor();
  assert.equal(await page.locator("html").getAttribute("data-theme"), "dark");
  console.log("PASS dark mode persists across reload and navigation");

  const games = JSON.parse(
    await fs.readFile("src/data/compat-index.json", "utf8"),
  );
  const statusNames = ["in-game", "main-menu", "logo", "doesnt-boot"];
  for (const status of statusNames) {
    const expected = games.filter((g) => g.overall === status).length;
    const segment = page.locator(
      `.compatibility-segment[data-status="${status}"]`,
    );
    assert.equal(Number(await segment.getAttribute("data-count")), expected);
  }
  assert.equal(
    await page.locator(".compatibility-summary").getAttribute("data-total"),
    String(games.length),
  );
  await page.locator(".compatibility-legend").getByRole("link").first().click();
  await page.waitForURL("**/compatibility?status=in-game");
  await page.waitForFunction(() =>
    document
      .querySelector('.status-filters button[aria-pressed="true"]')
      ?.textContent.startsWith("In game"),
  );
  await page.locator(".game-table-row").first().waitFor();
  assert.equal(
    await page.locator(".game-table-row .status:not(.status-in-game)").count(),
    0,
  );
  await page
    .getByLabel("Operating system", { exact: true })
    .selectOption("linux");
  await page.waitForFunction(() =>
    document.querySelector('.compatibility-segment[data-status="untested"]'),
  );
  assert.equal(
    Number(
      await page
        .locator('.compatibility-segment[data-status="untested"]')
        .getAttribute("data-count"),
    ),
    games.filter((g) => !g.os.linux).length,
  );
  console.log(
    "PASS compatibility segments match real counts, filter links and untested platform totals",
  );

  await fs.mkdir(".impeccable/review/enhancements", { recursive: true });
  for (const theme of ["dark", "light"]) {
    await page.evaluate((theme) => {
      localStorage.setItem("kyty-theme", theme);
    }, theme);
    for (const width of [1440, 768, 390]) {
      await page.setViewportSize({ width, height: 1000 });
      for (const path of [
        "/",
        "/compatibility",
        "/download",
        "/docs",
        "/game/PPSA21564",
      ]) {
        await page.goto(base + path);
        await page.locator("main h1").waitFor();
        await page.evaluate(() => document.fonts.ready);
        if (path.startsWith("/game/")) await page.locator(".report").waitFor();
        assert.equal(
          await page.evaluate(
            () => document.documentElement.scrollWidth > innerWidth + 1,
          ),
          false,
          `${theme} ${width} ${path}: overflow`,
        );
        if (path === "/" || path === "/compatibility") {
          for (
            let y = 0;
            y <
            (await page.evaluate(() => document.documentElement.scrollHeight));
            y += 800
          ) {
            await page.evaluate((y) => window.scrollTo(0, y), y);
            await page.waitForTimeout(70);
          }
          await page.evaluate(() => window.scrollTo(0, 0));
          await page.waitForTimeout(450);
          await page.screenshot({
            path: `.impeccable/review/enhancements/${theme}-${width}-${path === "/" ? "home" : "compatibility"}.png`,
            fullPage: true,
          });
        }
      }
    }
  }
  console.log(
    "PASS both themes render without overflow across desktop, tablet and phone",
  );
  await context.close();

  const system = await browser.newContext({ colorScheme: "dark" });
  const systemPage = await system.newPage();
  await systemPage.goto(base);
  await systemPage.locator("h1").waitFor();
  assert.equal(
    await systemPage.locator("html").getAttribute("data-theme"),
    "dark",
  );
  console.log("PASS first visit follows system dark-mode preference");
  const originalSlide = await systemPage
    .locator(".caption-chip-title")
    .innerText();
  await systemPage.waitForTimeout(7000);
  assert.notEqual(
    await systemPage.locator(".caption-chip-title").innerText(),
    originalSlide,
  );
  console.log("PASS normal-motion slideshow advances on a real timer");
  await system.close();
} finally {
  await browser.close();
}
