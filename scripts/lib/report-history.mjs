import { execFileSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { parseReport, siteGameKey, STATUSES } from "./compat-export.mjs";

const fields = (report) => ({
  slug: report.slug,
  titleId: report.titleId,
  os: report.os,
  status: report.status,
  testedDate: report.testedDate,
  testedVersion: report.testedVersion,
  ...(report.gameVersion ? { gameVersion: report.gameVersion } : {}),
  ...(report.recordUrl ? { recordUrl: report.recordUrl } : {}),
});

/** Recover replaced/renamed report versions without changing the ingestion pipeline. */
export function readCommittedReportHistory(
  root = process.cwd(),
  { since } = {},
) {
  if (since && !/^[a-f0-9]{40,64}$/.test(since))
    throw new Error("Invalid history checkpoint.");
  const git = (args, options = {}) =>
    execFileSync("git", args, {
      cwd: root,
      windowsHide: true,
      encoding: "utf8",
      maxBuffer: 128 * 1024 * 1024,
      stdio: ["pipe", "pipe", "pipe"],
      ...options,
    });
  try {
    git(["rev-parse", "--git-dir"]);
  } catch (error) {
    if (
      error.code !== "ENOENT" &&
      !String(error.stderr).includes("not a git repository")
    )
      throw error;
    console.warn(
      "Compatibility history unavailable: build from a full Git checkout to include earlier report results.",
    );
    return [];
  }
  if (git(["rev-parse", "--is-shallow-repository"]).trim() === "true")
    console.warn(
      "Compatibility history is incomplete in a shallow checkout. Fetch full history before publishing.",
    );
  const log = git([
    "log",
    "--full-history",
    "-m",
    "--format=COMMIT:%H",
    "--raw",
    "--no-abbrev",
    "--no-renames",
    "--diff-filter=AM",
    since ? `${since}..HEAD` : "HEAD",
    "--",
    "src/content/compat",
  ]);
  const blobs = new Map();
  let commit;
  for (const line of log.split("\n")) {
    if (line.startsWith("COMMIT:")) commit = line.slice(7);
    const match = line.match(
      /^:\d{6} \d{6} [a-f0-9]+ ([a-f0-9]+) [AM]\t(src\/content\/compat\/.+\.md)$/,
    );
    if (match && commit && !blobs.has(match[1]))
      blobs.set(match[1], { commit, file: match[2] });
  }
  if (!blobs.size) return [];
  const buffer = git(["cat-file", "--batch"], {
    encoding: null,
    input: [...blobs.keys()].join("\n") + "\n",
  });
  const history = [];
  let offset = 0;
  for (const [hash, record] of blobs) {
    const end = buffer.indexOf(10, offset);
    const [id, type, length] = buffer
      .subarray(offset, end)
      .toString()
      .split(" ");
    const size = Number(length);
    if (
      id !== hash ||
      type !== "blob" ||
      !Number.isSafeInteger(size) ||
      end < 0 ||
      end + size + 1 >= buffer.length
    )
      throw new Error("Invalid Git report-history response.");
    const raw = buffer.subarray(end + 1, end + 1 + size).toString("utf8");
    offset = end + size + 2;
    // Older malformed or pre-schema files are not evidence of a verified status.
    let report;
    try {
      report = parseReport(raw, record.file.split("/").at(-1).slice(0, -3));
    } catch {
      continue;
    }
    history.push(
      fields({
        ...report,
        recordUrl: `https://github.com/KytyPS5/kytyps5.github.io/blob/${record.commit}/${record.file.split("/").map(encodeURIComponent).join("/")}`,
      }),
    );
  }
  return history;
}

/** Historical peaks are per game and OS; current statuses keep their original meaning. */
export function buildPeakRecords(catalog, history) {
  const identities = new Map(
    catalog.flatMap((game) =>
      [game.titleId, ...(game.allTitleIds ?? [])].map((id) => [
        siteGameKey(id),
        siteGameKey(game.titleId),
      ]),
    ),
  );
  const keyOf = (report) =>
    identities.get(siteGameKey(report.titleId)) ?? siteGameKey(report.titleId);
  const peaks = new Map();
  for (const report of history) {
    if (
      !STATUSES.includes(report.status) ||
      !["windows", "linux", "macos"].includes(report.os)
    )
      continue;
    const key = `${keyOf(report)}:${report.os}`;
    const previous = peaks.get(key);
    const rank = STATUSES.indexOf(report.status);
    const oldRank = previous ? STATUSES.indexOf(previous.status) : -1;
    const versionOrder = previous
      ? compareGameVersions(report.gameVersion, previous.gameVersion)
      : 0;
    // Preserve the highest game version at a peak, then its latest test.
    if (
      !previous ||
      rank > oldRank ||
      (rank === oldRank &&
        (versionOrder > 0 ||
          (versionOrder === 0 &&
            (report.testedDate > previous.testedDate ||
              (report.testedDate === previous.testedDate &&
                report.recordUrl &&
                !previous.recordUrl)))))
    )
      peaks.set(key, report);
  }
  const result = {};
  for (const peak of peaks.values())
    (result[keyOf(peak)] ??= {})[peak.os] = fields(peak);
  return result;
}

function compareGameVersions(a, b) {
  const known = (value) =>
    typeof value === "string" &&
    value.trim() &&
    !/^(unknown|n\/?a|not (?:known|reported|specified)|latest)$/i.test(
      value.trim(),
    );
  const left = known(a),
    right = known(b);
  if (Boolean(left) !== Boolean(right)) return left ? 1 : -1;
  if (!left) return 0;
  const numeric = (value) =>
    /^v?\d+(?:[._-]\d+)*$/i.test(value.trim())
      ? value.trim().replace(/^v/i, "").split(/[._-]/).map(Number)
      : null;
  const aa = numeric(a),
    bb = numeric(b);
  if (aa && bb) {
    for (let i = 0; i < Math.max(aa.length, bb.length); i++)
      if ((aa[i] ?? 0) !== (bb[i] ?? 0))
        return (aa[i] ?? 0) > (bb[i] ?? 0) ? 1 : -1;
  }
  return 0;
}

export function buildPreviousBests(catalog, reports, history) {
  const peaks = buildPeakRecords(catalog, history);
  const identities = new Map(
    catalog.flatMap((game) =>
      [game.titleId, ...(game.allTitleIds ?? [])].map((id) => [
        siteGameKey(id),
        siteGameKey(game.titleId),
      ]),
    ),
  );
  const result = {};
  for (const current of reports) {
    const game =
      identities.get(siteGameKey(current.titleId)) ??
      siteGameKey(current.titleId);
    const peak = peaks[game]?.[current.os];
    if (
      peak &&
      STATUSES.indexOf(peak.status) > STATUSES.indexOf(current.status)
    )
      (result[game] ??= {})[current.os] = fields(peak);
  }
  return result;
}

export function peakReports(ledger) {
  if (
    ledger?.version !== 1 ||
    !ledger.games ||
    typeof ledger.games !== "object" ||
    Array.isArray(ledger.games) ||
    (ledger.throughCommit !== null &&
      !/^[a-f0-9]{40,64}$/.test(ledger.throughCommit))
  )
    throw new Error("Invalid compatibility peak registry.");
  const reports = [];
  for (const [key, platforms] of Object.entries(ledger.games)) {
    if (
      !/^PPSA\d{5}$/.test(key) ||
      !platforms ||
      typeof platforms !== "object" ||
      Array.isArray(platforms)
    )
      throw new Error("Invalid compatibility peak game.");
    for (const [os, report] of Object.entries(platforms)) {
      if (
        !report ||
        report.os !== os ||
        !["windows", "linux", "macos"].includes(os) ||
        !STATUSES.includes(report.status) ||
        !/^PPSA-?\d{5}$/i.test(report.titleId) ||
        typeof report.testedVersion !== "string" ||
        typeof report.testedDate !== "string" ||
        (report.gameVersion !== undefined &&
          typeof report.gameVersion !== "string")
      )
        throw new Error("Invalid compatibility peak report.");
      reports.push(report);
    }
  }
  return reports;
}

/** Durable peak state plus only the report changes since its committed checkpoint. */
export async function loadPeakLedger(
  catalog,
  reports,
  { root = process.cwd(), backfill = false } = {},
) {
  const git = (...args) =>
    execFileSync("git", args, {
      cwd: root,
      windowsHide: true,
      encoding: "utf8",
      stdio: ["pipe", "pipe", "pipe"],
    }).trim();
  let previous;
  try {
    previous = JSON.parse(
      await readFile(
        path.join(root, "src/data/compatibility-peaks.json"),
        "utf8",
      ),
    );
  } catch (error) {
    if (error.code !== "ENOENT" || !backfill) throw error;
    previous = { version: 1, throughCommit: null, games: {} };
  }
  const stored = peakReports(previous);
  let head = null,
    complete = false;
  try {
    head = git("rev-parse", "HEAD");
    complete = git("rev-parse", "--is-shallow-repository") === "false";
  } catch (error) {
    if (
      error.code !== "ENOENT" &&
      !String(error.stderr).includes("not a git repository")
    )
      throw error;
    console.warn(
      "No Git metadata: retaining stored compatibility peaks and comparing current reports only.",
    );
  }
  let history = [];
  if (head && (backfill || head !== previous.throughCommit)) {
    let since = backfill ? undefined : previous.throughCommit;
    if (since) {
      try {
        git("merge-base", "--is-ancestor", since, "HEAD");
      } catch {
        since = undefined;
      }
    }
    history = readCommittedReportHistory(root, { since });
  }
  const games = buildPeakRecords(catalog, [...stored, ...history, ...reports]);
  return {
    version: 1,
    throughCommit: complete ? head : previous.throughCommit,
    games: Object.fromEntries(
      Object.entries(games).sort(([a], [b]) => a.localeCompare(b)),
    ),
  };
}
