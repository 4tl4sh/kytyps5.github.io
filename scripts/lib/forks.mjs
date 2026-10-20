export const UPSTREAM = "KytyPS5/KytyPS5";
export const FORKS_BRANCH = "data/community-forks";

export function titleId(value) {
  const id = String(value)
    .trim()
    .replace(/^\[|\]$/g, "")
    .replace(/-/g, "")
    .toUpperCase();
  if (!/^PPSA\d{5}$/.test(id))
    throw new Error(`Invalid game ID: ${value}. Use PPSA12345.`);
  return id;
}

export function forkRepository(value) {
  let url;
  try {
    url = new URL(value);
  } catch {
    throw new Error(
      "Use a GitHub repository URL, for example https://github.com/owner/repository.",
    );
  }
  if (
    url.protocol !== "https:" ||
    url.hostname !== "github.com" ||
    url.port ||
    url.username ||
    url.password ||
    url.search ||
    url.hash
  )
    throw new Error(
      "Use an HTTPS github.com repository URL without query parameters or a fragment.",
    );
  const match = url.pathname.match(/^\/([\w-]+)\/([\w.-]+?)\/?$/);
  if (!match)
    throw new Error(
      "Link to the repository itself, rather than a branch or release.",
    );
  const repo = `${match[1]}/${match[2].replace(/\.git$/, "")}`;
  if (repo.toLowerCase() === UPSTREAM.toLowerCase())
    throw new Error("That is the main project. Provide a fork of it.");
  return repo;
}

export function parseForkCommand(body) {
  const line = String(body).split(/\r?\n/)[0].trim();
  const match = line.match(/^\/(fork|unfork)\s+(\S+)(?:\s+(.*))?$/i);
  if (!match)
    throw new Error(
      "Use /fork <GitHub URL> [PPSA12345 PPSA67890], or /unfork <GitHub URL>.",
    );
  const repository = forkRepository(match[2]);
  const ids = (match[3] ?? "").trim();
  if (match[1].toLowerCase() === "unfork" && ids)
    throw new Error("/unfork takes only the fork URL.");
  const targetTitleIds = ids
    ? [...new Set(ids.split(/\s+/).map(titleId))].sort()
    : [];
  if (targetTitleIds.length > 100)
    throw new Error("A fork can list at most 100 game IDs.");
  return { command: match[1].toLowerCase(), repository, targetTitleIds };
}

export function validateForkRegistry(value) {
  if (
    value?.version !== 1 ||
    !Array.isArray(value.forks) ||
    !Number.isSafeInteger(value.lastCommentId) ||
    value.lastCommentId < 0 ||
    (value.issueNumber !== null &&
      (!Number.isSafeInteger(value.issueNumber) || value.issueNumber <= 0))
  )
    throw new Error("Invalid fork registry.");
  const seen = new Set();
  for (const fork of value.forks) {
    const repository = forkRepository(fork.url);
    if (
      repository.toLowerCase() !== fork.repository?.toLowerCase() ||
      !Number.isSafeInteger(fork.repositoryId) ||
      fork.repositoryId <= 0 ||
      !Array.isArray(fork.targetTitleIds) ||
      fork.targetTitleIds.length > 100 ||
      typeof fork.description !== "string" ||
      typeof fork.updatedAt !== "string"
    )
      throw new Error(`Invalid fork entry: ${fork.repository ?? "unknown"}.`);
    fork.targetTitleIds.forEach(titleId);
    if (seen.has(fork.repositoryId))
      throw new Error("Duplicate fork repository.");
    seen.add(fork.repositoryId);
  }
  return value;
}

/** A URL without target IDs is deliberately unrelated to every game. */
export function applyForkCommand(
  registry,
  command,
  repository,
  comment,
  issueNumber,
) {
  const next = structuredClone(validateForkRegistry(registry));
  const existing = next.forks.findIndex(
    (fork) =>
      fork.repository.toLowerCase() === command.repository.toLowerCase() ||
      fork.repositoryId === repository?.id,
  );
  if (command.command === "unfork") {
    if (existing < 0)
      throw new Error(
        "That fork is not listed. Use the URL shown in the forks directory.",
      );
    next.forks.splice(existing, 1);
  } else {
    const project =
      repository?.source?.full_name ?? repository?.parent?.full_name;
    if (
      !repository?.fork ||
      project?.toLowerCase() !== UPSTREAM.toLowerCase() ||
      !Number.isSafeInteger(repository.id)
    )
      throw new Error(`The repository must be a GitHub fork of ${UPSTREAM}.`);
    const canonical = forkRepository(
      `https://github.com/${repository.full_name}`,
    );
    const previous = next.forks[existing];
    const entry = {
      repositoryId: repository.id,
      repository: canonical,
      url: `https://github.com/${canonical}`,
      description: String(repository.description ?? "").slice(0, 4000),
      targetTitleIds: command.targetTitleIds,
      archived: Boolean(repository.archived),
      addedAt: previous?.addedAt ?? comment.created_at,
      updatedAt: comment.created_at,
      addedBy: previous?.addedBy ?? comment.user.login,
      sourceCommentId: comment.id,
      sourceUrl: `https://github.com/${comment.siteRepository}/issues/${issueNumber}#issuecomment-${comment.id}`,
    };
    if (existing < 0) next.forks.push(entry);
    else next.forks[existing] = entry;
    next.forks.sort((a, b) => a.repository.localeCompare(b.repository));
  }
  return next;
}

/** Replay the backlog, so GitHub's single pending concurrency slot loses no commands. */
export async function reconcileForkComments(
  registry,
  comments,
  { issueNumber, siteRepository, permission, repository },
) {
  let current = structuredClone(validateForkRegistry(registry));
  if (current.issueNumber && current.issueNumber !== issueNumber)
    throw new Error("The registry belongs to a different management issue.");
  current.issueNumber = issueNumber;
  const outcomes = [],
    permissions = new Map();
  for (const comment of [...comments].sort((a, b) => a.id - b.id)) {
    if (comment.id <= current.lastCommentId) continue;
    if (!Number.isSafeInteger(comment.id) || !comment.user?.login)
      throw new Error("Invalid issue comment from GitHub.");
    const line = String(comment.body ?? "").trim();
    if (/^\/(?:fork|unfork)(?:\s|$)/i.test(line)) {
      const login = comment.user.login;
      if (!permissions.has(login))
        permissions.set(login, await permission(login));
      if (["admin", "maintain", "write"].includes(permissions.get(login))) {
        try {
          const command = parseForkCommand(line);
          const metadata =
            command.command === "fork"
              ? await repository(command.repository)
              : null;
          current = applyForkCommand(
            current,
            command,
            metadata,
            { ...comment, siteRepository },
            issueNumber,
          );
          outcomes.push({
            commentId: comment.id,
            ok: true,
            message: `${command.repository}: ${command.command === "unfork" ? "removed" : command.targetTitleIds.length ? `targets ${command.targetTitleIds.join(", ")}` : "listed without game targets"}.`,
          });
        } catch (error) {
          // A service outage is retryable; never advance past an unprocessed command.
          if (error.retryable) throw error;
          outcomes.push({
            commentId: comment.id,
            ok: false,
            message: error.message,
          });
        }
      }
    }
    current.lastCommentId = comment.id;
  }
  return { registry: validateForkRegistry(current), outcomes };
}
