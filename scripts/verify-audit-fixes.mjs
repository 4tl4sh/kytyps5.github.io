import { chromium } from "playwright";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import { stripTypeScriptTypes } from "node:module";
import vm from "node:vm";

const base = process.env.PREVIEW_URL ?? "http://127.0.0.1:5173";
const evidence = ".impeccable/review/audit-fixes";
await fs.mkdir(evidence, { recursive: true });
const index = JSON.parse(
  await fs.readFile("public/data/compat-index.json", "utf8"),
);
const nextTestDate = new Date(
  Math.max(...index.games.map((game) => Date.parse(game.latestTested))) +
    86_400_000,
)
  .toISOString()
  .slice(0, 10);
const astro = JSON.parse(
  await fs.readFile("public/data/compat/PPSA21564.json", "utf8"),
);
const statuses = ["in-game", "main-menu", "logo", "doesnt-boot"];
for (const game of index.games) {
  const detail = JSON.parse(
    await fs.readFile(`public/data/compat/${game.key}.json`, "utf8"),
  );
  for (const os of ["windows", "linux", "macos"]) {
    const reports = detail.reports
      .filter((r) => r.os === os)
      .sort((a, b) => b.testedDate.localeCompare(a.testedDate));
    assert.equal(game.os[os], reports[0]?.status, `${game.key}/${os}`);
    assert.equal(game.reportCounts[os] ?? 0, reports.length);
  }
  assert.equal(
    game.overall,
    statuses.find((s) => Object.values(game.os).includes(s)),
  );
  assert(game.reportRevision?.length === 16);
  for (const capture of game.screenshots ?? []) assert(game.os[capture.os]);
}
assert(
  !(await fs.readFile("src/pages/Home.tsx", "utf8")).includes("showcase.json"),
);
console.log(
  `PASS all ${index.games.length} games match real per-OS reports; featured content has no fixed selection`,
);

// Run the real cache module with controlled response/disk ordering.
const originals = {
  fetch: globalThis.fetch,
  caches: globalThis.caches,
  location: globalThis.location,
};
try {
  const code = stripTypeScriptTypes(
    await fs.readFile("src/lib/cache.ts", "utf8"),
  );
  const stored = new Map();
  let pauseWrite;
  globalThis.location = { origin: "https://test.local" };
  globalThis.caches = {
    open: async () => ({
      match: async (url) => stored.get(url)?.clone(),
      put: async (url, response) => {
        if (pauseWrite) {
          const wait = pauseWrite;
          pauseWrite = null;
          await wait;
        }
        stored.set(url, response.clone());
      },
      keys: async () => [...stored.keys()],
      delete: async (url) => stored.delete(url),
    }),
  };
  const requests = [];
  globalThis.fetch = () => new Promise((resolve) => requests.push(resolve));
  let moduleId = 0;
  const load = () =>
    import(
      `data:text/javascript;base64,${Buffer.from(code + `\n// ${moduleId++}`).toString("base64")}`
    );
  const tick = () => new Promise((resolve) => setImmediate(resolve));
  const cache = await load();
  // Verify both memory and a fresh module's persistent read.
  const one = cache.cachedJson("/ordered");
  await tick();
  const resolveOne = requests.shift();
  const two = cache.cachedJson("/ordered", { force: true });
  await tick();
  const resolveTwo = requests.shift();
  resolveTwo(Response.json({ value: "new" }));
  await two;
  resolveOne(Response.json({ value: "old" }));
  await one;
  assert.equal((await cache.cachedJson("/ordered")).value, "new");
  assert.equal((await (await load()).cachedJson("/ordered")).value, "new");
  let releaseDisk;
  pauseWrite = new Promise((resolve) => {
    releaseDisk = resolve;
  });
  const diskOld = cache.cachedJson("/disk-order");
  await tick();
  requests.shift()(Response.json({ value: "old" }));
  await tick();
  const diskNew = cache.cachedJson("/disk-order", { force: true });
  await tick();
  requests.shift()(Response.json({ value: "new" }));
  await tick();
  releaseDisk();
  await Promise.all([diskOld, diskNew]);
  assert.equal((await (await load()).cachedJson("/disk-order")).value, "new");
  const firstVersion = cache.cachedJson("/versioned", { version: "a" });
  await tick();
  requests.shift()(Response.json({ value: "a" }));
  await firstVersion;
  const nextVersion = cache.cachedJson("/versioned", { version: "b" });
  await tick();
  requests.shift()(Response.json({ value: "b" }));
  assert.equal((await nextVersion).value, "b");
  console.log(
    "PASS manual refresh wins reversed responses and slow disk writes; content revisions bypass fresh TTL",
  );
} finally {
  Object.assign(globalThis, originals);
}

const worker = await fs.readFile("public/sw.js", "utf8");
for (const status of [429, 500, 503]) {
  const scope = {
    self: {
      addEventListener: () => {},
      location: { origin: "https://test.local" },
    },
    URL,
    Response,
    Request,
    Map,
    Date,
    fetch: async () => new Response("outage", { status }),
    caches: {
      open: async (name) => ({
        match: async () =>
          name.includes("meta")
            ? new Response("0")
            : new Response("saved image"),
      }),
    },
  };
  vm.createContext(scope);
  vm.runInContext(worker + "\nglobalThis.getImage = imageResponse;", scope);
  assert.equal(
    await (
      await scope.getImage(new Request("https://test.local/picture.png"))
    ).text(),
    "saved image",
  );
}
console.log("PASS expired images survive inspectable 429/5xx outages");

const browser = await chromium.launch({
  executablePath:
    process.env.CHROME_PATH ??
    (process.platform === "win32"
      ? "C:/Program Files/Google/Chrome/Application/chrome.exe"
      : undefined),
});
let failures = 0;
async function check(name, run, options = {}) {
  if (process.env.AUDIT_CHECK && !name.includes(process.env.AUDIT_CHECK))
    return;
  const context = await browser.newContext({
    serviceWorkers: "block",
    reducedMotion: "reduce",
    viewport: { width: 1440, height: 900 },
    ...options,
  });
  const page = await context.newPage();
  page.setDefaultTimeout(8000);
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  try {
    await run(page, context);
    assert.deepEqual(errors, []);
    console.log(`PASS ${name}`);
  } catch (error) {
    failures++;
    await page.screenshot({ path: `${evidence}/failure.png` });
    console.error(`FAIL ${name}: ${error.stack}`);
  } finally {
    await context.close();
  }
}
try {
  await check(
    "Pages 404 redirects preserve direct route/query/hash even when storage is blocked",
    async (page, context) => {
      await context.addInitScript(() => {
        Object.defineProperty(window, "sessionStorage", {
          get() {
            throw new Error("blocked");
          },
        });
      });
      const html = await fs.readFile("public/404.html", "utf8");
      let redirected = false;
      await page.route("**/*", async (route) => {
        if (
          !redirected &&
          route.request().isNavigationRequest() &&
          new URL(route.request().url()).pathname === "/compatibility"
        ) {
          redirected = true;
          await route.fulfill({
            status: 404,
            contentType: "text/html",
            body: html,
          });
        } else await route.continue();
      });
      await page.goto(
        `${base}/compatibility?q=Astro%20Bot&os=macos&sort=recent#main`,
      );
      await page.getByRole("searchbox").waitFor();
      assert.equal(new URL(page.url()).pathname, "/compatibility");
      assert.equal(new URL(page.url()).searchParams.get("q"), "Astro Bot");
      assert.equal(new URL(page.url()).searchParams.get("os"), "macos");
      assert.equal(new URL(page.url()).hash, "#main");
      await page.goto(
        `${base}/?__kyty_path=${encodeURIComponent("//outside.invalid/")}`,
      );
      await page.locator(".hero").waitFor();
      assert.equal(new URL(page.url()).origin, base);
    },
  );
  await check(
    "A failed screenshot does not poison the next valid image",
    async (page) => {
      const report = astro.reports.find((r) => r.os === "linux");
      await page.route(report.screenshots[0], (route) => route.abort());
      await page.route(report.screenshots[1], async (route) =>
        route.fulfill({
          contentType: "image/svg+xml",
          body: '<svg xmlns="http://www.w3.org/2000/svg" width="320" height="180"><rect width="320" height="180" fill="teal"/></svg>',
        }),
      );
      await page.goto(`${base}/game/PPSA21564`);
      await page.getByRole("tab", { name: "Linux", exact: true }).click();
      await page
        .getByRole("button", {
          name: "Expand ASTRO BOT screenshot 1",
          exact: true,
        })
        .click();
      await page.locator(".lightbox .image-fallback").waitFor();
      await page
        .getByRole("button", { name: "Next screenshot", exact: true })
        .click();
      await page.waitForFunction(
        () => document.querySelector(".lightbox img")?.naturalWidth > 0,
      );
      assert.equal(await page.locator(".lightbox .image-fallback").count(), 0);
    },
  );
  await check(
    "Open reports update notes/status and preserve selected platform; homepage badges follow live data",
    async (page) => {
      let phase = 0;
      let reportCalls = 0;
      const starting = structuredClone(index);
      const startingGame = starting.games.find((g) => g.key === "PPSA21564");
      delete startingGame.os.macos;
      delete startingGame.reportCounts.macos;
      startingGame.reportRevision = "two-platforms";
      const startingReports = structuredClone(astro);
      startingReports.reports = startingReports.reports.filter(
        (r) => r.os !== "macos",
      );
      const next = structuredClone(index),
        changed = next.games.find((g) => g.key === "PPSA21564");
      next.games = next.games.filter((g) => g.key !== "PPSA01284");
      changed.os = {
        windows: "logo",
        linux: "doesnt-boot",
        macos: "doesnt-boot",
      };
      changed.overall = "logo";
      changed.reportRevision = "new-revision";
      changed.latestTested = nextTestDate;
      changed.latestReport = { os: "windows", testedDate: nextTestDate };
      for (const capture of changed.screenshots)
        capture.testedDate = nextTestDate;
      const detail = structuredClone(astro);
      for (const report of detail.reports) {
        report.status = changed.os[report.os];
        report.notes = "FRESH REPORT CONTENT";
        report.testedDate = nextTestDate;
      }
      await page.route("**/data/compat-index.json", (route) =>
        route.fulfill({ json: phase ? next : starting }),
      );
      await page.route("**/data/compat/PPSA21564.json", (route) => {
        reportCalls++;
        return route.fulfill({ json: phase ? detail : startingReports });
      });
      await page.goto(`${base}/game/PPSA21564`);
      await page.getByRole("tab", { name: "Linux", exact: true }).click();
      phase = 1;
      // Refresh only the index before the detail TTL expires. Its new revision
      // must invalidate the report, while keeping the Linux selection.
      const refreshed = await page.evaluate(async () => {
        const resource = performance
          .getEntriesByType("resource")
          .find(
            (entry) => new URL(entry.name).pathname === "/src/lib/cache.ts",
          );
        const { cachedJson } = await import(
          resource?.name ?? "/src/lib/cache.ts"
        );
        const data = await cachedJson("/data/compat-index.json", {
          force: true,
        });
        document.dispatchEvent(new Event("visibilitychange"));
        return {
          resource: resource?.name,
          revision: data.games.find((g) => g.key === "PPSA21564")
            .reportRevision,
          hidden: document.hidden,
        };
      });
      assert.equal(refreshed.revision, "new-revision");
      await page.getByText("FRESH REPORT CONTENT").waitFor();
      assert(reportCalls >= 2, "A new revision must reload the detail payload");
      assert.equal(
        await page
          .getByRole("tab", { name: "Linux", exact: true })
          .getAttribute("aria-selected"),
        "true",
      );
      assert.equal(
        await page.locator(".report-heading .status").innerText(),
        "Doesn’t boot",
      );
      assert.equal(
        await page.locator(".game-detail-heading .status").innerText(),
        "Logo",
      );
      await page.getByRole("tab", { name: "macOS", exact: true }).click();
      await page.getByText("FRESH REPORT CONTENT").waitFor();
      assert.equal(
        await page.locator(".report-heading .status").innerText(),
        "Doesn’t boot",
      );
      await page.getByRole("tab", { name: "Linux", exact: true }).click();
      // A same-revision payload still refreshes by TTL, for older publishers.
      await page.clock.install();
      detail.reports.find((r) => r.os === "linux").notes =
        "TTL REFRESH CONTENT";
      await page.clock.fastForward(300001);
      await page.evaluate(() =>
        document.dispatchEvent(new Event("visibilitychange")),
      );
      await page.getByText("TTL REFRESH CONTENT").waitFor();
      await page.goto(base);
      const sleeve = page.locator(
        '.hero-deck-card[data-game="PPSA21564"] .status',
      );
      await page
        .locator('.hero-deck-card[data-game="PPSA21564"] .status-logo')
        .waitFor();
      assert.equal(
        await page.locator('.hero-deck-card[data-game="PPSA01284"]').count(),
        0,
        "A removed title must not retain a curated status card",
      );
      assert.equal(await sleeve.innerText(), "Logo");
      assert.equal(
        await page
          .locator('.game-card[href="/game/PPSA21564"] .status')
          .innerText(),
        "Logo",
      );
      await page.locator(".capture-section").scrollIntoViewIfNeeded();
      await page.clock.runFor(500);
      await page
        .locator(".capture-bottom")
        .filter({ hasText: "ASTRO BOT" })
        .waitFor();
      const label = await page.locator(".capture-top").innerText();
      const captureOS = Object.entries({
        windows: "Windows",
        linux: "Linux",
        macos: "macOS",
      }).find(([, name]) => label.includes(name))?.[0];
      assert(captureOS, "Capture identifies its report platform");
      await page
        .locator(`.capture-top .status-${changed.os[captureOS]}`)
        .waitFor();
    },
  );
  await check(
    "Homepage provides configure/build/install commands for each platform",
    async (page) => {
      await page.goto(base);
      for (const os of ["Windows", "Linux", "macOS"]) {
        await page.getByRole("tab", { name: os, exact: true }).click();
        await page.waitForFunction(() =>
          document
            .querySelector(".platform-code pre")
            ?.textContent.includes("cmake -S . -B"),
        );
        const text = await page.locator(".platform-code pre").innerText();
        assert(text.indexOf("cmake -S . -B") < text.indexOf("cmake --build"));
        assert(text.includes("cmake --install"));
      }
    },
  );
  for (const width of [1440, 768, 390])
    await check(
      `First wheel scroll above captures moves the page (${width}px)`,
      async (page) => {
        await page.goto(base);
        await page.locator(".carousel-track").waitFor();
        await page.evaluate(() => document.fonts.ready);
        await page.locator(".carousel-track").evaluate((e) =>
          scrollTo({
            top: e.getBoundingClientRect().top + scrollY + e.clientHeight - 470,
            behavior: "instant",
          }),
        );
        await page.waitForTimeout(700);
        const bounds = await page.locator(".carousel-track").boundingBox();
        await page.mouse.move(width / 2, bounds.y + bounds.height / 2);
        const before = await page.evaluate(() => scrollY);
        await page.mouse.wheel(0, 120);
        await page.waitForFunction((y) => scrollY >= y + 100, before);
        assert.equal(
          await page.locator(".carousel-track").evaluate((e) => e.scrollTop),
          0,
        );
        await page
          .getByRole("button", { name: "Next games", exact: true })
          .click();
        await page.waitForFunction(
          () => document.querySelector(".carousel-track").scrollLeft > 50,
        );
        await page.locator(".capture-copy h2").scrollIntoViewIfNeeded();
        await page.waitForTimeout(650);
        await page.screenshot({ path: `${evidence}/capture-${width}.png` });
        assert(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth + 1,
          ),
        );
      },
      { viewport: { width, height: 900 }, reducedMotion: "no-preference" },
    );
} finally {
  await browser.close();
}
if (failures) process.exitCode = 1;
