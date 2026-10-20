import index from "../data/compat-index.json";
import { type Game, statuses } from "../data/types";
import { cachedJson } from "../lib/cache";
import { useRefreshingData } from "./use-refreshing-data";
import { overallStatus } from "../lib/game-status";

const seed = index as Game[];
const metadata = new Map(seed.map((game) => [game.key, game]));
let latest = seed;
async function loadGames(force = false): Promise<Game[]> {
  try {
    const payload = await cachedJson<{ version: number; games: Game[] }>(
      "/data/compat-index.json",
      {
        maxAge: 300_000,
        force,
        parse: async (response) => {
          const data = await response.json();
          if (
            !Array.isArray(data.games) ||
            !data.games.every(
              (game: Game) =>
                typeof game.key === "string" &&
                typeof game.title === "string" &&
                statuses.includes(game.overall) &&
                game.os &&
                game.reportCounts &&
                Object.keys(game.os).length > 0 &&
                Object.entries(game.os).every(
                  ([os, status]) =>
                    ["windows", "linux", "macos"].includes(os) &&
                    statuses.includes(status),
                ),
            )
          )
            throw new Error("Invalid compatibility index");
          return data;
        },
      },
    );
    latest = payload.games.map((game) => {
      const saved = metadata.get(game.key);
      return {
        ...saved,
        ...game,
        latestReport:
          game.latestReport ??
          (game.latestTested === saved?.latestTested
            ? saved?.latestReport
            : undefined),
        overall: overallStatus(Object.values(game.os)),
      };
    });
  } catch {
    /* Keep the bundled or previously loaded index offline. */
  }
  return latest;
}
export function useCompatibilityGames() {
  return useRefreshingData(latest, loadGames).data;
}
