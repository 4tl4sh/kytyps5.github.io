import { Link } from "react-router-dom";
import {
  osNames,
  statuses,
  statusMeta,
  type Game,
  type OS,
} from "../data/types";

export function CompatibilitySummary({
  games,
  os = "all",
}: {
  games: readonly Game[];
  os?: OS | "all";
}) {
  const total = games.length;
  const counts = statuses.map((status) => ({
    status,
    label: statusMeta[status].label,
    count: games.filter(
      (game) => (os === "all" ? game.overall : game.os[os]) === status,
    ).length,
  }));
  const tested = counts.reduce((sum, item) => sum + item.count, 0);
  const parts = [
    ...counts,
    ...(tested < total
      ? [{ status: "untested", label: "Untested", count: total - tested }]
      : []),
  ];
  function href(status: string) {
    const params = new URLSearchParams();
    if (status !== "untested") params.set("status", status);
    if (os !== "all") params.set("os", os);
    return `/compatibility?${params}`;
  }
  return (
    <div className="compatibility-summary" data-total={total}>
      <div className="compatibility-summary-heading">
        <h3>Compatibility at a glance</h3>
        <p>
          {os === "all"
            ? `${total.toLocaleString()} tested games`
            : `${tested.toLocaleString()} tested on ${osNames[os]} / ${total.toLocaleString()} titles`}
        </p>
      </div>
      <div
        className="compatibility-bar"
        role="group"
        aria-label="Compatibility status distribution"
      >
        {parts
          .filter((part) => part.count > 0)
          .map((part) => {
            const label = `${part.label}: ${part.count} of ${total} games (${((part.count / total) * 100).toFixed(1)}%)`;
            return part.status === "untested" ? (
              <span
                key={part.status}
                className="compatibility-segment segment-untested"
                data-status={part.status}
                data-count={part.count}
                style={{ width: `${(part.count / total) * 100}%` }}
                role="img"
                aria-label={label}
                title={label}
              />
            ) : (
              <Link
                key={part.status}
                className={`compatibility-segment segment-${part.status}`}
                data-status={part.status}
                data-count={part.count}
                style={{ width: `${(part.count / total) * 100}%` }}
                to={href(part.status)}
                aria-label={label}
                title={label}
              />
            );
          })}
      </div>
      <div className="compatibility-legend">
        {parts.map((part) => (
          <div key={part.status}>
            {part.status === "untested" ? (
              <div className="compatibility-legend-item">
                <span className={`compatibility-key segment-${part.status}`} />
                <span>{part.label}</span>
                <strong>
                  {part.count}
                  <span> / {total}</span>
                </strong>
                <span className="compatibility-percent">
                  {total ? ((part.count / total) * 100).toFixed(1) : "0.0"}%
                </span>
              </div>
            ) : (
              <Link
                className="compatibility-legend-item"
                to={href(part.status)}
              >
                <span className={`compatibility-key segment-${part.status}`} />
                <span>{part.label}</span>
                <strong>
                  {part.count}
                  <span> / {total}</span>
                </strong>
                <span className="compatibility-percent">
                  {total ? ((part.count / total) * 100).toFixed(1) : "0.0"}%
                </span>
              </Link>
            )}
          </div>
        ))}
      </div>
      <p className="compatibility-summary-note">
        {os === "all"
          ? "Best reported result across tested platforms. Select a status to explore its games."
          : "Shares use the whole collection. Untested titles have no report for this platform."}
      </p>
    </div>
  );
}
