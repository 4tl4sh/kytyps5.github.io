import { useCallback, useEffect, useRef, useState } from "react";

/** Refresh visible pages on a timer, tab return and reconnection; loaders enforce TTLs. */
export function useRefreshingData<T>(
  initial: T,
  load: (force: boolean) => Promise<T>,
) {
  const [data, setData] = useState(initial);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const request = useRef(0);
  const refresh = useCallback(
    async (force = false) => {
      const id = ++request.current;
      setLoading(true);
      try {
        const next = await load(force);
        if (id === request.current) {
          setData(next);
          setError(false);
        }
      } catch {
        if (id === request.current) setError(true);
      } finally {
        if (id === request.current) setLoading(false);
      }
    },
    [load],
  );
  useEffect(() => {
    void refresh();
    const check = () => {
      if (!document.hidden) void refresh();
    };
    const timer = window.setInterval(check, 60_000);
    document.addEventListener("visibilitychange", check);
    window.addEventListener("online", check);
    return () => {
      request.current++;
      clearInterval(timer);
      document.removeEventListener("visibilitychange", check);
      window.removeEventListener("online", check);
    };
  }, [refresh]);
  return { data, loading, error, refresh };
}
