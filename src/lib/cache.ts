const CACHE_NAME = "kyty-json-v1";
const CACHE_DATE = "x-kyty-cached-at";
const CACHE_VERSION = "x-kyty-data-version";
const MAX_ENTRIES = 64;
type Entry = { data: unknown; timestamp: number; version?: string };
const memory = new Map<string, Entry>();
const pending = new Map<string, Promise<unknown>>();
const generations = new Map<string, number>();
const writes = new Map<string, Promise<void>>();
let sequence = 0;

function remember(url: string, entry: Entry) {
  memory.delete(url);
  memory.set(url, entry);
  if (memory.size > MAX_ENTRIES) memory.delete(memory.keys().next().value!);
}

type CacheOptions = {
  maxAge?: number;
  force?: boolean;
  allowStale?: boolean;
  signal?: AbortSignal;
  parse?: (response: Response) => Promise<unknown>;
  version?: string;
};

async function storage() {
  try {
    return await caches.open(CACHE_NAME);
  } catch {
    return undefined;
  }
}

async function read(url: string) {
  const existing = memory.get(url);
  if (existing) return existing;
  try {
    const response = await (await storage())?.match(url);
    if (!response) return;
    const entry = {
      data: await response.json(),
      timestamp: Number(response.headers.get(CACHE_DATE)) || 0,
      version: response.headers.get(CACHE_VERSION) ?? undefined,
    };
    const current = memory.get(url);
    if (current) return current;
    remember(url, entry);
    return entry;
  } catch {
    return undefined;
  }
}

async function write(
  url: string,
  data: unknown,
  generation: number,
  version?: string,
) {
  // Serialize persistent writes too: a slow older cache.put must finish before
  // the newer request writes, even when the response ordering is reversed.
  const previous = writes.get(url) ?? Promise.resolve();
  const task = previous
    .catch(() => {})
    .then(async () => {
      if (generations.get(url) !== generation) return;
      const entry = { data, timestamp: Date.now(), version };
      remember(url, entry);
      try {
        const cache = await storage();
        if (!cache) return;
        // Reinsert to make eviction follow the most recently refreshed entries.
        await cache.put(
          url,
          new Response(JSON.stringify(data), {
            headers: {
              "content-type": "application/json",
              [CACHE_DATE]: String(entry.timestamp),
              ...(version ? { [CACHE_VERSION]: version } : {}),
            },
          }),
        );
        const keys = await cache.keys();
        await Promise.all(
          keys
            .slice(0, Math.max(0, keys.length - MAX_ENTRIES))
            .map((key) => cache.delete(key)),
        );
      } catch {
        /* Storage denial or quota exhaustion must never break a request. */
      }
    });
  writes.set(url, task);
  try {
    await task;
  } finally {
    if (writes.get(url) === task) writes.delete(url);
  }
}

function waitFor<T>(request: Promise<T>, signal?: AbortSignal): Promise<T> {
  if (!signal) return request;
  if (signal.aborted)
    return Promise.reject(new DOMException("Request cancelled", "AbortError"));
  return new Promise((resolve, reject) => {
    const abort = () =>
      reject(new DOMException("Request cancelled", "AbortError"));
    signal.addEventListener("abort", abort, { once: true });
    request
      .then(resolve, reject)
      .finally(() => signal.removeEventListener("abort", abort));
  });
}

/** Persistent TTL cache, shared in-flight requests and an offline fallback. */
export async function cachedJson<T>(
  path: string,
  options: CacheOptions = {},
): Promise<T> {
  const url = new URL(path, location.origin).href;
  const key = `${url}:${options.force ? "refresh" : "normal"}:${options.version ?? ""}`;
  let request = (pending.get(`${url}:refresh:${options.version ?? ""}`) ??
    pending.get(key)) as Promise<T> | undefined;
  if (!request) {
    request = (async () => {
      const saved = await read(url);
      if (
        !options.force &&
        saved &&
        (!options.version || saved.version === options.version) &&
        Date.now() - saved.timestamp < (options.maxAge ?? 300_000)
      )
        return saved.data as T;
      const generation = ++sequence;
      generations.set(url, generation);
      try {
        const response = await fetch(url, {
          cache: options.force ? "reload" : "no-cache",
          signal: AbortSignal.timeout(8000),
        });
        if (!response.ok)
          throw new Error(`Could not load data (${response.status})`);
        const data = (await (options.parse
          ? options.parse(response)
          : response.json())) as T;
        await write(url, data, generation, options.version);
        return data;
      } catch (error) {
        const fallback = (await read(url)) ?? saved;
        if (fallback && options.allowStale !== false) return fallback.data as T;
        throw error;
      } finally {
        if (generations.get(url) === generation) generations.delete(url);
      }
    })();
    pending.set(key, request);
    void request
      .finally(() => {
        if (pending.get(key) === request) pending.delete(key);
      })
      .catch(() => {});
  }
  return waitFor(request, options.signal);
}

export async function cachedAt(path: string): Promise<string | undefined> {
  const entry = await read(new URL(path, location.origin).href);
  return entry ? new Date(entry.timestamp).toISOString() : undefined;
}
