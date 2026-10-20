# Compatibility history notices

Game reports display a note when their current status is below the highest previously recorded status for the same game and operating system. The ladder is **Doesn't boot → Logo → Main menu → In game**. Regional title IDs are matched through the catalog. Windows, Linux and macOS are compared separately, so a stronger result on another platform does not produce a warning.

The note identifies the earlier status, game version and test date. If no game version was recorded, it says so. Expand **Earlier test details** to see the earlier emulator build and a link to the preserved report at its Git commit. Game versions and emulator builds remain separate fields. These are differences between published reports, not proof that an emulator change caused the decline.

## Stored peak records

`src/data/compatibility-peaks.json` stores each game's highest result by operating system, with the report's game version, emulator build, date and preserved source link. New results replace a record only when their status is higher, or when they reach the same status on a higher numeric game version. Equivalent versions use the latest test date; a recorded version is preferred to an unknown one. Current lower results never overwrite a higher record, and removed game/platform reports retain their stored peaks.

The initial registry is backfilled from valid historical Markdown reports. Normal exports read that registry and process only report commits after its `throughCommit` checkpoint, then compare current reports against the updated records. The incremental scan includes full merge history and merge-resolution changes, so an intermediate peak is preserved even if a report improves and declines between deployments. It reads only commits reachable from the checked-out `HEAD`. Malformed files that do not satisfy the report schema are excluded.

The normal exporter updates the source registry. The existing weekly games-refresh PR also commits the updated registry and checkpoint. This keeps normal deployments incremental without introducing another approval or report-command workflow. To save a manually refreshed registry sooner, commit `src/data/compatibility-peaks.json` with the intended changes. Per-game detail exports always include new results, even while a newer source checkpoint awaits its weekly merge. The source registry is not a separate public API endpoint.

Historical details are exported as an additive `previousBest` field in `/data/compat/<GAME_ID>.json` only while the current status is lower. Their contents participate in `reportRevision`, so refreshed pages invalidate old detail caches. The browser rechecks the comparison against the loaded current report and removes the note after recovery. A peak initially exported before its report was committed gains its preserved commit link when the equivalent committed report becomes available.

Use a **full Git checkout** when publishing or backfilling. CI, Pages and the weekly catalog job fetch full history. A shallow checkout warns that new comparisons may be incomplete and retains the old checkpoint. A source directory without Git metadata still uses stored peak records and current reports, with a warning that intervening report commits could not be read. A rewritten/unavailable checkpoint triggers a backfill of reachable history while preserving stored peaks. History is bounded by records retained in this repository, not upstream reports that were never imported.

Current compatibility statuses, counts, launcher feeds and report commands are unchanged. Historical peaks do not raise today's compatibility badges or totals.

```sh
npm run export:site-compat
npm run test:unit
npm run test:regressions
```

An explicit initial/backfill operation is available as `node scripts/backfill-compatibility-peaks.mjs`. It preserves existing peak records and supplements them from full history; it is not part of every deployment.
