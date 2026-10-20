import { useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { Moon, Sun } from "lucide-react";

type Theme = "light" | "dark";
const storageKey = "kyty-theme";
const rippleProperties = [
  "--ripple-x",
  "--ripple-y",
  "--ripple-radius",
  "--ripple-diameter",
];
function clearRippleStyles(root: HTMLElement) {
  delete root.dataset.themeRipple;
  root.style.removeProperty("view-transition-name");
  rippleProperties.forEach((property) => root.style.removeProperty(property));
}

function preferredTheme(): Theme {
  try {
    const saved = localStorage.getItem(storageKey);
    if (saved === "dark" || saved === "light") return saved;
  } catch {
    /* Browser storage can be unavailable in private contexts. */
  }
  return matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>(() =>
    document.documentElement.dataset.theme === "dark" ? "dark" : "light",
  );
  const target = useRef(theme);
  const sequence = useRef(0);
  const transition = useRef<ViewTransition | undefined>(undefined);
  const animations = useRef<Animation[]>([]);
  useEffect(() => {
    const media = matchMedia("(prefers-color-scheme: dark)");
    const apply = () => {
      const next = preferredTheme();
      document.documentElement.dataset.theme = next;
      target.current = next;
      setTheme(next);
    };
    const syncStorage = (event: StorageEvent) => {
      if (event.key === storageKey || event.key === null) apply();
    };
    media.addEventListener("change", apply);
    window.addEventListener("storage", syncStorage);
    return () => {
      media.removeEventListener("change", apply);
      window.removeEventListener("storage", syncStorage);
    };
  }, []);
  function toggle() {
    const next = target.current === "dark" ? "light" : "dark";
    target.current = next;
    const id = ++sequence.current;
    animations.current.forEach((animation) => animation.cancel());
    animations.current = [];
    transition.current?.skipTransition();
    const root = document.documentElement;
    clearRippleStyles(root);
    try {
      localStorage.setItem(storageKey, next);
    } catch {
      /* Keep the in-session theme even without storage. */
    }
    const apply = () => {
      if (id !== sequence.current) return;
      flushSync(() => {
        document.documentElement.dataset.theme = next;
        setTheme(next);
      });
    };
    if (
      !document.startViewTransition ||
      matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      apply();
      return;
    }
    const x = next === "dark" ? 0 : innerWidth;
    const y = next === "dark" ? 0 : innerHeight;
    const radius = Math.ceil(Math.hypot(innerWidth, innerHeight)) + 4;
    root.style.setProperty("--ripple-x", `${x}px`);
    root.style.setProperty("--ripple-y", `${y}px`);
    root.style.setProperty("--ripple-radius", `${radius}px`);
    root.style.setProperty("--ripple-diameter", `${radius * 2}px`);
    root.dataset.themeRipple = next === "dark" ? "top-left" : "bottom-right";
    // Separate names retain a still old page and a separately composited new page.
    const view = document.startViewTransition(() => {
      if (id !== sequence.current) return;
      root.style.viewTransitionName = "theme-incoming";
      apply();
    });
    transition.current = view;
    void view.ready
      .then(async () => {
        if (id !== sequence.current) return;
        // The round window scales on the compositor. Inverse-scale its page so
        // text/art stay in place. No per-frame layout, paint or animated mask.
        const steps = [
          0.001,
          0.002,
          0.003,
          ...Array.from({ length: 256 }, (_, index) => (index + 1) / 256),
        ];
        const options = {
          duration: 600,
          easing: "linear",
          fill: "both" as FillMode,
        };
        const aperture = root.animate(
          [
            { transform: "scale(0.001)", offset: 0 },
            ...steps.map((scale) => ({
              transform: `scale(${scale})`,
              offset: scale,
            })),
          ],
          {
            ...options,
            pseudoElement: "::view-transition-group(theme-incoming)",
          },
        );
        const content = root.animate(
          [
            { transform: "scale(1000)", offset: 0 },
            ...steps.map((scale) => ({
              transform: `scale(${1 / scale})`,
              offset: scale,
            })),
          ],
          {
            ...options,
            pseudoElement: "::view-transition-image-pair(theme-incoming)",
          },
        );
        aperture.id = "theme-ripple-aperture";
        content.id = "theme-ripple-content";
        animations.current = [aperture, content];
        aperture.pause();
        content.pause();
        aperture.currentTime = 0;
        content.currentTime = 0;
        // Keep the old capture visible while both texture layers are prepared.
        await new Promise<void>((resolve) =>
          requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
        );
        if (id !== sequence.current) return;
        aperture.play();
        content.play();
        // Share one timeline position to keep the inverse transforms aligned.
        const start = document.timeline.currentTime;
        aperture.startTime = start;
        content.startTime = start;
      })
      .catch(() => {
        if (id === sequence.current) {
          animations.current.forEach((animation) => animation.cancel());
          view.skipTransition();
          apply();
        }
      });
    void view.finished
      .catch(() => {})
      .finally(() => {
        if (id === sequence.current) {
          clearRippleStyles(root);
          transition.current = undefined;
          animations.current.forEach((animation) => animation.cancel());
          animations.current = [];
        }
      });
  }
  return (
    <button
      type="button"
      className="theme-toggle"
      aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
      title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
      onClick={toggle}
    >
      {theme === "dark" ? <Sun size={19} /> : <Moon size={19} />}
    </button>
  );
}
