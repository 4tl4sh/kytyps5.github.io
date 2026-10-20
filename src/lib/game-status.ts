import { statuses, type OS, type Report, type Status } from "../data/types";

/** Overall status means the furthest verified progress across tested platforms. */
export function overallStatus(values: (Status | undefined)[]): Status {
  return statuses.find((status) => values.includes(status)) ?? "doesnt-boot";
}

export function reportSummary(reports: Report[]) {
  const os: Partial<Record<OS, Status>> = {};
  const reportCounts: Partial<Record<OS, number>> = {};
  const sorted = [...reports].sort((a, b) =>
    b.testedDate.localeCompare(a.testedDate),
  );
  for (const report of sorted) {
    os[report.os] ??= report.status;
    reportCounts[report.os] = (reportCounts[report.os] ?? 0) + 1;
  }
  return {
    os,
    reportCounts,
    overall: overallStatus(Object.values(os)),
    latestTested: sorted[0]?.testedDate,
  };
}
