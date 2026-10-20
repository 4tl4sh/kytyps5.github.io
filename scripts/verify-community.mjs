import assert from "node:assert/strict";
import { readFile, mkdir, writeFile, rm } from "node:fs/promises";
import { createHash, randomUUID } from "node:crypto";
import path from "node:path";
import { chromium } from "playwright";

const base = process.env.PREVIEW_URL ?? "http://127.0.0.1:5173";
const index = JSON.parse(
  await readFile("public/data/compat-index.json", "utf8"),
);
const catalog = JSON.parse(await readFile("public/data/catalog.json", "utf8"));
const report = JSON.parse(
  await readFile("public/data/compat/PPSA21564.json", "utf8"),
);
const astro = index.games.find((game) => game.key === "PPSA21564");
const game = {
  key: astro.key,
  titleId: "PPSA21567",
  title: astro.title,
  cover: astro.cover,
};
const zip = Buffer.from("504b0506000000000000000000000000000000000000", "hex");
const digest = createHash("sha256").update(zip).digest("hex");
const fixtureName = `.browser-test-${randomUUID()}`;
const fixtureDirectory = path.resolve("public/patch-files", fixtureName);
assert.equal(
  path.dirname(fixtureDirectory),
  path.resolve("public/patch-files"),
);
await mkdir(fixtureDirectory, { recursive: true });
await writeFile(path.join(fixtureDirectory, "fix one.zip"), zip);
await writeFile(path.join(fixtureDirectory, "second.zip"), zip);
const file = {
  name: "fix one.zip",
  size: zip.length,
  sha256: digest,
  url: `/patch-files/${fixtureName}/fix%20one.zip?v=${digest.slice(0, 16)}`,
};
const fork = {
  repositoryId: 1,
  repository: "fixture/game-fork",
  url: "https://github.com/fixture/game-fork",
  description: "A focused community build.",
  targetTitleIds: ["PPSA21567"],
  games: [game],
  archived: false,
  addedAt: "2026-10-20",
  updatedAt: "2026-10-20",
  addedBy: "fixture",
  sourceUrl: "https://github.com/fixture/site/issues/1",
};
const resources = {
  version: 1,
  forks: [
    fork,
    {
      ...fork,
      repositoryId: 2,
      repository: "fixture/no-targets",
      url: "https://github.com/fixture/no-targets",
      targetTitleIds: [],
      games: [],
    },
  ],
  patchCollections: [
    {
      titleId: "PPSA21567",
      game,
      patches: [
        {
          id: "PPSA21567/Launch fix",
          name: "Launch fix",
          description:
            "# Installation\n\nUse the matching game build.\n\n[Read on GitHub](notes.md)\n\n[Relative ZIP](./fix%20one.zip) · [Encoded ZIP](fix%20one.zip) · [Bare ZIP](second.zip)\n\n[Parent ZIP](../second.zip) · [Nested ZIP](folder%2Fsecond.zip)\n\n<script>window.PATCH_XSS=true</script>",
          files: [
            file,
            {
              ...file,
              name: "second.zip",
              url: file.url.replace("fix%20one.zip", "second.zip"),
            },
          ],
        },
      ],
    },
  ],
};
const browser = await chromium.launch({
  executablePath:
    process.env.CHROME_PATH ??
    (process.platform === "win32"
      ? "C:/Program Files/Google/Chrome/Application/chrome.exe"
      : undefined),
});
const evidence = ".impeccable/review/community";
await mkdir(evidence, { recursive: true });
try {
  const context = await browser.newContext({
    reducedMotion: "reduce",
    serviceWorkers: "block",
    viewport: { width: 1440, height: 1000 },
  });
  const page = await context.newPage(),
    errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.clock.install();
  let response = resources,
    failResources = false,
    replaceReport = false,
    removeReport = false;
  await context.route("**/data/community.json", (route) =>
    failResources
      ? route.fulfill({ status: 503, body: "Unavailable" })
      : route.fulfill({ json: response }),
  );
  await context.route("**/data/compat-index.json", (route) =>
    route.fulfill({
      json: removeReport
        ? {
            ...index,
            games: index.games.filter((game) => game.key !== astro.key),
          }
        : index,
    }),
  );
  await context.route("**/data/compat/PPSA21564.json", (route) =>
    route.fulfill({
      json: replaceReport
        ? {
            ...report,
            reports: [
              {
                ...report.reports[0],
                notes: "REPLACED REPORT CONTENT",
                status: "logo",
              },
            ],
          }
        : report,
    }),
  );
  await context.route("**/patch-files/**", (route) =>
    route.fulfill({ body: zip, contentType: "application/zip" }),
  );
  await page.goto(`${base}/patches`);
  await page
    .getByRole("heading", { name: "Launch fix", exact: true })
    .waitFor();
  assert.equal(
    await page.locator("h1").count(),
    1,
    "Markdown headings must not add another page h1",
  );
  assert.equal(await page.evaluate(() => Boolean(window.PATCH_XSS)), false);
  for (const name of ["Relative ZIP", "Encoded ZIP", "Bare ZIP"]) {
    const link = page.getByRole("link", { name, exact: true });
    const expected =
      name === "Bare ZIP"
        ? resources.patchCollections[0].patches[0].files[1]
        : file;
    assert.equal(await link.getAttribute("href"), expected.url);
    assert.equal(await link.getAttribute("download"), expected.name);
  }
  for (const name of ["Parent ZIP", "Nested ZIP"])
    assert.equal(
      await page
        .getByRole("link", { name, exact: true })
        .getAttribute("download"),
      null,
    );
  assert(
    (
      await page
        .getByRole("link", { name: "Read on GitHub" })
        .getAttribute("href")
    ).endsWith("/patches/PPSA21567/Launch%20fix/notes.md"),
  );
  const downloadPromise = page.waitForEvent("download");
  await page.locator(".community-downloads a").first().click();
  const download = await downloadPromise;
  assert.equal(download.suggestedFilename(), file.name);
  await download.saveAs(`${evidence}/download.zip`);
  assert.deepEqual(await readFile(`${evidence}/download.zip`), zip);
  await page
    .getByRole("searchbox", { name: "Search patches" })
    .fill("not-present");
  await page
    .getByRole("heading", { name: "No patches match that search." })
    .waitFor();
  await page
    .getByRole("button", { name: "Clear search", exact: true })
    .first()
    .click();
  await page.locator(".community-downloads a").nth(1).waitFor();
  console.log(
    "PASS patch Markdown, regional identity, all ZIP downloads, search and safe rendering",
  );
  await page.goto(`${base}/forks`);
  await page.locator(".community-fork").nth(1).waitFor();
  await page.getByLabel("Fork game targets").selectOption("unassigned");
  assert.equal(await page.locator(".community-fork").count(), 1);
  assert(
    (await page.locator(".community-fork").innerText()).includes(
      "fixture/no-targets",
    ),
  );
  await page.getByLabel("Fork game targets").selectOption("targeted");
  assert.equal(await page.locator(".community-fork").count(), 1);
  assert(
    (await page.locator(".community-fork").innerText()).includes(
      "fixture/game-fork",
    ),
  );
  await page.goto(`${base}/game/PPSA21567`);
  const gameResources = page.locator(".game-community-resources");
  await gameResources
    .getByRole("heading", { name: "Launch fix", exact: true })
    .waitFor();
  assert.equal(await gameResources.locator(".community-fork").count(), 1);
  assert(!(await gameResources.innerText()).includes("fixture/no-targets"));
  assert.equal(
    await page.locator(".report .game-community-resources").count(),
    0,
  );
  await page.getByRole("tab", { name: "Linux", exact: true }).click();
  assert.equal(await gameResources.locator(".community-patch").count(), 1);
  replaceReport = true;
  await page.clock.fastForward(301000);
  await page.getByText("REPLACED REPORT CONTENT", { exact: true }).waitFor();
  assert.equal(await gameResources.locator(".community-patch").count(), 1);
  assert.equal(await gameResources.locator(".community-fork").count(), 1);
  console.log(
    "PASS only explicitly targeted forks appear on regional game pages; associations survive report replacement and OS changes",
  );

  const noReportContext = await browser.newContext({
    reducedMotion: "reduce",
    serviceWorkers: "block",
  });
  await noReportContext.route("**/data/community.json", (route) =>
    route.fulfill({ json: resources }),
  );
  await noReportContext.route("**/data/compat-index.json", (route) =>
    route.fulfill({
      json: {
        ...index,
        games: index.games.filter((game) => game.key !== astro.key),
      },
    }),
  );
  const noReportPage = await noReportContext.newPage();
  await noReportPage.goto(`${base}/game/PPSA21564`);
  await noReportPage
    .getByRole("link", { name: /Submit the first report/ })
    .waitFor();
  await noReportPage
    .locator(".game-community-resources .community-patch")
    .waitFor();
  assert.equal(
    await noReportPage
      .locator(".game-community-resources .community-fork")
      .count(),
    1,
  );
  await noReportContext.close();
  console.log(
    "PASS associations remain available when a compatibility report is removed",
  );

  const uncatalogedId = "PPSA99998";
  assert(
    !catalog.some(
      (game) =>
        game.titleId === uncatalogedId ||
        game.allTitleIds?.includes(uncatalogedId),
    ),
  );
  assert(!index.games.some((game) => game.key === uncatalogedId));
  const uncatalogedGame = {
    key: uncatalogedId,
    titleId: uncatalogedId,
    title: uncatalogedId,
  };
  const uncatalogedResources = {
    ...resources,
    forks: [
      { ...fork, targetTitleIds: [uncatalogedId], games: [uncatalogedGame] },
    ],
    patchCollections: [
      {
        ...resources.patchCollections[0],
        titleId: uncatalogedId,
        game: uncatalogedGame,
      },
    ],
  };
  const uncatalogedContext = await browser.newContext({
    reducedMotion: "reduce",
    serviceWorkers: "block",
  });
  let finalReportRemoved = false;
  await uncatalogedContext.route("**/data/community.json", (route) =>
    route.fulfill({ json: uncatalogedResources }),
  );
  await uncatalogedContext.route("**/data/compat-index.json", (route) =>
    route.fulfill({
      json: {
        ...index,
        games: finalReportRemoved
          ? index.games
          : [
              ...index.games,
              {
                ...astro,
                key: uncatalogedId,
                titleId: uncatalogedId,
                allTitleIds: [uncatalogedId],
                title: uncatalogedId,
              },
            ],
      },
    }),
  );
  await uncatalogedContext.route(
    `**/data/compat/${uncatalogedId}.json`,
    (route) =>
      route.fulfill({
        json: {
          ...report,
          key: uncatalogedId,
          titleId: uncatalogedId,
          title: uncatalogedId,
          allTitleIds: [uncatalogedId],
        },
      }),
  );
  const uncatalogedPage = await uncatalogedContext.newPage();
  await uncatalogedPage.clock.install();
  await uncatalogedPage.goto(`${base}/game/${uncatalogedId}`);
  await uncatalogedPage.locator(".report").first().waitFor();
  await uncatalogedPage
    .locator(".game-community-resources .community-patch")
    .waitFor();
  finalReportRemoved = true;
  await uncatalogedPage.clock.fastForward(301000);
  await uncatalogedPage
    .getByRole("link", { name: /Submit the first report/ })
    .waitFor();
  assert.equal(await uncatalogedPage.locator("h1").innerText(), uncatalogedId);
  assert.equal(
    await uncatalogedPage
      .locator(".game-community-resources .community-patch")
      .count(),
    1,
  );
  assert.equal(
    await uncatalogedPage
      .locator(".game-community-resources .community-fork")
      .count(),
    1,
  );
  await uncatalogedPage.screenshot({
    path: `${evidence}/uncataloged-after-report-removal.png`,
    fullPage: true,
  });
  await uncatalogedPage.reload();
  await uncatalogedPage
    .locator(".game-community-resources .community-patch")
    .waitFor();
  assert.equal(await uncatalogedPage.locator("h1").innerText(), uncatalogedId);
  await uncatalogedContext.close();
  console.log(
    "PASS uncataloged games retain patch and fork pages after their final report is removed, including reload",
  );

  for (const theme of ["light", "dark"])
    for (const width of [1440, 768, 390]) {
      await context.addInitScript(
        (theme) => localStorage.setItem("kyty-theme", theme),
        theme,
      );
      await page.setViewportSize({ width, height: width === 390 ? 844 : 1000 });
      for (const route of ["patches", "forks", "game/PPSA21567"]) {
        await page.goto(`${base}/${route}`);
        await page
          .locator(route === "patches" ? ".community-patch" : ".community-fork")
          .first()
          .waitFor();
        await page.evaluate(() => document.fonts.ready);
        for (
          let y = 0;
          y <
          (await page.evaluate(() => document.documentElement.scrollHeight));
          y += 650
        ) {
          await page.evaluate((y) => window.scrollTo(0, y), y);
          await page.waitForTimeout(35);
        }
        await page.evaluate(() => window.scrollTo(0, 0));
        assert.equal(
          await page.evaluate(
            () => document.documentElement.scrollWidth > innerWidth + 1,
          ),
          false,
          `${theme} ${width} ${route}`,
        );
        await page.screenshot({
          path: `${evidence}/${route.replace("/", "-")}-${theme}-${width}.png`,
          fullPage: true,
        });
      }
    }
  await page.goto(`${base}/docs#community-resources`);
  await page
    .getByRole("heading", { name: "Patches and community forks", exact: true })
    .waitFor();
  assert(
    (await page.locator("#community-resources").innerText()).includes("/fork"),
  );
  assert(
    (await page.locator("#community-resources").innerText()).includes(
      "description.md",
    ),
  );
  response = { version: 1, forks: [], patchCollections: [] };
  const emptyContext = await browser.newContext({
    reducedMotion: "reduce",
    serviceWorkers: "block",
  });
  await emptyContext.route("**/data/community.json", (route) =>
    route.fulfill({ json: response }),
  );
  const emptyPage = await emptyContext.newPage();
  await emptyPage.goto(`${base}/forks`);
  await emptyPage
    .getByRole("heading", { name: "A place for new directions." })
    .waitFor();
  await emptyPage.goto(`${base}/patches`);
  await emptyPage
    .getByRole("heading", { name: "The next fix starts here." })
    .waitFor();
  await emptyContext.close();
  const errorContext = await browser.newContext({
    reducedMotion: "reduce",
    serviceWorkers: "block",
  });
  let broken = true;
  await errorContext.route("**/data/community.json", (route) =>
    broken
      ? route.fulfill({ status: 503 })
      : route.fulfill({ json: resources }),
  );
  const errorPage = await errorContext.newPage();
  await errorPage.goto(`${base}/patches`);
  await errorPage
    .getByText("Community resources couldn’t load.", { exact: false })
    .waitFor();
  broken = false;
  await errorPage
    .getByRole("button", { name: "Try again", exact: true })
    .click();
  await errorPage.locator(".community-patch").waitFor();
  await errorContext.close();
  assert.deepEqual(errors, []);
  console.log(
    "PASS responsive light/dark directories, maintenance documentation, honest empty states and retry recovery",
  );
  await context.close();
} finally {
  await browser.close();
  await rm(fixtureDirectory, { recursive: true, force: true });
}
