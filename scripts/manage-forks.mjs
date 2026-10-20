import { readFile, writeFile } from "node:fs/promises";
import {
  FORKS_BRANCH,
  reconcileForkComments,
  validateForkRegistry,
} from "./lib/forks.mjs";

const site = process.env.GITHUB_REPOSITORY;
const token = process.env.GH_TOKEN || process.env.GITHUB_TOKEN;
const issueNumber = Number(process.env.FORKS_ISSUE_NUMBER);
if (
  !/^[\w.-]+\/[\w.-]+$/.test(site ?? "") ||
  !token ||
  !Number.isSafeInteger(issueNumber) ||
  issueNumber <= 0
)
  throw new Error(
    "Configure GITHUB_REPOSITORY, GH_TOKEN and the FORKS_ISSUE_NUMBER repository variable.",
  );
const base = `https://api.github.com/repos/${site}`;
async function api(url, { optional = false } = {}) {
  let response;
  try {
    response = await fetch(url, {
      headers: {
        authorization: `Bearer ${token}`,
        accept: "application/vnd.github+json",
        "x-github-api-version": "2022-11-28",
      },
      signal: AbortSignal.timeout(15000),
    });
  } catch (error) {
    error.retryable = true;
    throw error;
  }
  if (optional && response.status === 404) return null;
  if (!response.ok) {
    const error = new Error(
      `GitHub request failed (${response.status}). Retry the command workflow after GitHub is available.`,
    );
    error.retryable =
      response.status === 429 ||
      response.status >= 500 ||
      response.status === 403;
    throw error;
  }
  return response.json();
}
const issue = await api(`${base}/issues/${issueNumber}`);
if (issue.pull_request)
  throw new Error("The fork registry must use an issue, not a pull request.");
if (process.env.GITHUB_EVENT_NAME === "issue_comment") {
  const event = JSON.parse(
    await readFile(process.env.GITHUB_EVENT_PATH, "utf8"),
  );
  if (
    event.issue?.number !== issueNumber ||
    !event.comment?.id ||
    !event.comment.user?.login
  )
    throw new Error("This is not the configured fork-management issue.");
  const access = await api(
    `${base}/collaborators/${encodeURIComponent(event.comment.user.login)}/permission`,
  );
  if (!["admin", "maintain", "write"].includes(access.permission))
    throw new Error(
      "Only repository collaborators with write access can manage forks.",
    );
}
let registry = validateForkRegistry(
  JSON.parse(await readFile("src/data/forks.json", "utf8")),
);
// Retain commands already queued in an unmerged data PR before replaying the backlog.
const pending = await api(
  `${base}/contents/src/data/forks.json?ref=${encodeURIComponent(FORKS_BRANCH)}`,
  { optional: true },
);
if (pending) {
  const candidate = validateForkRegistry(
    JSON.parse(Buffer.from(pending.content, "base64").toString("utf8")),
  );
  if (
    candidate.issueNumber === issueNumber &&
    candidate.lastCommentId > registry.lastCommentId
  )
    registry = candidate;
}
const comments = [];
for (let page = 1; ; page++) {
  const batch = await api(
    `${base}/issues/${issueNumber}/comments?per_page=100&page=${page}`,
  );
  if (!Array.isArray(batch))
    throw new Error("Invalid GitHub issue comments response.");
  comments.push(...batch);
  if (batch.length < 100) break;
}
const result = await reconcileForkComments(registry, comments, {
  issueNumber,
  siteRepository: site,
  permission: async (login) =>
    (await api(`${base}/collaborators/${encodeURIComponent(login)}/permission`))
      .permission,
  repository: async (repository) => {
    const value = await api(`https://api.github.com/repos/${repository}`, {
      optional: true,
    });
    if (!value)
      throw new Error(
        `Repository ${repository} was not found or is private. Provide a public repository URL.`,
      );
    if (value.private)
      throw new Error("Only public repositories can be listed.");
    return value;
  },
});
await writeFile(
  "src/data/forks.json",
  JSON.stringify(result.registry, null, 2) + "\n",
);
if (process.env.FORK_RESULTS_PATH)
  await writeFile(
    process.env.FORK_RESULTS_PATH,
    JSON.stringify(result.outcomes),
  );
console.log(
  `Reconciled ${result.outcomes.length} collaborator commands; ${result.registry.forks.length} forks listed.`,
);
