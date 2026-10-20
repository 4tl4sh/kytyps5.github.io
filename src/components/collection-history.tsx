import { useLayoutEffect, type ReactNode } from "react";
import {
  Link,
  useLocation,
  useNavigate,
  useNavigationType,
} from "react-router-dom";

type Position = { y: number; game: string };
const positions = new Map<string, Position>();
export function saveCollectionPosition(key: string, game: string) {
  const value = { y: scrollY, game };
  positions.set(key, value);
  if (positions.size > 40) positions.delete(positions.keys().next().value!);
  try {
    sessionStorage.setItem(`kyty-collection-${key}`, JSON.stringify(value));
  } catch {
    /* Memory remains available. */
  }
}
export function useCollectionRestoration() {
  const location = useLocation();
  const navigation = useNavigationType();
  useLayoutEffect(() => {
    if (navigation !== "POP") return;
    let saved = positions.get(location.key);
    try {
      saved ??= JSON.parse(
        sessionStorage.getItem(`kyty-collection-${location.key}`) ?? "null",
      );
    } catch {
      /* Invalid/unavailable storage is harmless. */
    }
    if (!saved || !Number.isFinite(saved.y) || saved.y < 0) return;
    const position = saved;
    const frame = requestAnimationFrame(() => {
      const row = [
        ...document.querySelectorAll<HTMLAnchorElement>(".game-table-row"),
      ].find((row) => row.dataset.gameKey === position.game);
      row?.focus({ preventScroll: true });
      window.scrollTo({ top: position.y, behavior: "instant" });
    });
    return () => cancelAnimationFrame(frame);
  }, [location.key, navigation]);
}
export function CollectionBackLink({
  children,
  className = "text-link",
}: {
  children: ReactNode;
  className?: string;
}) {
  const location = useLocation();
  const navigate = useNavigate();
  const from = location.state?.compatibility;
  const valid =
    typeof from?.href === "string" &&
    /^\/compatibility(?:\?|$)/.test(from.href) &&
    typeof from.key === "string";
  return (
    <Link
      to={valid ? from.href : "/compatibility"}
      className={className}
      onClick={(event) => {
        if (
          !valid ||
          event.button !== 0 ||
          event.metaKey ||
          event.ctrlKey ||
          event.shiftKey ||
          event.altKey
        )
          return;
        event.preventDefault();
        navigate(-1);
      }}
    >
      {children}
    </Link>
  );
}
