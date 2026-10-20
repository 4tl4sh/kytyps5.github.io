import { mkdir, readdir, unlink, writeFile } from "node:fs/promises";
import { loadSiteData, buildSitemap } from "./lib/site-data.mjs";
import { exportCommunityData } from "./lib/community-data.mjs";

// Markdown and the imported catalog are authoritative; public JSON is output.
const { games, aliases, details, gui, catalog, reports } = await loadSiteData();
await exportCommunityData();
await mkdir("public/data/compat", { recursive: true });
for (const file of await readdir("public/data/compat")) {
  if (file.endsWith(".json") && !details[file.slice(0, -5)])
    await unlink(`public/data/compat/${file}`);
}
await Promise.all([
  writeFile("src/data/compat-index.json", JSON.stringify(games) + "\n"),
  writeFile("src/data/aliases.json", JSON.stringify(aliases) + "\n"),
  writeFile("public/data/catalog.json", JSON.stringify(catalog) + "\n"),
  writeFile(
    "public/data/compat-index.json",
    JSON.stringify({ version: 2, games }) + "\n",
  ),
  writeFile("public/data/compatibility.json", JSON.stringify(gui) + "\n"),
  writeFile("public/sitemap.xml", buildSitemap(games)),
  ...Object.entries(details).map(([key, detail]) =>
    writeFile(`public/data/compat/${key}.json`, JSON.stringify(detail) + "\n"),
  ),
]);
console.log(
  `Exported ${games.length} tested games / ${reports.length} Markdown reports, full catalog, aliases, captures, launcher compatibility and sitemap.`,
);
