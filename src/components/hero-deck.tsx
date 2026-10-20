import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { motion, useReducedMotion } from "motion/react";
import { Tilt } from "./primitives";
import { GameImage, StatusBadge } from "./shared";
import { osNames, type Game } from "../data/types";
import { latestReportStatus } from "../lib/featured";

type Slot = "left" | "center" | "right" | "incoming" | "behind";

/** Every game owns a persistent card; the cards change position, never artwork. */
export function HeroDeck({
  games,
  active,
  onSelect,
}: {
  games: readonly Game[];
  active: number;
  onSelect: (index: number) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(600);
  const reduced = useReducedMotion();
  useEffect(() => {
    if (!ref.current) return;
    const observer = new ResizeObserver(([entry]) =>
      setWidth(entry.contentRect.width),
    );
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);
  const spread = Math.min(width * 0.31, 185);
  const positions = {
    center: {
      x: 0,
      y: 0,
      scale: 1,
      rotate: -7,
      rotateY: 0,
      opacity: 1,
      zIndex: 4,
    },
    left: {
      x: -spread,
      y: width < 450 ? 57 : 75,
      scale: 0.79,
      rotate: -21,
      rotateY: 8,
      opacity: 1,
      zIndex: 2,
    },
    right: {
      x: spread,
      y: width < 450 ? 51 : 64,
      scale: 0.79,
      rotate: 16,
      rotateY: -8,
      opacity: 1,
      zIndex: 3,
    },
    incoming: {
      x: spread * 0.35,
      y: -32,
      scale: 0.62,
      rotate: 24,
      rotateY: -48,
      opacity: 0,
      zIndex: 1,
    },
    behind: {
      x: -spread * 0.25,
      y: -22,
      scale: 0.62,
      rotate: -27,
      rotateY: 48,
      opacity: 0,
      zIndex: 1,
    },
  };
  function slot(index: number): Slot {
    const offset = (index - active + games.length) % games.length;
    return offset === 0
      ? "center"
      : offset === 1
        ? "right"
        : offset === 2
          ? "incoming"
          : offset === games.length - 1
            ? "left"
            : "behind";
  }
  return (
    <div className="hero-deck" ref={ref} aria-label="Rotating game card stack">
      {games.map((game, index) => {
        const place = slot(index);
        const hidden = place === "incoming" || place === "behind";
        return (
          <motion.div
            key={game.key}
            className="hero-deck-card"
            data-game={game.key}
            data-title={game.title}
            data-slot={place}
            aria-hidden={hidden || undefined}
            inert={hidden}
            initial={false}
            animate={positions[place]}
            transition={{
              duration: reduced ? 0 : 0.95,
              ease: [0.45, 0, 0.2, 1],
              zIndex: { duration: 0 },
            }}
            style={{ pointerEvents: hidden ? "none" : "auto" }}
          >
            <Tilt className="hero-main-card">
              <div className="game-sleeve">
                <span>PlayStation®5</span>
                <span>KytyPS5</span>
              </div>
              <Link
                to={`/game/${game.key}`}
                aria-label={`Read ${game.title} compatibility report`}
                tabIndex={place === "center" ? 0 : -1}
              >
                <div className="hero-art">
                  <GameImage
                    src={game.cover}
                    title={`${game.title} artwork`}
                    eager
                  />
                </div>
              </Link>
              <div className="hero-game-caption">
                <span>
                  {game.latestReport
                    ? `${osNames[game.latestReport.os]} tested`
                    : "Community tested"}
                </span>
                <StatusBadge status={latestReportStatus(game)} />
              </div>
            </Tilt>
            {(place === "left" || place === "right") && (
              <button
                type="button"
                className="hero-deck-select"
                onClick={() => onSelect(index)}
                aria-label={`Bring ${game.title} to the front`}
              />
            )}
          </motion.div>
        );
      })}
    </div>
  );
}
