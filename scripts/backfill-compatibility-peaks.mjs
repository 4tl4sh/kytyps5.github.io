import { writeFile } from "node:fs/promises";
import { loadSiteData } from "./lib/site-data.mjs";

const { peakLedger } = await loadSiteData({ backfillHistory: true });
await writeFile(
  "src/data/compatibility-peaks.json",
  JSON.stringify(peakLedger, null, 2) + "\n",
);
console.log(
  `Backfilled stored compatibility peaks for ${Object.keys(peakLedger.games).length} games.`,
);
