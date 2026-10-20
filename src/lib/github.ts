import snapshot from "../data/github.json";
import { cachedAt, cachedJson } from "./cache";

const API = "https://api.github.com/repos/KytyPS5/KytyPS5";
const CONTRIBUTORS = `${API}/contributors?per_page=100`;
const COUNT = `${API}/contributors?per_page=1&anon=true`;
export const initialCommunity = {
  repo: snapshot.repo,
  contributors: snapshot.contributors,
  contributorsCount:
    (snapshot as typeof snapshot & { contributorsCount?: number })
      .contributorsCount ?? snapshot.contributors.length,
  fetchedAt: snapshot.fetchedAt,
};

export async function loadCommunity(force = false) {
  const [repo, contributors, count] = await Promise.allSettled([
    cachedJson<typeof snapshot.repo>(API, { maxAge: 900_000, force }),
    cachedJson<typeof snapshot.contributors>(CONTRIBUTORS, {
      maxAge: 3_600_000,
      force,
    }),
    cachedJson<number>(COUNT, {
      maxAge: 3_600_000,
      force,
      parse: async (response) => {
        const last = response.headers
          .get("link")
          ?.match(/[?&]page=(\d+)[^>]*>;\s*rel="last"/);
        if (last) return Number(last[1]);
        const data = await response.json();
        if (!Array.isArray(data)) throw new Error("Invalid contributor count");
        return data.length;
      },
    }),
  ]);
  const people =
    contributors.status === "fulfilled"
      ? contributors.value
      : snapshot.contributors;
  return {
    repo: repo.status === "fulfilled" ? repo.value : snapshot.repo,
    contributors: people,
    contributorsCount:
      count.status === "fulfilled"
        ? count.value
        : Math.max(initialCommunity.contributorsCount, people.length),
    fetchedAt: (await cachedAt(CONTRIBUTORS)) ?? snapshot.fetchedAt,
  };
}

export async function loadRelease(force = false) {
  const url = `${API}/releases/latest`;
  const release = await cachedJson<typeof snapshot.release>(url, {
    maxAge: 300_000,
    force,
    allowStale: !force,
  });
  return {
    ...snapshot,
    release,
    fetchedAt: (await cachedAt(url)) ?? snapshot.fetchedAt,
  };
}

/** Ignore checksums/signatures; recognize aliases used by platform release archives. */
export function releaseAsset(
  assets: typeof snapshot.release.assets,
  os: "windows" | "linux" | "macos",
) {
  return assets.find((asset) => {
    const name = asset.name.toLowerCase();
    if (/\.(?:sha\d+(?:sum)?|md5|txt|asc|sig)$/.test(name)) return false;
    return os === "windows"
      ? /windows|(?:^|[-_])win(?:32|64)?(?:[-_.]|$)|\.(exe|msi)$/.test(name)
      : os === "macos"
        ? /macos|darwin|osx|\.dmg$/.test(name)
        : /linux|\.(appimage|deb|rpm)$/.test(name);
  });
}
