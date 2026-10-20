import { extractSource } from "./compat-export.mjs";

/** Trust belongs to a repository + source issue, never to the game/OS alone. */
export function sourceIssueKey(value) {
  try {
    const url = new URL(value);
    const match = url.pathname.match(
      /^\/([\w.-]+)\/([\w.-]+)\/issues\/([1-9]\d*)\/?$/,
    );
    return url.protocol === "https:" &&
      url.hostname === "github.com" &&
      !url.username &&
      !url.password &&
      !url.port &&
      match
      ? `${match[1]}/${match[2]}#${match[3]}`.toLowerCase()
      : undefined;
  } catch {
    return undefined;
  }
}

export function reportTrustSource(raw) {
  const { source } = extractSource(raw);
  if (source?.url) return sourceIssueKey(source.url);
  // Legacy reports can identify the same upstream issue with a bare footer.
  const number = source?.label.match(
    /^(?:KytyPS5 issue #|GitHub game status report (?:KytyPS5 issue )?#?)([1-9]\d*)$/i,
  )?.[1];
  return number ? `kytyps5/kytyps5#${number}` : undefined;
}

export function sourceReportTrusted({ override, report, sourceUrl }) {
  if (typeof override === "boolean") return override;
  const source = sourceIssueKey(sourceUrl);
  return Boolean(source && report?.trusted && report.trustSource === source);
}
