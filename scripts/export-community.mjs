import { exportCommunityData } from "./lib/community-data.mjs";
const data = await exportCommunityData();
console.log(
  `Exported ${data.forks.length} community forks and ${data.patchCollections.length} game patch collections.`,
);
