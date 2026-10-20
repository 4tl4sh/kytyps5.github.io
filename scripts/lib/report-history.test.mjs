import { describe, expect, it } from "vitest";
import { mkdtemp, mkdir, writeFile, rename, rm } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import { tmpdir } from "node:os";
import path from "node:path";
import {
  buildPreviousBests,
  buildPeakRecords,
  loadPeakLedger,
  readCommittedReportHistory,
} from "./report-history.mjs";
import { buildSiteData } from "./site-data.mjs";

const catalog = [
  {
    titleId: "PPSA00001",
    allTitleIds: ["PPSA00001", "PPSA00002"],
    name: "History game",
  },
];
const report = {
  slug: "history-windows",
  title: "History game",
  titleId: "PPSA00001",
  os: "windows",
  status: "logo",
  testedDate: "2026-10-20",
  testedVersion: "new build",
  gameVersion: "1.2",
  notes: "Current report",
};
const peak = {
  ...report,
  titleId: "PPSA00002",
  status: "in-game",
  gameVersion: "1.0",
  testedDate: "2026-10-01",
  testedVersion: "old build",
  recordUrl: "https://github.com/fixture/site/blob/abc/report.md",
};

async function inHistoryRepo(run) {
  const root = await mkdtemp(path.join(tmpdir(), "kyty-peak-ledger-"));
  const git = (...args) =>
    execFileSync("git", args, {
      cwd: root,
      encoding: "utf8",
      windowsHide: true,
      stdio: ["pipe", "pipe", "pipe"],
    }).trim();
  const raw = (status, version) =>
    `---\ntitle: "History game"\ntitleId: "PPSA00001"\nstatus: "${status}"\ntestedVersion: "build"\ntestedDate: "2026-10-01"\nos: "windows"\ngameVersion: "${version}"\n---\nNotes.\n`;
  const put = (status, version) =>
    writeFile(
      path.join(root, "src/content/compat/game.md"),
      raw(status, version),
    );
  const save = (message) => {
    git("add", ".");
    git("commit", "-qm", message);
    return git("rev-parse", "HEAD");
  };
  try {
    await mkdir(path.join(root, "src/content/compat"), { recursive: true });
    await mkdir(path.join(root, "src/data"), { recursive: true });
    git("init", "-q", "-b", "main");
    git("config", "user.name", "History Test");
    git("config", "user.email", "history@example.test");
    await run({ root, git, put, save });
  } finally {
    expect(path.dirname(root)).toBe(path.resolve(tmpdir()));
    expect(path.basename(root)).toMatch(/^kyty-peak-ledger-/);
    await rm(root, { recursive: true, force: true });
  }
}

describe("compatibility regression history", () => {
  it("enriches a locally exported peak with its source link after the report is committed", async () => {
    await inHistoryRepo(async ({ root, put, save }) => {
      await put("logo", "1.0");
      const checkpoint = save("baseline");
      const draft = {
        ...report,
        status: "in-game",
        gameVersion: "1.1",
        testedDate: "2026-10-01",
        testedVersion: "build",
      };
      const statePath = path.join(root, "src/data/compatibility-peaks.json");
      await writeFile(
        statePath,
        JSON.stringify({ version: 1, throughCommit: checkpoint, games: {} }),
      );
      await put("in-game", "1.1");
      const locallyExported = await loadPeakLedger(catalog, [draft], { root });
      expect(locallyExported.games.PPSA00001.windows.recordUrl).toBeUndefined();
      await writeFile(statePath, JSON.stringify(locallyExported));
      const committed = save("commit the new peak");
      const refreshed = await loadPeakLedger(catalog, [draft], { root });
      expect(refreshed.games.PPSA00001.windows.recordUrl).toContain(
        `/blob/${committed}/`,
      );
      expect(refreshed.games.PPSA00001.windows).toMatchObject({
        status: "in-game",
        gameVersion: "1.1",
        testedVersion: "build",
      });
    });
  });
  it("keeps the numerically highest game version at the same status before comparing dates", () => {
    const records = buildPeakRecords(catalog, [
      { ...peak, gameVersion: "1.9", testedDate: "2026-10-19" },
      { ...peak, gameVersion: "01.010.000", testedDate: "2026-09-01" },
      { ...peak, gameVersion: "unknown", testedDate: "2026-10-20" },
    ]);
    expect(records.PPSA00001.windows.gameVersion).toBe("01.010.000");
  });
  it("updates stored peaks using only reports since the saved checkpoint, then retains them after a decline", async () => {
    await inHistoryRepo(async ({ root, put, save }) => {
      await put("logo", "1.0");
      const checkpoint = save("baseline");
      const statePath = path.join(root, "src/data/compatibility-peaks.json");
      await writeFile(
        statePath,
        JSON.stringify({
          version: 1,
          throughCommit: checkpoint,
          games: buildPeakRecords(catalog, [report]),
        }),
      );
      await put("in-game", "1.1");
      const bestCommit = save("new peak");
      await put("main-menu", "1.2");
      const head = save("decline");
      const ledger = await loadPeakLedger(
        catalog,
        [{ ...report, status: "main-menu" }],
        { root },
      );
      expect(ledger.throughCommit).toBe(head);
      expect(ledger.games.PPSA00001.windows).toMatchObject({
        status: "in-game",
        gameVersion: "1.1",
      });
      expect(ledger.games.PPSA00001.windows.recordUrl).toContain(
        `/blob/${bestCommit}/`,
      );
      expect(readCommittedReportHistory(root, { since: head })).toEqual([]);
      await writeFile(statePath, JSON.stringify(ledger));
      expect(await loadPeakLedger(catalog, [report], { root })).toEqual(ledger);
    });
  });
  it("recovers reachable peaks hidden by default path simplification after a merge", async () => {
    await inHistoryRepo(async ({ root, git, put, save }) => {
      await put("logo", "1.0");
      save("baseline");
      git("checkout", "-qb", "other");
      await put("in-game", "1.1");
      save("hidden peak");
      git("checkout", "-q", "main");
      await writeFile(path.join(root, "other.txt"), "unrelated");
      save("main change");
      git("merge", "--no-edit", "-s", "ours", "other");
      await put("main-menu", "1.2");
      save("decline");
      expect(
        git("log", "--format=%s", "--", "src/content/compat"),
      ).not.toContain("hidden peak");
      expect(
        buildPeakRecords(catalog, readCommittedReportHistory(root)).PPSA00001
          .windows.status,
      ).toBe("in-game");
    });
  });
  it("recovers a peak introduced only by merge conflict resolution", async () => {
    await inHistoryRepo(async ({ git, put, save }) => {
      await put("logo", "1.0");
      save("baseline");
      git("checkout", "-qb", "other");
      await put("main-menu", "1.1");
      save("other result");
      git("checkout", "-q", "main");
      await put("doesnt-boot", "1.2");
      save("main result");
      expect(() => git("merge", "--no-commit", "--no-ff", "other")).toThrow();
      await put("in-game", "1.3");
      const merge = save("merge resolution peak");
      await put("logo", "1.4");
      save("decline after merge");
      const localResult = buildPeakRecords(
        catalog,
        readCommittedReportHistory(git("rev-parse", "--show-toplevel")),
      );
      expect(localResult.PPSA00001.windows).toMatchObject({
        status: "in-game",
        gameVersion: "1.3",
      });
      expect(localResult.PPSA00001.windows.recordUrl).toContain(
        `/blob/${merge}/`,
      );
    });
  });
  it("finds the highest previous status across regional IDs without replacing current status", () => {
    const data = buildSiteData(
      catalog,
      [report],
      [peak, { ...peak, status: "main-menu" }],
    );
    expect(data.details.PPSA00001.previousBest.windows).toMatchObject({
      status: "in-game",
      gameVersion: "1.0",
      testedVersion: "old build",
      titleId: "PPSA00002",
    });
    expect(data.games[0].os.windows).toBe("logo");
    expect(data.gui.PPSA00001.platforms.windows.status).toBe("Logo");
  });
  it("does not compare different platforms or games, or warn when recovered", () => {
    expect(
      buildPreviousBests(
        catalog,
        [report],
        [
          { ...peak, os: "linux" },
          { ...peak, titleId: "PPSA99999" },
        ],
      ),
    ).toEqual({});
    expect(
      buildPreviousBests(catalog, [{ ...report, status: "in-game" }], [peak]),
    ).toEqual({});
    expect(
      buildPreviousBests(
        catalog,
        [report],
        [{ ...peak, status: "doesnt-boot" }],
      ),
    ).toEqual({});
  });
  it("keeps the best-ever status after intermediate drops and picks the latest peak with a recorded game version", () => {
    const result = buildPreviousBests(
      catalog,
      [report],
      [
        { ...peak, gameVersion: undefined, testedDate: "2026-10-19" },
        { ...peak, status: "main-menu", testedDate: "2026-10-18" },
        peak,
        { ...peak, gameVersion: "0.9", testedDate: "2026-09-01" },
      ],
    );
    expect(result.PPSA00001.windows.gameVersion).toBe("1.0");
  });
  it("preserves unknown game versions and unknown valid game IDs without inventing metadata", () => {
    const result = buildPreviousBests(
      [],
      [report],
      [{ ...peak, titleId: report.titleId, gameVersion: undefined }],
    );
    expect(result.PPSA00001.windows.gameVersion).toBeUndefined();
    expect(result.PPSA00001.windows.testedVersion).toBe("old build");
  });
  it("invalidates detail caches when a historical peak changes", () => {
    const first = buildSiteData(catalog, [report], [peak]);
    const second = buildSiteData(
      catalog,
      [report],
      [{ ...peak, gameVersion: "1.1" }],
    );
    expect(first.games[0].reportRevision).not.toBe(
      second.games[0].reportRevision,
    );
  });
  it("recovers a replaced and renamed report from committed Git history", async () => {
    const root = await mkdtemp(path.join(tmpdir(), "kyty-report-history-"));
    const git = (...args) =>
      execFileSync("git", args, {
        cwd: root,
        encoding: "utf8",
        windowsHide: true,
        stdio: ["pipe", "pipe", "pipe"],
      });
    const raw = (status, version) =>
      `---\ntitle: "History game"\ntitleId: "PPSA00001"\nstatus: "${status}"\ntestedVersion: "build"\ntestedDate: "2026-10-01"\nos: "windows"\ngameVersion: "${version}"\n---\nReport notes: café.\n`;
    try {
      await mkdir(path.join(root, "src/content/compat"), { recursive: true });
      git("init", "-q");
      git("config", "user.name", "History Test");
      git("config", "user.email", "history@example.test");
      const original = path.join(root, "src/content/compat/original.md");
      await writeFile(original, raw("in-game", "1.0"));
      git("add", ".");
      git("commit", "-qm", "higher result");
      const higherCommit = git("rev-parse", "HEAD").trim();
      await writeFile(original, raw("main-menu", "1.1"));
      git("add", ".");
      git("commit", "-qm", "lower result");
      await rename(original, path.join(root, "src/content/compat/renamed.md"));
      git("add", ".");
      git("commit", "-qm", "rename report");
      const history = readCommittedReportHistory(root);
      const best = buildPreviousBests(catalog, [report], history).PPSA00001
        .windows;
      expect(best.status).toBe("in-game");
      expect(best.gameVersion).toBe("1.0");
      expect(best.recordUrl).toContain(
        `/blob/${higherCommit}/src/content/compat/original.md`,
      );
      expect(history).toHaveLength(2);
    } finally {
      expect(path.dirname(root)).toBe(path.resolve(tmpdir()));
      expect(path.basename(root)).toMatch(/^kyty-report-history-/);
      await rm(root, { recursive: true, force: true });
    }
  });
});
