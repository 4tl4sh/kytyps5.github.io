import assert from "node:assert/strict";
import { readFile, mkdir } from "node:fs/promises";
import { chromium } from "playwright";

const base = process.env.PREVIEW_URL ?? "http://127.0.0.1:5173";
const index = JSON.parse(
  await readFile("public/data/compat-index.json", "utf8"),
);
const original = JSON.parse(
  await readFile("public/data/compat/PPSA21564.json", "utf8"),
);
const current = {
  ...original.reports.find((report) => report.os === "windows"),
  status: "logo",
  gameVersion: "01.019.000",
};
const peak = {
  ...current,
  status: "in-game",
  gameVersion: "01.007.000",
  testedVersion:
    "Earlier emulator [build](https://github.com/KytyPS5/KytyPS5/releases)",
  testedDate: "2026-09-01",
  recordUrl:
    "https://github.com/KytyPS5/kytyps5.github.io/blob/424e4acf41cc0b93b2d770e879c4107efe60a299/src/content/compat/astro-bot-windows.md",
};
let response = {
  ...original,
  reports: original.reports.map((report) =>
    report.os === "windows" ? current : report,
  ),
  previousBest: { windows: peak },
};
const browser = await chromium.launch({
  executablePath:
    process.env.CHROME_PATH ??
    (process.platform === "win32"
      ? "C:/Program Files/Google/Chrome/Application/chrome.exe"
      : undefined),
});
const evidence = ".impeccable/review/regressions";
await mkdir(evidence, { recursive: true });
try {
  const context = await browser.newContext({
    reducedMotion: "reduce",
    serviceWorkers: "block",
    viewport: { width: 1440, height: 1000 },
  });
  await context.route("**/data/compat/PPSA21564.json", (route) =>
    route.fulfill({ json: response }),
  );
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.clock.install();
  await page.goto(`${base}/game/PPSA21567`);
  const notice = page.getByRole("complementary", {
    name: "Windows compatibility history",
    exact: true,
  });
  await notice.waitFor();
  assert((await notice.innerText()).includes("01.007.000"));
  assert((await notice.innerText()).includes("Logo"));
  assert((await notice.innerText()).includes("In game"));
  await notice.locator("summary").click();
  assert((await notice.innerText()).includes("Earlier emulator"));
  assert.equal(
    await notice
      .getByRole("link", { name: "View the earlier report", exact: true })
      .getAttribute("href"),
    peak.recordUrl,
  );
  await page.getByRole("tab", { name: "Linux", exact: true }).click();
  await page
    .getByRole("heading", { name: "Linux test report", exact: true })
    .waitFor();
  assert.equal(await page.locator(".regression-notice").count(), 0);
  await page.getByRole("tab", { name: "Windows", exact: true }).click();
  await page
    .getByRole("heading", { name: "Windows test report", exact: true })
    .waitFor();
  await notice.waitFor();
  await page.clock.runFor(1000);
  for (const theme of ["light", "dark"])
    for (const width of [1440, 768, 390]) {
      await page.setViewportSize({ width, height: width === 390 ? 844 : 1000 });
      if (
        (await page.evaluate(() => document.documentElement.dataset.theme)) !==
        theme
      )
        await page
          .getByRole("button", { name: `Switch to ${theme} mode`, exact: true })
          .click();
      await notice.scrollIntoViewIfNeeded();
      await page.clock.runFor(350);
      await page.evaluate(() => document.fonts.ready);
      await page.waitForFunction(() => {
        let element = document.querySelector(".regression-notice");
        if (!element) return false;
        while (element) {
          if (Number(getComputedStyle(element).opacity) < 0.999) return false;
          element = element.parentElement;
        }
        return true;
      });
      assert.equal(
        await page.evaluate(
          () => document.documentElement.scrollWidth > innerWidth + 1,
        ),
        false,
      );
      await page.screenshot({
        path: `${evidence}/notice-${theme}-${width}.png`,
      });
    }
  response = {
    ...response,
    reports: response.reports.map((report) =>
      report.os === "windows" ? { ...report, status: "in-game" } : report,
    ),
  };
  await page.clock.fastForward(301000);
  await page.waitForFunction(
    () =>
      document
        .querySelector(".report-heading")
        ?.textContent.includes("In game") &&
      !document.querySelector(".regression-notice"),
  );
  response = {
    ...response,
    reports: response.reports.map((report) =>
      report.os === "windows" ? { ...report, status: "main-menu" } : report,
    ),
    previousBest: { windows: { ...peak, gameVersion: undefined } },
  };
  await page.clock.fastForward(301000);
  await notice
    .getByText("(game version not recorded)", { exact: false })
    .waitFor();
  response = { ...response, previousBest: {} };
  await page.clock.fastForward(301000);
  await notice.waitFor({ state: "detached" });
  assert.deepEqual(errors, []);
  await context.close();
  console.log(
    "PASS versioned regression notes, platform isolation, regional identity, recovery, unknown versions and live refresh across both themes and three widths",
  );

  const realContext = await browser.newContext({
    reducedMotion: "reduce",
    serviceWorkers: "block",
  });
  const realPage = await realContext.newPage();
  let count = 0;
  for (const game of index.games) {
    const detail = JSON.parse(
      await readFile(`public/data/compat/${game.key}.json`, "utf8"),
    );
    if (!detail.previousBest) continue;
    await realPage.goto(`${base}/game/${game.key}`);
    for (const os of Object.keys(detail.previousBest)) {
      await realPage
        .getByRole("tab", {
          name: { windows: "Windows", linux: "Linux", macos: "macOS" }[os],
          exact: true,
        })
        .click();
      await realPage.locator(".regression-notice").waitFor();
      count++;
    }
  }
  assert(
    count > 0,
    "Existing committed report history should provide real regressions",
  );
  await realContext.close();
  console.log(
    `PASS ${count} actual historical declines display their preserved earlier report evidence`,
  );
} finally {
  await browser.close();
}
