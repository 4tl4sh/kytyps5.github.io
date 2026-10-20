# Game patches

Maintainers add patch files here manually. This directory is independent of compatibility reports: replacing or updating a game report does not remove its patches.

Use the bare uppercase game title ID for each game folder. A game folder registers that game's patch collection; each child folder is one named patch:

```text
patches/
  PPSA21567/
    Patch name/
      description.md
      patch.zip
      optional-second-package.zip
```

Every patch folder must contain a nonempty `description.md` and at least one `.zip` file. Its folder name becomes the patch name on the site. ZIP filenames may contain spaces; the exporter encodes download URLs automatically. Do not nest ZIPs inside further subfolders. Symbolic links are rejected.

In `description.md`, explain what the patch changes, the game/build/version it applies to, installation steps, requirements, known limitations, and attribution where relevant. Normal Markdown links, lists, tables and code blocks are supported. A link to an adjacent ZIP filename resolves to that package's website download. Other relative links/images resolve to this source folder on GitHub.

```markdown
Improves the game's startup behavior on the specified emulator build.

## Applies to

- Game ID: PPSA21567
- Game version: specify the tested version
- Emulator build: specify the tested build

## Installation

1. Download and extract patch.zip.
2. Follow the installation steps required by this patch.

## Notes

Describe any limitations and credit the patch author.
```

Do not put a ZIP containing game files or emulator binaries here. Add only the related patch files you intend to distribute.

Commit the source files under `patches/`; `public/patch-files/` and `public/data/community.json` are generated outputs. Downloads use `/patch-files/...` so they do not conflict with the `/patches` page. Run:

```sh
npm run export:community
npm run test:community
```

The normal build exports descriptions and download metadata, validates ZIP signatures, copies packages into the published site, and gives updated packages a content revision in their URL. Removing a source patch removes its generated download on the next build. A game collection with no patch subfolders is shown as registered with no packages yet; Git requires a file such as `.gitkeep` to retain an otherwise empty directory.

Known regional IDs are associated with the same catalog game, including its game page. Unknown but valid title IDs retain their own identity. Patches do not change compatibility statuses.

After a patch commit/PR reaches `main`, the existing Pages workflow builds and publishes it. See [community maintenance](../docs/COMMUNITY_RESOURCES.md) for the fork command system.
