# KytyPS5 — Beyond the console

A complete React + TypeScript frontend rebuild of the KytyPS5 website. The original UI and styles are not reused. Product facts, game records and compatibility reports are preserved.

## Local preview

```sh
npm install
npm run dev
```

Open [http://127.0.0.1:5173/](http://127.0.0.1:5173/). The server intentionally binds to the local machine.

```sh
npm run build   # typecheck and create dist/
npm run preview # serve the production build locally
npm test        # browser interaction and responsive checks; dev server must be running
```

Browser checks use the installed Chrome on Windows. Set `CHROME_PATH` for another Chromium executable and `PREVIEW_URL` for another local server.

## What is included

- Home, download, compatibility, game detail, documentation, FAQ, contribution, about and not-found routes.
- All 347 tested games and 372 OS-specific reports from the reference snapshot; search, status/platform filters, sort and load-more pagination. Returning from a game restores the query, filters, sort, loaded pages and scroll position.
- Game metadata and regional title IDs; original community notes and source links; per-platform status; screenshot viewer; build-age notices; legacy and alternate title-ID links.
- Latest GitHub release assets, release notes, older releases, platform requirements, build tabs and clipboard controls.
- Live repository/contributor information with saved-data fallbacks.
- Quick Start is the first documentation section, with the maintainer's six setup steps and a direct navigation link.
- Directional entrances across routes: bottom-up sections, left/right feature content and gentle centered reveals, with immediate reduced-motion alternatives.
- Homepage captures include the full report screenshot collection, previous/next, automatic playback, pause and a keyboard-accessible larger viewer.
- Accessible Radix navigation/disclosures/tabs/dialogs, local fonts, reduced-motion support and responsive layouts.
- Ten adapted primitives explored through 21st.dev, using Motion. See [COMPONENTS.md](COMPONENTS.md) for sources and attribution.

## Content and data

Community patches and forks have their own [maintenance guide](docs/COMMUNITY_RESOURCES.md). Add patch packages under [`patches/<GAME_ID>/<Patch name>/`](patches/README.md). Collaborators manage fork listings through the dedicated `fork-management` issue using `/fork <URL> [game IDs]` and `/unfork <URL>`. A fork with no IDs targets no games. These resources appear in their directories and on associated game pages independently of compatibility reports.

`src/data/games.json` remains the original full imported game catalog. Markdown reports in `src/content/compat/` remain authoritative. The original parser and status aggregation build `src/data/compat-index.json`, the slim enriched UI seed, and `public/data/compat-index.json`. `public/data/compat/` contains full report payloads. `public/data/catalog.json` contains the full catalog; it is fetched for untested detail routes. `src/data/aliases.json` preserves regional IDs and old report-slug links. `src/data/github.json` is the saved GitHub fallback; releases and community information refresh in the browser. `src/data/content.ts` preserves the factual setup, FAQ and contribution content.

`npm run fetch:data` refreshes the GitHub fallback, `public/data/github.json` and the launcher's `public/data/updates.json` feed. `npm run export:site-compat` rebuilds the bundled game index, aliases, public runtime index, launcher compatibility feed, sitemap and robots file from the report/catalog files. Both run automatically before production builds. Failed GitHub requests preserve saved data; an optional build-only `GITHUB_TOKEN` supports authenticated requests.

Visible pages check for expired data every minute, on returning to the tab and when connectivity returns. GitHub statistics, contributor previews and total contributor count update together; contributor totals use pagination headers rather than the first page's length. The served compatibility index refreshes after five minutes and updates homepage totals, filters and details without a frontend rebuild. Release selection excludes checksum/signature files and recognizes alternate platform filenames.

Compatibility status comes from published test reports. The hero and featured collection automatically select the nine most recently tested games with cover artwork, newest first, with stable title-ID ordering for equal dates. Their badges show the latest report's platform status; the platform and test date are visible. Captures are independently ordered by report date, deduplicated after sorting, and their three quick selectors represent the newest distinct games with captures. There is no fixed featured-title list. These sections update with the runtime index without navigation. Capture badges use the relevant platform's current status. Overall collection status represents the furthest verified progress across platforms, while detail headers/sidebar badges are derived from the same report payload as the visible report. Open reports check on the same five-minute lifetime and refresh immediately when a newly exported content revision is observed, including notes-only edits. Refreshing preserves the selected platform and readable content. New platform reports become available without reloading the page.

GitHub Pages deep links use `public/404.html` and URL-based route restoration in `index.html`, preserving search parameters and hashes even when browser storage is blocked.

The original GitHub Actions pipeline is retained: scheduled upstream issue mirroring, authorized report conversion and overrides, weekly catalog import PRs, half-hourly GitHub snapshot refresh, CI and Pages deployment. The content-only deployment path still regenerates report JSON and overlays it on the last valid full build without installing dependencies. Public launcher feed URLs and schemas remain unchanged. See [INTEGRATIONS.md](INTEGRATIONS.md) for the parity audit and adapter changes.

Game artwork and report screenshots retain their source URLs. No game files or emulator binaries are bundled. Publishing a branch does not replace the live site; Pages deployment remains tied to the default branch and the existing workflow.

## Caching and theme transitions

Startup, route/report loading and release refreshes share a small transparent running-kitten GIF. It uses rounded, solid-color generated artwork, a 12-frame / 960ms loop, and a static PNG for reduced-motion preferences. Both assets are precached for offline startup. `npm run generate:kitty` packages the source sprite sheet; [artwork and generation prompt](design/kitty-loader/README.md) are kept in the project. No GIF encoder runs in the browser.

Images persist in a service-worker cache (up to 96 images): artwork and screenshots refresh after 30 days, contributor avatars after one day. Fonts are cached locally. JSON responses persist across reloads (up to 64 entries), share concurrent requests and fall back to saved responses when offline. Release and report data refresh after five minutes, repository metadata after 15 minutes, contributors after one hour and the catalog after one day. The release refresh button bypasses its saved response. Request generations and serialized persistent writes prevent an older response from replacing newer cache data. Failed JSON responses never replace good cached data. Expired saved images remain available during inspectable HTTP 429/5xx failures, with unchanged timestamps so later requests retry; opaque cross-origin responses do not expose their HTTP status.

Production builds precache the application shell, all route scripts, styles and bundled fonts. After the first successful visit, the site can reload and navigate offline; report payloads and remote images must have been visited first. Development caches images, fonts and JSON while keeping source files live for Vite updates. Browser storage restrictions or quota pressure gracefully fall back to normal requests.

Dark mode expands from the top-left; light mode expands from the bottom-right. Both theme states are captured and prepared before a 600ms reveal. Composited transforms scale a fixed circular window while inverse scaling keeps the page stationary, avoiding a growing clip-path and live color transitions. Reduced-motion preferences and browsers without the View Transition API change theme immediately.

Run `npm run test:cache` with the development server at port 5173 and a production preview at port 5174 (`npm run build`, then `npm run preview -- --port 5174`). It checks ripple direction, interruption, reduced motion, persistent data caching and offline production navigation.

`npm run test:ripple` inspects reveal geometry at desktop, tablet and phone widths, preserves scroll position, runs with 4× CPU throttling, and checks Chrome animation traces for compositor failures. It requires the development server at port 5173.

`npm run test:functionality` checks compatibility history restoration, changing live GitHub responses, offline saved-data fallbacks, runtime compatibility updates, Quick Start layout/deep links, screenshot controls, directional entrances and public launcher feed contracts.

`npm run test:audit-fixes` verifies all 347 indexed titles against their raw platform reports, removes snapshot status fields from featured data, tests changing and newly added platform reports, checks live badges, screenshot error recovery, reverse response/disk-write ordering, image outage recovery, Pages redirects, complete build commands and uninterrupted vertical scrolling over the homepage carousel.

`npm run test:featured` checks newest-first hero/card selection, report platform/date/status, automatic replacement after an index refresh, capture ordering and selector associations, and layout in both themes. Tests explicitly distinguish the latest platform report from a game's best overall progress.

## Design and validation

[PRODUCT.md](PRODUCT.md) captures scope. [DESIGN.md](DESIGN.md) records the implemented visual system. [QA.md](QA.md) records the checks and their limits.

Site content/code follows the original GPL-2.0 license. Third-party component attribution is in COMPONENTS.md.
