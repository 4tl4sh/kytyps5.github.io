import { mkdir, readFile, writeFile } from "node:fs/promises";
import { buildUpdatesFeed } from "./lib/updates-feed.mjs";

const API = "https://api.github.com/repos/KytyPS5/KytyPS5";
const previous = JSON.parse(await readFile("src/data/github.json", "utf8"));
await mkdir("public/data", { recursive: true });
const headers = {
  Accept: "application/vnd.github+json",
  "X-GitHub-Api-Version": "2022-11-28",
};
if (process.env.GITHUB_TOKEN)
  headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
async function get(path, fallback, parse = (response) => response.json()) {
  try {
    const response = await fetch(`${API}${path}`, {
      headers,
      signal: AbortSignal.timeout(8000),
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await parse(response);
  } catch (error) {
    console.warn(
      `GitHub ${path || "repository"}: ${error.message}; keeping saved data.`,
    );
    return fallback;
  }
}
const [repo, release, contributors, contributorsCount, commits] =
  await Promise.all([
    get("", previous.repo),
    get("/releases/latest", previous.release),
    get("/contributors?per_page=100", previous.contributors),
    get(
      "/contributors?per_page=1&anon=true",
      previous.contributorsCount ?? previous.contributors.length,
      async (response) => {
        const last = response.headers
          .get("link")
          ?.match(/[?&]page=(\d+)[^>]*>;\s*rel="last"/);
        return last ? Number(last[1]) : (await response.json()).length;
      },
    ),
    get("/commits?per_page=6", previous.commits ?? []),
  ]);
delete repo.temp_clone_token;
delete repo.permissions;
// Preserve the original scheduled-refresh comparison: download counters change
// per request and must not trigger a full Pages rebuild every 30 minutes.
for (const asset of release?.assets ?? []) delete asset.download_count;
const changed =
  JSON.stringify({
    repo,
    release,
    contributors,
    contributorsCount,
    commits,
  }) !==
  JSON.stringify({
    repo: previous.repo,
    release: previous.release,
    contributors: previous.contributors,
    contributorsCount: previous.contributorsCount,
    commits: previous.commits,
  });
const fetchedAt = changed ? new Date().toISOString() : previous.fetchedAt;
await writeFile(
  "src/data/github.json",
  JSON.stringify({
    repo,
    release,
    contributors,
    contributorsCount,
    commits,
    fetchedAt,
  }) + "\n",
);
await writeFile(
  "public/data/github.json",
  JSON.stringify({
    generatedAt: fetchedAt,
    repo,
    latestRelease: release,
    contributors,
    contributorsCount,
    commits,
  }) + "\n",
);
await writeFile(
  "public/data/updates.json",
  JSON.stringify(
    buildUpdatesFeed({
      latestRelease: release,
      commits,
      generatedAt: fetchedAt,
    }),
  ) + "\n",
);
console.log("Refreshed GitHub fallback data and the launcher update feed.");
