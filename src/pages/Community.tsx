import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, ArrowUpRight, Search, X } from "lucide-react";
import { External, PageHeading } from "../components/shared";
import {
  ForkList,
  PatchCollectionBlock,
  ResourceFeedback,
} from "../components/community-resources";
import { useCommunityResources } from "../hooks/use-community-resources";
import { websiteRepo } from "../data/community-types";

function ResourceSearch({
  kind,
  query,
  setQuery,
}: {
  kind: "patches" | "forks";
  query: string;
  setQuery: (query: string) => void;
}) {
  return (
    <div className="search-box">
      <Search size={21} aria-hidden="true" />
      <input
        type="search"
        aria-label={`Search ${kind}`}
        placeholder={
          kind === "patches"
            ? "Find a game, title ID or patch…"
            : "Find a fork, game or title ID…"
        }
        value={query}
        onChange={(event) => setQuery(event.target.value)}
      />
      {query && (
        <button aria-label="Clear search" onClick={() => setQuery("")}>
          <X size={18} />
        </button>
      )}
    </div>
  );
}
export function Patches() {
  const resource = useCommunityResources(),
    [query, setQuery] = useState("");
  const collections = useMemo(() => {
    const search = query.trim().toLowerCase();
    return (resource.data?.patchCollections ?? []).flatMap((collection) => {
      if (
        !search ||
        `${collection.titleId} ${collection.game.key} ${collection.game.title}`
          .toLowerCase()
          .includes(search)
      )
        return [collection];
      const patches = collection.patches.filter((patch) =>
        `${patch.name} ${patch.description}`.toLowerCase().includes(search),
      );
      return patches.length ? [{ ...collection, patches }] : [];
    });
  }, [resource.data, query]);
  return (
    <>
      <PageHeading
        title="COMMUNITY PATCHES."
        description="Game-specific fixes, experiments and improvements. Read the patch instructions, choose your package and try the next step."
      >
        <Link to="/docs#community-resources" className="button secondary">
          Using patches
          <ArrowRight size={18} />
        </Link>
      </PageHeading>
      <section
        className="wrap community-directory"
        aria-label="Game patch directory"
      >
        <div className="community-toolbar">
          <ResourceSearch kind="patches" query={query} setQuery={setQuery} />
          <Link className="text-link" to="/forks">
            Explore forks
            <ArrowRight size={17} />
          </Link>
        </div>
        <ResourceFeedback {...resource} />
        {resource.data && (
          <>
            <p className="community-results" aria-live="polite">
              {collections.length}{" "}
              {collections.length === 1
                ? "game collection"
                : "game collections"}
            </p>
            {collections.length ? (
              collections.map((collection) => (
                <PatchCollectionBlock
                  key={collection.titleId}
                  collection={collection}
                />
              ))
            ) : (
              <div className="community-empty">
                <h2>
                  {query
                    ? "No patches match that search."
                    : "The next fix starts here."}
                </h2>
                <p>
                  {query
                    ? "Try a game title, serial or patch name."
                    : "Community patches will appear here as they are published."}
                </p>
                {query ? (
                  <button className="text-link" onClick={() => setQuery("")}>
                    Clear search
                    <ArrowRight size={17} />
                  </button>
                ) : (
                  <External
                    className="text-link"
                    href={`${websiteRepo}/tree/main/patches`}
                  >
                    View the patch repository
                    <ArrowUpRight size={17} />
                  </External>
                )}
              </div>
            )}
          </>
        )}
      </section>
    </>
  );
}
export function Forks() {
  const resource = useCommunityResources(),
    [query, setQuery] = useState(""),
    [scope, setScope] = useState("all");
  const forks = useMemo(
    () =>
      (resource.data?.forks ?? []).filter((fork) => {
        const match =
          `${fork.repository} ${fork.description} ${fork.targetTitleIds.join(" ")} ${fork.games.map((game) => `${game.title} ${game.key}`).join(" ")}`
            .toLowerCase()
            .includes(query.trim().toLowerCase());
        return (
          match &&
          (scope === "all" ||
            (scope === "targeted"
              ? fork.targetTitleIds.length > 0
              : fork.targetTitleIds.length === 0))
        );
      }),
    [resource.data, query, scope],
  );
  return (
    <>
      <PageHeading
        title="COMMUNITY FORKS."
        description="Different branches of the same idea. Explore community builds and see which games their maintainers are targeting."
      >
        <Link to="/compatibility" className="button secondary">
          Explore games
          <ArrowRight size={18} />
        </Link>
      </PageHeading>
      <section
        className="wrap community-directory"
        aria-label="Community fork directory"
      >
        <div className="community-toolbar">
          <ResourceSearch kind="forks" query={query} setQuery={setQuery} />
          <label className="community-scope">
            <span>Game targets</span>
            <select
              aria-label="Fork game targets"
              value={scope}
              onChange={(event) => setScope(event.target.value)}
            >
              <option value="all">All forks</option>
              <option value="targeted">With game targets</option>
              <option value="unassigned">No game targets</option>
            </select>
          </label>
        </div>
        <p className="community-directory-note">
          A fork without game targets is listed here and is not associated with
          any game report.
        </p>
        <ResourceFeedback {...resource} />
        {resource.data && (
          <>
            <p className="community-results" aria-live="polite">
              {forks.length} {forks.length === 1 ? "fork" : "forks"}
            </p>
            {forks.length ? (
              <ForkList forks={forks} />
            ) : (
              <div className="community-empty">
                <h2>
                  {query || scope !== "all"
                    ? "No forks match these filters."
                    : "A place for new directions."}
                </h2>
                <p>
                  {query || scope !== "all"
                    ? "Try another game, repository or target filter."
                    : "Maintainer-listed community forks will appear here."}
                </p>
                {query || scope !== "all" ? (
                  <button
                    className="text-link"
                    onClick={() => {
                      setQuery("");
                      setScope("all");
                    }}
                  >
                    Reset filters
                    <ArrowRight size={17} />
                  </button>
                ) : (
                  <Link className="text-link" to="/docs#community-resources">
                    Read about community resources
                    <ArrowRight size={17} />
                  </Link>
                )}
              </div>
            )}
          </>
        )}
      </section>
    </>
  );
}
