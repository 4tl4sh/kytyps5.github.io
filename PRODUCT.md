# KytyPS5

<!-- impeccable:product-schema 1 -->

## Platform
web

## Stack
React, TypeScript, Vite. The original uses React and Vite. This rebuild uses new frontend code, Motion, Radix and components adapted from the 21st.dev catalog.

## Product Purpose
The official website for a free, open-source PlayStation 5 emulator. Visitors download builds, check game compatibility, read reports, learn installation and contribute.

## Capabilities and Constraints
Flag compatibility reports below the game's historical best on the same operating system, showing the earlier game version when recorded and linking preserved test/build evidence. Current badges and totals remain based on current reports.
Provide dedicated patches and forks directories, searchable by game, title ID and resource name. Game pages show only their associated resources, independently of reports and OS selection. A fork with no explicit game targets appears only in the directory. Known regional IDs map to the same game. Maintain patches manually under `patches/<GAME_ID>/<Patch name>/`, with `description.md` and one or more ZIPs. Collaborators with write access manage forks through `/fork` and `/unfork` on the configured management issue; commands update an automatically checked data PR and publish after merge. Keep the original report workflow and data intact.
Display report-derived compatibility throughout. Automatically feature the nine most recently tested titles with cover artwork and the newest community captures, replacing selections when the runtime index refreshes. Feature badges identify the latest report's platform/status with a visible test date; collection-wide status retains the furthest verified progress across platforms. Keep open detail reports refreshing, preserve the selected platform, and invalidate cached details on content-revision changes. Maintain Pages deep links with queries/hashes and ordinary vertical wheel scrolling past the homepage carousel into captures.
Put the maintainer's six-step Quick Start before the existing documentation. Use varied bottom-up, side-entry and centered content entrances throughout the site; honor reduced-motion preferences.
Returning from game details preserves compatibility search, OS/status filters, sorting, loaded pages and scroll. Refresh repository stats, contributor previews and true contributor totals, release assets and served compatibility data within their cache lifetimes. Preserve original scheduled publication, authorized report ingestion, catalog imports and Pages deployment. Adapter changes may add data fields and frontend checks while retaining the original contracts.
Expose every community capture through the home selector, previous/next, automatic playback with pause, and a keyboard-accessible larger viewer.
Cache images, local fonts, reports, catalog data and GitHub responses persistently, with bounded storage and refresh rules. Production builds cache the application shell and lazy route assets for offline use; visited reports and images remain available offline. Theme changes reveal the actual newly themed page through an expanding circle: top-left for dark mode, bottom-right for light mode. Reduced-motion and unsupported browsers change theme immediately.
Provide a persistent light/dark theme toggle, and a compatibility distribution bar showing each status as a count and percentage of the full tested-title collection. The hero’s actual cards cycle through left, center, right and behind positions every 6.5 seconds, including with reduced motion (instant position changes), and support pause/resume and direct selection.
Preserve all original routes: home, download, compatibility, game/:key, docs, faq, contributing, about and not-found. Preserve per-OS compatibility, filters, search, pagination, reports, screenshots, release assets and notes, system requirements, build tabs and clipboard actions, documentation navigation, FAQ accordions, contributor and repository links. The emulator is experimental; reaching gameplay does not establish playability.

## Brand Commitments
The user requests a complete clean-room frontend redesign and delegates its look and placement. Explore and use 21st.dev components. Serve locally for review. Preserve all original functionality; push to GitHub after parity checks pass.

## Evidence on Hand
Reference repository in .reference (ignored). Retain factual content, exported compatibility data and GPL attribution; write all frontend code from scratch. Game art is official PlayStation catalog artwork. Screenshots are attached community reports and retain their source associations. Live GitHub release data has a local snapshot fallback.

## Users
Inferred from the existing site's workflows: emulator users, game testers and developers.
