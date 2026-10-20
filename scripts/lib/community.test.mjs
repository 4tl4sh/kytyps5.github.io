import { afterEach, describe, expect, it } from "vitest";
import {
  mkdtemp,
  mkdir,
  writeFile,
  readFile,
  rm,
  readdir,
  symlink,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import {
  parseForkCommand,
  applyForkCommand,
  reconcileForkComments,
  validateForkRegistry,
} from "./forks.mjs";
import { buildCommunityData, exportCommunityData } from "./community-data.mjs";

const empty = () => ({
  version: 1,
  issueNumber: null,
  lastCommentId: 0,
  forks: [],
});
const metadata = {
  id: 42,
  full_name: "Tester/KytyPS5",
  fork: true,
  source: { full_name: "KytyPS5/KytyPS5" },
  description: "A community fork",
};
const comment = {
  id: 10,
  body: "/fork https://github.com/Tester/KytyPS5 PPSA00002",
  created_at: "2026-10-20T12:00:00Z",
  user: { login: "tester" },
  siteRepository: "fixture/site",
};
const catalog = [
  {
    titleId: "PPSA00001",
    allTitleIds: ["PPSA00001", "PPSA00002"],
    name: "Regional Game",
    cover: "https://example.test/game.png",
  },
];
const directories = [];
async function fixture() {
  const root = await mkdtemp(path.join(tmpdir(), "kyty-community-"));
  directories.push(root);
  await mkdir(path.join(root, "src/data"), { recursive: true });
  await writeFile(
    path.join(root, "src/data/games.json"),
    JSON.stringify(catalog),
  );
  await writeFile(
    path.join(root, "src/data/forks.json"),
    JSON.stringify(empty()),
  );
  return root;
}
async function patch(root, id = "PPSA00002", name = "Performance patch") {
  const directory = path.join(root, "patches", id, name);
  await mkdir(directory, { recursive: true });
  await writeFile(
    path.join(directory, "description.md"),
    "# Performance\n\nApply to the specified build.\n",
  );
  // Valid empty ZIP fixture; production assets are never extracted by the site.
  await writeFile(
    path.join(directory, "patch one.zip"),
    Buffer.from("504b0506000000000000000000000000000000000000", "hex"),
  );
  return directory;
}
afterEach(async () => {
  for (const root of directories.splice(0)) {
    if (
      path.dirname(root) !== path.resolve(tmpdir()) ||
      !path.basename(root).startsWith("kyty-community-")
    )
      throw new Error("Unexpected fixture cleanup path.");
    await rm(root, { recursive: true, force: true });
  }
});

describe("collaborator fork commands", () => {
  it("accepts optional bracketed IDs, normalizes regional IDs and deduplicates", () => {
    expect(
      parseForkCommand(
        "/fork https://github.com/Tester/KytyPS5/ [ppsa-00002] PPSA00002 PPSA00001",
      ),
    ).toEqual({
      command: "fork",
      repository: "Tester/KytyPS5",
      targetTitleIds: ["PPSA00001", "PPSA00002"],
    });
  });
  it("an empty target list applies to no games and replaces previous targets", () => {
    const targeted = applyForkCommand(
      empty(),
      parseForkCommand(comment.body),
      metadata,
      comment,
      9,
    );
    const untargeted = applyForkCommand(
      targeted,
      parseForkCommand("/fork https://github.com/Tester/KytyPS5"),
      metadata,
      comment,
      9,
    );
    expect(untargeted.forks).toHaveLength(1);
    expect(untargeted.forks[0].targetTitleIds).toEqual([]);
  });
  it.each([
    "/fork https://github.com/KytyPS5/KytyPS5",
    "/fork http://github.com/a/repo",
    "/fork https://github.com.evil.test/a/repo",
    "/fork https://github.com/a/repo/tree/main",
    "/fork https://github.com/a/repo?token=oops",
    "/fork https://user:password@github.com/a/repo",
    "/fork https://github.com/a/repo INVALID",
    "/unfork https://github.com/a/repo PPSA00001",
    "/fork",
  ])("rejects malformed command %s", (command) =>
    expect(() => parseForkCommand(command)).toThrow(),
  );
  it("requires a real fork of this project and preserves an entry across a rename", () => {
    const command = parseForkCommand(comment.body);
    expect(() =>
      applyForkCommand(
        empty(),
        command,
        { ...metadata, source: { full_name: "someone/other" } },
        comment,
        9,
      ),
    ).toThrow();
    const initial = applyForkCommand(empty(), command, metadata, comment, 9);
    const renamed = applyForkCommand(
      initial,
      parseForkCommand("/fork https://github.com/Tester/Renamed"),
      { ...metadata, full_name: "Tester/Renamed" },
      { ...comment, created_at: "2026-10-21" },
      9,
    );
    expect(renamed.forks).toHaveLength(1);
    expect(renamed.forks[0].addedAt).toBe(comment.created_at);
    expect(renamed.forks[0].repository).toBe("Tester/Renamed");
  });
  it("supports removal without treating an empty target list as global", () => {
    const initial = applyForkCommand(
      empty(),
      parseForkCommand(comment.body),
      metadata,
      comment,
      9,
    );
    const result = applyForkCommand(
      initial,
      parseForkCommand("/unfork https://github.com/tester/kytyps5"),
      null,
      comment,
      9,
    );
    expect(result.forks).toEqual([]);
  });
  it("rejects a corrupt persisted registry", () => {
    expect(() =>
      validateForkRegistry({ ...empty(), lastCommentId: -1 }),
    ).toThrow();
    const registry = applyForkCommand(
      empty(),
      parseForkCommand(comment.body),
      metadata,
      comment,
      9,
    );
    expect(() =>
      validateForkRegistry({
        ...registry,
        forks: [...registry.forks, ...registry.forks],
      }),
    ).toThrow();
  });
  it("replays backlog in order, ignores unauthorized people, and skips saved comments", async () => {
    const result = await reconcileForkComments(
      empty(),
      [
        { ...comment, id: 20, body: "/fork https://github.com/Tester/KytyPS5" },
        { ...comment, id: 1, user: { login: "visitor" } },
        comment,
      ],
      {
        issueNumber: 9,
        siteRepository: "fixture/site",
        permission: async (login) => (login === "tester" ? "write" : "read"),
        repository: async () => metadata,
      },
    );
    expect(result.registry.forks[0].targetTitleIds).toEqual([]);
    expect(result.outcomes).toHaveLength(2);
    expect(result.registry.lastCommentId).toBe(20);
    const repeated = await reconcileForkComments(result.registry, [comment], {
      issueNumber: 9,
      siteRepository: "fixture/site",
      permission: () => {
        throw new Error("Already scanned");
      },
    });
    expect(repeated.outcomes).toEqual([]);
  });
  it("records input errors but retains the cursor for retryable API outages", async () => {
    const options = {
      issueNumber: 9,
      siteRepository: "fixture/site",
      permission: async () => "admin",
      repository: async () => {
        throw Object.assign(new Error("outage"), { retryable: true });
      },
    };
    await expect(
      reconcileForkComments(empty(), [comment], options),
    ).rejects.toThrow("outage");
    const invalid = await reconcileForkComments(
      empty(),
      [{ ...comment, body: "/fork bad" }],
      options,
    );
    expect(invalid.registry.lastCommentId).toBe(comment.id);
    expect(invalid.outcomes[0].ok).toBe(false);
  });
});

describe("independent patch and fork exports", () => {
  it("resolves regional targets and exports every ZIP with a revision and integrity hash", async () => {
    const root = await fixture(),
      source = await patch(root);
    await writeFile(
      path.join(source, "second.zip"),
      Buffer.from("504b0506000000000000000000000000000000000000", "hex"),
    );
    const registry = applyForkCommand(
      empty(),
      parseForkCommand(comment.body),
      metadata,
      comment,
      9,
    );
    await writeFile(
      path.join(root, "src/data/forks.json"),
      JSON.stringify(registry),
    );
    const data = await exportCommunityData(root);
    expect(data.forks[0].games[0].key).toBe("PPSA00001");
    expect(data.patchCollections[0].game.key).toBe("PPSA00001");
    const files = data.patchCollections[0].patches[0].files;
    expect(files).toHaveLength(2);
    expect(files[0].url).toContain("Performance%20patch/patch%20one.zip?v=");
    expect(files[0].sha256).toMatch(/^[a-f0-9]{64}$/);
    expect(
      await readFile(
        path.join(
          root,
          "public/patch-files/PPSA00002/Performance patch/patch one.zip",
        ),
      ),
    ).toEqual(await readFile(path.join(source, "patch one.zip")));
  });
  it("has no implicit target and needs no compatibility reports to retain associations", async () => {
    const root = await fixture();
    await patch(root);
    const registry = applyForkCommand(
      empty(),
      parseForkCommand("/fork https://github.com/Tester/KytyPS5"),
      metadata,
      comment,
      9,
    );
    const { data } = await buildCommunityData({ root, catalog, registry });
    expect(data.forks[0].games).toEqual([]);
    expect(data.patchCollections[0].patches).toHaveLength(1);
    expect(data.patchCollections[0].game.title).toBe("Regional Game");
  });
  it("registers a game directory while clearly exposing zero downloadable packages", async () => {
    const root = await fixture();
    await mkdir(path.join(root, "patches/PPSA00001"), { recursive: true });
    const { data } = await buildCommunityData({
      root,
      catalog,
      registry: empty(),
    });
    expect(data.patchCollections).toHaveLength(1);
    expect(data.patchCollections[0].patches).toEqual([]);
  });
  it("cleans removed generated archives while preserving source patches", async () => {
    const root = await fixture(),
      source = await patch(root);
    await exportCommunityData(root);
    await rm(path.join(root, "patches/PPSA00002"), { recursive: true });
    await exportCommunityData(root);
    expect(await readdir(path.join(root, "public/patch-files"))).toEqual([]);
    expect(source.startsWith(root + path.sep)).toBe(true);
  });
  it.each(["missing-description", "missing-zip", "bad-zip", "bad-id"])(
    "rejects incomplete or invalid content: %s",
    async (kind) => {
      const root = await fixture(),
        source = await patch(
          root,
          kind === "bad-id" ? "not-a-game" : "PPSA00001",
        );
      if (kind === "missing-description")
        await rm(path.join(source, "description.md"));
      if (kind === "missing-zip") await rm(path.join(source, "patch one.zip"));
      if (kind === "bad-zip")
        await writeFile(path.join(source, "patch one.zip"), "not an archive");
      await expect(
        buildCommunityData({ root, catalog, registry: empty() }),
      ).rejects.toThrow();
    },
  );
});
