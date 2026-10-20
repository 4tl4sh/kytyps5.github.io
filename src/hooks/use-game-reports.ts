import { useCallback } from "react";
import { cachedJson } from "../lib/cache";
import { type Report, statuses } from "../data/types";
import { useRefreshingData } from "./use-refreshing-data";

type GameReports = {
  key: string;
  title: string;
  titleId: string;
  reports: Report[];
};

/** Reports share the index refresh cadence; a new content revision bypasses TTL. */
export function useGameReports(key?: string, revision?: string) {
  const load = useCallback(
    async (force = false) => {
      if (!key) return null;
      return cachedJson<GameReports>(
        `/data/compat/${encodeURIComponent(key)}.json`,
        {
          maxAge: 300_000,
          version: revision,
          force,
          parse: async (response) => {
            const data = await response.json();
            if (
              data.key !== key ||
              !Array.isArray(data.reports) ||
              !data.reports.length ||
              !data.reports.every(
                (report: Report) =>
                  typeof report.slug === "string" &&
                  typeof report.testedDate === "string" &&
                  typeof report.testedVersion === "string" &&
                  statuses.includes(report.status) &&
                  ["windows", "linux", "macos"].includes(report.os),
              )
            )
              throw new Error("Invalid game reports");
            return data;
          },
        },
      );
    },
    [key, revision],
  );
  const result = useRefreshingData<GameReports | null>(null, load);
  // Never display the outgoing game's payload during a route change.
  return { ...result, data: result.data?.key === key ? result.data : null };
}
