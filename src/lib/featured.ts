import type { Game } from "../data/types";

export function latestGames(games: readonly Game[], limit = 9) {
  return games
    .filter((game) => Boolean(game.cover?.trim()))
    .sort(
      (a, b) =>
        (b.latestTested ?? "").localeCompare(a.latestTested ?? "") ||
        a.key.localeCompare(b.key),
    )
    .slice(0, limit);
}

/** Sort before deduplication so shared captures retain their newest report. */
export function latestCaptures(games: readonly Game[]) {
  const seen = new Set<string>();
  return games
    .flatMap((game) =>
      (game.screenshots ?? []).map((capture) => ({
        ...game,
        screenshot: capture.screenshot,
        latestTested: capture.testedDate,
        captureOS: capture.os,
      })),
    )
    .sort(
      (a, b) =>
        (b.latestTested ?? "").localeCompare(a.latestTested ?? "") ||
        a.key.localeCompare(b.key) ||
        a.screenshot.localeCompare(b.screenshot),
    )
    .filter((capture) => {
      if (seen.has(capture.screenshot)) return false;
      seen.add(capture.screenshot);
      return true;
    });
}

export function latestReportStatus(game: Game) {
  return (game.latestReport && game.os[game.latestReport.os]) || game.overall;
}
