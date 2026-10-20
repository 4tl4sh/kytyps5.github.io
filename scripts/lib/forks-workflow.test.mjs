import { describe, it, expect } from "vitest";
import { mkdtemp, mkdir, writeFile, readFile, rm } from "node:fs/promises";
import { execFileSync, spawnSync } from "node:child_process";
import { tmpdir } from "node:os";
import { fileURLToPath, pathToFileURL } from "node:url";
import path from "node:path";
import { parse } from "yaml";
import { applyForkCommand, parseForkCommand } from "./forks.mjs";

const script = fileURLToPath(new URL("../manage-forks.mjs", import.meta.url));
const empty = { version: 1, issueNumber: null, lastCommentId: 0, forks: [] };
const repository = {
  id: 1,
  full_name: "tester/fork",
  fork: true,
  source: { full_name: "KytyPS5/KytyPS5" },
};
const comment = {
  id: 20,
  body: "/fork https://github.com/tester/fork PPSA00001",
  user: { login: "tester" },
  created_at: "2026-10-20",
};

async function run({
  permission = "write",
  pending,
  failMetadata = false,
  inputComment = comment,
  metadata = repository,
} = {}) {
  const root = await mkdtemp(path.join(tmpdir(), "kyty-fork-cli-"));
  try {
    await mkdir(path.join(root, "src/data"), { recursive: true });
    await writeFile(
      path.join(root, "src/data/forks.json"),
      JSON.stringify(empty),
    );
    await writeFile(
      path.join(root, "event.json"),
      JSON.stringify({ issue: { number: 7 }, comment: inputComment }),
    );
    const responses = {
      "https://api.github.com/repos/fixture/site/issues/7": {},
      "https://api.github.com/repos/fixture/site/collaborators/tester/permission":
        { permission },
      "https://api.github.com/repos/fixture/site/contents/src/data/forks.json?ref=data%2Fcommunity-forks":
        pending
          ? { content: Buffer.from(JSON.stringify(pending)).toString("base64") }
          : { status: 404 },
      "https://api.github.com/repos/fixture/site/issues/7/comments?per_page=100&page=1":
        [inputComment],
      "https://api.github.com/repos/tester/fork": failMetadata
        ? { status: 503 }
        : metadata,
    };
    const preload = path.join(root, "network.mjs");
    await writeFile(
      preload,
      `const responses = ${JSON.stringify(responses)}; globalThis.fetch = async (url) => { if (!(url in responses)) throw new Error('Unmocked network request blocked: '+url); const data=responses[url]; return new Response(JSON.stringify(data), {status:data.status || 200}); };`,
    );
    let failed = false;
    try {
      execFileSync(
        process.execPath,
        ["--import", pathToFileURL(preload).href, script],
        {
          cwd: root,
          encoding: "utf8",
          timeout: 10000,
          stdio: "pipe",
          env: {
            ...process.env,
            GITHUB_REPOSITORY: "fixture/site",
            GITHUB_EVENT_NAME: "issue_comment",
            GITHUB_EVENT_PATH: path.join(root, "event.json"),
            FORKS_ISSUE_NUMBER: "7",
            GH_TOKEN: "fixture-no-network",
            GITHUB_TOKEN: "fixture-no-network",
            FORK_RESULTS_PATH: path.join(root, "outcomes.json"),
          },
        },
      );
    } catch {
      failed = true;
    }
    return {
      failed,
      registry: JSON.parse(
        await readFile(path.join(root, "src/data/forks.json"), "utf8"),
      ),
    };
  } finally {
    if (
      path.dirname(root) !== path.resolve(tmpdir()) ||
      !path.basename(root).startsWith("kyty-fork-cli-")
    )
      throw new Error("Invalid temporary cleanup path.");
    await rm(root, { recursive: true, force: true });
  }
}
describe("fork workflow integration", () => {
  it("lets a write collaborator force a standalone repository through the actual CLI", async () => {
    const result = await run({
      inputComment: {
        ...comment,
        body: "/force https://github.com/tester/fork PPSA00001 PPSA00002",
      },
      metadata: { ...repository, fork: false, source: undefined },
    });
    expect(result.failed).toBe(false);
    expect(result.registry.forks[0]?.targetTitleIds).toEqual([
      "PPSA00001",
      "PPSA00002",
    ]);
    expect(result.registry.forks[0]?.lineageOverride).toBe(true);
  });
  it.each(["read", "triage"])(
    "keeps /force restricted for %s collaborators",
    async (permission) => {
      const result = await run({
        permission,
        inputComment: {
          ...comment,
          body: "/force https://github.com/tester/fork",
        },
      });
      expect(result.failed).toBe(true);
      expect(result.registry).toEqual(empty);
    },
  );
  it.each(["true", "false"])(
    "checks existing merge state after a failed auto-merge request (%s)",
    async (enabled) => {
      const workflow = parse(
        await readFile(".github/workflows/community-forks.yml", "utf8"),
      );
      const step = workflow.jobs.update.steps.find(
        (step) => step.name === "Enable merge after the checks pass",
      );
      // Exercise the workflow's real shell, with GitHub calls stubbed and no networking.
      const shell =
        process.platform === "win32"
          ? "C:/Program Files/Git/bin/bash.exe"
          : "bash";
      const result = spawnSync(
        shell,
        [
          "-e",
          "-c",
          `
        gh() {
          if [ "$1 $2" = "pr merge" ]; then return 1; fi
          if [ "$1 $2" = "pr view" ]; then printf '%s\\n' '${enabled}'; return 0; fi
          return 2;
        }
        ${step.run}
      `,
        ],
        {
          encoding: "utf8",
          windowsHide: true,
          env: { ...process.env, PR_NUMBER: "123" },
        },
      );
      expect(result.error).toBeUndefined();
      expect(result.status).toBe(enabled === "true" ? 0 : 1);
    },
  );
  it("runs the actual CLI with authenticated write permission and blocked external networking", async () => {
    const result = await run();
    expect(result.failed).toBe(false);
    expect(result.registry.forks[0].targetTitleIds).toEqual(["PPSA00001"]);
    expect(result.registry.lastCommentId).toBe(20);
  });
  it("preserves pending-PR entries before adding another fork", async () => {
    const pending = applyForkCommand(
      empty,
      parseForkCommand("/fork https://github.com/earlier/fork PPSA00002"),
      { ...repository, id: 2, full_name: "earlier/fork" },
      { ...comment, id: 10, siteRepository: "fixture/site" },
      7,
    );
    pending.lastCommentId = 10;
    pending.issueNumber = 7;
    const result = await run({ pending });
    expect(result.failed).toBe(false);
    expect(result.registry.forks).toHaveLength(2);
  });
  it.each(["read", "triage"])(
    "rejects %s collaborators without writing the registry",
    async (permission) => {
      const result = await run({ permission });
      expect(result.failed).toBe(true);
      expect(result.registry).toEqual(empty);
    },
  );
  it("leaves the stored registry untouched on a retryable GitHub outage", async () => {
    const result = await run({ failMetadata: true });
    expect(result.failed).toBe(true);
    expect(result.registry).toEqual(empty);
  });
  it("restricts commands to one configured issue and keeps existing scheduled workflows", async () => {
    const workflow = parse(
      await readFile(".github/workflows/community-forks.yml", "utf8"),
    );
    expect(workflow.jobs.update.if).toContain(
      "github.event.issue.number == fromJSON(vars.FORKS_ISSUE_NUMBER)",
    );
    expect(workflow.jobs.update.if).toContain('"COLLABORATOR"');
    expect(workflow.jobs.update.if).toContain(
      "startsWith(github.event.comment.body, '/force ')",
    );
    expect(workflow.concurrency["cancel-in-progress"]).toBe(false);
    expect(
      parse(await readFile(".github/workflows/import-games.yml", "utf8")).on
        .schedule[0].cron,
    ).toBe("0 4 * * 1");
    expect(
      parse(await readFile(".github/workflows/compat-issues.yml", "utf8")).on
        .schedule[0].cron,
    ).toBe("*/30 * * * *");
  });
});
