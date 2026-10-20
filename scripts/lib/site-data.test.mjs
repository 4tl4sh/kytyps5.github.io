import { describe, expect, it } from "vitest";
import { readFile } from "node:fs/promises";
import { buildSiteData, loadSiteData } from "./site-data.mjs";

const catalog = [
  {
    titleId: "PPSA00001",
    allTitleIds: ["PPSA00001", "PPSA00002"],
    name: "Regional Game",
    cover: "https://example.test/cover.png",
    publisher: "Publisher",
  },
];
const report = {
  slug: "regional-linux",
  titleId: "PPSA00002",
  title: "Regional Game",
  os: "linux",
  status: "in-game",
  testedDate: "2026-10-20",
  testedVersion: "build",
  notes: "Original notes",
  screenshots: ["/screenshots/a.png", "/screenshots/b.png"],
};
describe("redesigned site export integration", () => {
  it("consumes region-matched reports and keeps every capture and freshness field", () => {
    const data = buildSiteData(catalog, [report]);
    expect(data.games[0]).toMatchObject({
      key: "PPSA00001",
      publisher: "Publisher",
      overall: "in-game",
      latestReport: { os: "linux", testedDate: "2026-10-20" },
    });
    expect(data.games[0].screenshots).toHaveLength(2);
    expect(data.aliases.PPSA00002).toBe("PPSA00001");
    expect(data.aliases[report.slug]).toBe("PPSA00001");
    expect(data.gui.PPSA00002.platforms.linux.status).toBe("InGame");
    expect(data.details.PPSA00001.reports[0].notes).toBe("Original notes");
  });
  it("changes the revision for a notes-only edit and admits report-only games", () => {
    expect(
      buildSiteData(catalog, [{ ...report, notes: "Updated" }]).games[0]
        .reportRevision,
    ).not.toBe(buildSiteData(catalog, [report]).games[0].reportRevision);
    expect(buildSiteData([], [report]).games[0].key).toBe("PPSA00002");
  });
  it("recreates the committed seed/aliases from authoritative Markdown and catalog", async () => {
    const data = await loadSiteData();
    expect(data.catalog.length).toBeGreaterThan(data.games.length);
    expect(data.games).toEqual(
      JSON.parse(await readFile("src/data/compat-index.json", "utf8")),
    );
    expect(data.aliases).toEqual(
      JSON.parse(await readFile("src/data/aliases.json", "utf8")),
    );
  });
});
