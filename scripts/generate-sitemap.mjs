import { writeFile } from "node:fs/promises";
import { loadSiteData, buildSitemap } from "./lib/site-data.mjs";
const { games } = await loadSiteData();
await writeFile("public/sitemap.xml", buildSitemap(games));
console.log(`Generated sitemap for ${games.length} canonical game routes.`);
