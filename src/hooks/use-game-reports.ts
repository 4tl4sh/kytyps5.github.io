import { useCallback } from "react";
import { cachedJson } from "../lib/cache";
import {
  type CompatibilityPeak,
  type OS,
  type Report,
  statuses,
} from "../data/types";
import { useRefreshingData } from "./use-refreshing-data";

type GameReports = {
  key: string;
  title: string;
  titleId: string;
  reports: Report[];
  previousBest?: Partial<Record<OS, CompatibilityPeak>>;
};

function validHistory(value: GameReports["previousBest"]) {
  return (
    value === undefined ||
    Boolean(
      value &&
      typeof value === "object" &&
      !Array.isArray(value) &&
      Object.entries(value).every(
        ([os, peak]) =>
          peak &&
          ["windows", "linux", "macos"].includes(os) &&
          peak.os === os &&
          statuses.includes(peak.status) &&
          typeof peak.testedDate === "string" &&
          typeof peak.testedVersion === "string" &&
          typeof peak.titleId === "string" &&
          (peak.gameVersion === undefined ||
            typeof peak.gameVersion === "string") &&
          (peak.recordUrl === undefined ||
            /^https:\/\/github\.com\/KytyPS5\/kytyps5\.github\.io\/blob\/[a-f0-9]{40,64}\/src\/content\/compat\/[\w%.~-]+\.md$/.test(
              peak.recordUrl,
            )),
      ),
    )
  );
}

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
              !validHistory(data.previousBest) ||
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
