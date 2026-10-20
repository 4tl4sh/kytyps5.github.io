/** One tiny local loop shared by startup, route and report loading states. */
export function KittyAnimation({ compact = false }: { compact?: boolean }) {
  return (
    <picture
      className={`kitty-loader-art${compact ? " kitty-loader-art--compact" : ""}`}
      aria-hidden="true"
    >
      <source
        media="(prefers-reduced-motion: reduce)"
        srcSet="/images/kitty-still-v2.png"
      />
      <img src="/images/kitty-running-v2.gif" width="240" height="192" alt="" />
    </picture>
  );
}

export function LoadingState({
  label = "Loading KytyPS5…",
  route = false,
}: {
  label?: string;
  route?: boolean;
}) {
  return (
    <div role="status" className={`kitty-loader${route ? " route-empty" : ""}`}>
      <KittyAnimation />
      <span>{label}</span>
    </div>
  );
}
