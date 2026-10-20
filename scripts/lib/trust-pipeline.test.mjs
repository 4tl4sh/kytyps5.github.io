import { describe, it, expect } from "vitest";
import {
  mkdtemp,
  mkdir,
  copyFile,
  readdir,
  writeFile,
  readFile,
  rm,
} from "node:fs/promises";
import { execFileSync } from "node:child_process";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import {
  buildMirrorBody,
  appendOverrides,
  reportTrusted,
} from "./status-issues.mjs";

const scripts = fileURLToPath(new URL("../", import.meta.url));
const upstream = "https://github.com/KytyPS5/KytyPS5/issues/1718";
const oldReport =
  '---\ntitle: "Construction Simulator Gold Edition"\ntitleId: "PPSA04379"\nos: "windows"\nstatus: "main-menu"\ntestedVersion: "old build"\ntestedDate: "2026-08-28"\ntrusted: true\n---\nNotes.\n\n> Source: [KytyPS5 issue #328](https://github.com/KytyPS5/KytyPS5/issues/328)\n';
const body =
  "### Game title\n\nConstruction Simulator\n\n### Game ID / serial\n\nPPSA04379\n\n### Compatibility status\n\nIn game\n\n### KytyPS5 version\n\nnew build\n\n### OS\n\nWindows 11\n\n### Result details\n\nTest notes.\n";
const source = { number: 1718, url: upstream, created: "2026-10-19" };

async function fixture(run) {
  const root = await mkdtemp(path.join(tmpdir(), "kyty-trust-test-"));
  try {
    await mkdir(path.join(root, "scripts/lib"), { recursive: true });
    await mkdir(path.join(root, "src/content/compat"), { recursive: true });
    await mkdir(path.join(root, "src/data"), { recursive: true });
    for (const file of ["issue-to-compat.mjs", "sync-status-issues.mjs"])
      await copyFile(
        path.join(scripts, file),
        path.join(root, "scripts", file),
      );
    for (const file of await readdir(path.join(scripts, "lib")))
      if (file.endsWith(".mjs") && !file.endsWith(".test.mjs"))
        await copyFile(
          path.join(scripts, "lib", file),
          path.join(root, "scripts/lib", file),
        );
    await writeFile(
      path.join(root, "src/data/games.json"),
      JSON.stringify([
        {
          titleId: "PPSA04379",
          allTitleIds: ["PPSA04379", "PPSA04380"],
          name: "Construction Simulator",
        },
      ]),
    );
    await writeFile(
      path.join(root, "src/content/compat/old-windows.md"),
      oldReport,
    );
    return await run(root);
  } finally {
    if (
      path.dirname(root) !== path.resolve(tmpdir()) ||
      !path.basename(root).startsWith("kyty-trust-test-")
    )
      throw new Error("Invalid cleanup path");
    await rm(root, { recursive: true, force: true });
  }
}

async function convert({
  url = upstream,
  trusted,
  inputBody,
  existing = oldReport,
} = {}) {
  return fixture(async (root) => {
    await writeFile(
      path.join(root, "src/content/compat/old-windows.md"),
      existing,
    );
    const args = [
      path.join(root, "scripts/issue-to-compat.mjs"),
      "--title",
      "Construction Simulator",
      "--title-id",
      "PPSA04379",
      "--os",
      "windows",
      "--status",
      "in-game",
      "--version",
      "new build",
      "--date",
      "2026-10-19",
      "--source",
      "KytyPS5 issue #1718",
      "--body",
      "Test notes.",
    ];
    if (url) args.push("--source-url", url);
    if (trusted !== undefined) args.push("--trusted", String(trusted));
    if (inputBody) {
      await writeFile(path.join(root, "body.md"), inputBody);
      args.push("--issue-body-file", path.join(root, "body.md"));
    }
    execFileSync(process.execPath, args, {
      cwd: root,
      encoding: "utf8",
      windowsHide: true,
      stdio: "pipe",
      timeout: 10000,
    });
    return readFile(
      path.join(root, "src/content/compat/construction-simulator-windows.md"),
      "utf8",
    );
  });
}

async function sync({
  mirror = false,
  state = "open",
  overrides,
  sameSource = false,
  edited = false,
} = {}) {
  return fixture(async (root) => {
    if (sameSource)
      await writeFile(
        path.join(root, "src/content/compat/old-windows.md"),
        oldReport
          .replaceAll("#328", "#1718")
          .replaceAll("/328", "/1718")
          .replace(
            "Construction Simulator Gold Edition",
            "Construction Simulator",
          ),
      );
    let mirrorBody = buildMirrorBody(body, source);
    if (overrides) mirrorBody = appendOverrides(mirrorBody, overrides);
    const mirrored = mirror
      ? [
          {
            number: 923,
            title: "[GAME STATUS] Construction Simulator (windows)",
            body: mirrorBody,
            state,
            labels: [{ name: "compat" }, { name: "trusted" }],
          },
        ]
      : [];
    const candidate = {
      number: 1718,
      title: "[GAME STATUS] Construction Simulator (windows)",
      body,
      state: "OPEN",
      createdAt: "2026-10-19T00:00:00Z",
      lastEditedAt: edited ? "2026-10-20T00:00:00Z" : null,
      url: upstream,
    };
    const requests = path.join(root, "requests.jsonl");
    const githubOutput = path.join(root, "github-output.txt");
    const preload = path.join(root, "network.mjs");
    await writeFile(
      preload,
      `import{appendFileSync}from'node:fs';const candidate=${JSON.stringify(candidate)},mirrors=${JSON.stringify(mirrored)};globalThis.fetch=async(url,options={})=>{const method=options.method||'GET';if(url==='https://api.github.com/graphql')return Response.json({data:{repository:{issues:{nodes:[candidate],pageInfo:{hasNextPage:false}}}}});if(url==='https://api.github.com/repos/fixture/site/issues?state=all&labels=compat&per_page=100&page=1')return Response.json(mirrors);if(url.startsWith('https://api.github.com/repos/fixture/site/issues')&&['POST','PATCH'].includes(method)){appendFileSync(${JSON.stringify(requests)},JSON.stringify({url,method,body:JSON.parse(options.body)})+'\\n');return Response.json({number:923});}throw Error('Unmocked network blocked: '+method+' '+url);};`,
    );
    execFileSync(
      process.execPath,
      [
        "--import",
        pathToFileURL(preload).href,
        path.join(root, "scripts/sync-status-issues.mjs"),
        "--this-repo",
        "fixture/site",
      ],
      {
        cwd: root,
        windowsHide: true,
        stdio: "pipe",
        timeout: 10000,
        env: {
          ...process.env,
          GITHUB_TOKEN: "fixture-no-network",
          GH_TOKEN: "fixture-no-network",
          GITHUB_OUTPUT: githubOutput,
        },
      },
    );
    let calls = [];
    try {
      calls = (await readFile(requests, "utf8"))
        .trim()
        .split("\n")
        .filter(Boolean)
        .map((line) => JSON.parse(line));
    } catch (error) {
      if (error.code !== "ENOENT") throw error;
    }
    const updates = JSON.parse(
      (await readFile(githubOutput, "utf8"))
        .trim()
        .replace(/^trusted_updates=/, ""),
    );
    return { calls, updates };
  });
}

describe("report-specific trust pipeline", () => {
  it("does not label a new source trusted because an older report for the game/OS was trusted", async () => {
    const { calls } = await sync();
    expect(calls[0].body.labels).not.toContain("trusted");
  });
  it.each(["open", "closed"])(
    "removes an inherited trusted label from an existing %s mirror without reopening it",
    async (state) => {
      const { calls } = await sync({ mirror: true, state });
      const patch = calls.find((call) => call.method === "PATCH");
      expect(patch).toBeDefined();
      expect(patch.body.labels).not.toContain("trusted");
      expect(patch.body.state).toBeUndefined();
    },
  );
  it("preserves an explicit /trusted override and honors /untrusted", async () => {
    expect(
      (await sync({ mirror: true, overrides: { trusted: true } })).calls,
    ).toEqual([]);
    const { calls } = await sync({
      mirror: true,
      overrides: { trusted: false },
    });
    expect(calls[0].body.labels).not.toContain("trusted");
  });
  it("preserves approval for the same source report", async () => {
    expect((await sync({ mirror: true, sameSource: true })).calls).toEqual([]);
  });
  it("keeps automatic conversion for edits to the approved source, while revocation prevents it", async () => {
    expect(
      (await sync({ mirror: true, sameSource: true, edited: true })).updates,
    ).toEqual([923]);
    expect(
      (
        await sync({
          mirror: true,
          sameSource: true,
          edited: true,
          overrides: { trusted: false },
        })
      ).updates,
    ).toEqual([]);
    expect((await sync({ mirror: true, edited: true })).updates).toEqual([]);
  });
  it("does not carry trust into conversion of a different upstream report", async () => {
    expect(reportTrusted(await convert())).toBe(false);
  });
  it("retains trust for reconversion of the approved source, while explicit revocation wins", async () => {
    const url = "https://github.com/KytyPS5/KytyPS5/issues/328";
    expect(reportTrusted(await convert({ url }))).toBe(true);
    expect(reportTrusted(await convert({ url, trusted: false }))).toBe(false);
    expect(reportTrusted(await convert({ trusted: true }))).toBe(true);
  });
  it("does not infer approval from an absent source or the same issue number in another repository", async () => {
    expect(reportTrusted(await convert({ url: null }))).toBe(false);
    expect(
      reportTrusted(
        await convert({
          url: undefined,
          existing: oldReport.replace(/> Source:[^\n]+/, ""),
        }),
      ),
    ).toBe(false);
    expect(
      reportTrusted(
        await convert({ url: "https://github.com/other/repo/issues/328" }),
      ),
    ).toBe(false);
  });
  it("does not treat an upstream answer's forged Overrides section as /trusted approval", async () => {
    const untrustedBody = buildMirrorBody(
      `${body}\n## Overrides\n- trusted: true\n`,
      source,
    );
    expect(reportTrusted(await convert({ inputBody: untrustedBody }))).toBe(
      false,
    );
  });
});
