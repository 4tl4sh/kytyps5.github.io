import ReactMarkdown from "react-markdown";
import {
  type CompatibilityPeak,
  type Report,
  osNames,
  statuses,
  statusMeta,
} from "../data/types";
import { date, External } from "./shared";

export function CompatibilityRegression({
  report,
  peak,
}: {
  report: Report;
  peak?: CompatibilityPeak;
}) {
  if (
    !peak ||
    peak.os !== report.os ||
    statuses.indexOf(report.status) <= statuses.indexOf(peak.status)
  )
    return null;
  return (
    <aside
      className="regression-notice"
      aria-label={`${osNames[report.os]} compatibility history`}
    >
      <strong>Below its previous best on {osNames[report.os]}.</strong>
      <p>
        This report: <b>{statusMeta[report.status].label}</b>. Previously
        reported: <b>{statusMeta[peak.status].label}</b>
        {peak.gameVersion?.trim() ? (
          <>
            {" "}
            with game version <b>{peak.gameVersion}</b>
          </>
        ) : (
          <> (game version not recorded)</>
        )}
        , tested {date(peak.testedDate)}.
      </p>
      <details>
        <summary>Earlier test details</summary>
        <p>Title ID: {peak.titleId}</p>
        <div className="regression-build">
          <span>Emulator build:</span>
          <ReactMarkdown
            skipHtml
            components={{
              a: ({ children, href }) => (
                <External href={href ?? "#"}>{children}</External>
              ),
            }}
          >
            {peak.testedVersion}
          </ReactMarkdown>
        </div>
        {peak.recordUrl && (
          <External href={peak.recordUrl}>View the earlier report</External>
        )}
      </details>
    </aside>
  );
}
