import { createHash } from "node:crypto";
import { createReadStream } from "node:fs";
import {
  lstat,
  mkdir,
  readdir,
  readFile,
  realpath,
  rm,
  copyFile,
  open,
  writeFile,
} from "node:fs/promises";
import path from "node:path";
import { titleId, validateForkRegistry } from "./forks.mjs";

async function directoryEntries(directory) {
  try {
    const info = await lstat(directory);
    if (info.isSymbolicLink() || !info.isDirectory())
      throw new Error(`Expected a real directory: ${directory}`);
    const entries = await readdir(directory, { withFileTypes: true });
    if (entries.some((entry) => entry.isSymbolicLink()))
      throw new Error(`Symbolic links are not accepted in ${directory}.`);
    return entries.sort((a, b) => a.name.localeCompare(b.name));
  } catch (error) {
    if (error.code === "ENOENT") return [];
    throw error;
  }
}
async function sha256(file) {
  const hash = createHash("sha256");
  for await (const chunk of createReadStream(file)) hash.update(chunk);
  return hash.digest("hex");
}
export function gameResolver(catalog) {
  const games = new Map();
  for (const game of catalog)
    for (const id of [game.titleId, ...(game.allTitleIds ?? [])])
      games.set(titleId(id), game);
  return (id) => {
    const key = titleId(id),
      game = games.get(key);
    return {
      key: game?.titleId ?? key,
      titleId: key,
      title: game?.name ?? key,
      ...(game?.cover ? { cover: game.cover } : {}),
    };
  };
}

/** Patches and fork associations have their own source; reports never enter here. */
export async function buildCommunityData({
  root = process.cwd(),
  catalog,
  registry,
}) {
  validateForkRegistry(registry);
  const game = gameResolver(catalog),
    collections = [],
    copies = [];
  const patchRoot = path.join(root, "patches");
  for (const entry of await directoryEntries(patchRoot)) {
    if (!entry.isDirectory() || entry.name.startsWith(".")) continue;
    const id = titleId(entry.name);
    if (entry.name !== id)
      throw new Error(
        `Patch game folders must use the bare uppercase ID: ${id}.`,
      );
    const collection = { titleId: id, game: game(id), patches: [] };
    for (const folder of await directoryEntries(
      path.join(patchRoot, entry.name),
    )) {
      if (!folder.isDirectory() || folder.name.startsWith(".")) continue;
      const source = path.join(patchRoot, entry.name, folder.name);
      const contents = await directoryEntries(source);
      const descriptionFile = contents.find(
        (file) => file.name === "description.md" && file.isFile(),
      );
      if (!descriptionFile)
        throw new Error(`${id}/${folder.name} needs description.md.`);
      const description = (
        await readFile(path.join(source, "description.md"), "utf8")
      ).trim();
      if (!description || Buffer.byteLength(description) > 262144)
        throw new Error(
          `${id}/${folder.name}: description.md must contain 1–262144 bytes.`,
        );
      const archives = contents.filter(
        (file) => file.isFile() && /\.zip$/i.test(file.name),
      );
      if (!archives.length)
        throw new Error(`${id}/${folder.name} needs at least one ZIP file.`);
      const files = [];
      for (const archive of archives) {
        const file = path.join(source, archive.name),
          info = await lstat(file);
        const handle = await open(file, "r");
        const header = Buffer.alloc(4);
        try {
          await handle.read(header, 0, 4, 0);
        } finally {
          await handle.close();
        }
        if (
          ![/^504b0304$/, /^504b0506$/, /^504b0708$/].some((pattern) =>
            pattern.test(header.toString("hex")),
          )
        )
          throw new Error(`${archive.name} is not a ZIP archive.`);
        const digest = await sha256(file);
        const relative = [id, folder.name, archive.name];
        files.push({
          name: archive.name,
          size: info.size,
          sha256: digest,
          url: `/patch-files/${relative.map(encodeURIComponent).join("/")}?v=${digest.slice(0, 16)}`,
        });
        copies.push({ source: file, segments: relative });
      }
      collection.patches.push({
        id: `${id}/${folder.name}`,
        name: folder.name,
        description,
        files,
      });
    }
    collections.push(collection);
  }
  return {
    data: {
      version: 1,
      forks: registry.forks.map((fork) => ({
        ...fork,
        games: [
          ...new Map(
            fork.targetTitleIds.map((id) => {
              const target = game(id);
              return [target.key, target];
            }),
          ).values(),
        ],
      })),
      patchCollections: collections,
    },
    copies,
  };
}

export async function exportCommunityData(root = process.cwd()) {
  root = await realpath(path.resolve(root));
  const catalog = JSON.parse(
    await readFile(path.join(root, "src/data/games.json"), "utf8"),
  );
  const registry = JSON.parse(
    await readFile(path.join(root, "src/data/forks.json"), "utf8"),
  );
  const { data, copies } = await buildCommunityData({
    root,
    catalog,
    registry,
  });
  const publicRoot = path.join(root, "public");
  await mkdir(publicRoot, { recursive: true });
  if ((await realpath(publicRoot)) !== publicRoot)
    throw new Error(
      "The generated public directory must be inside the project.",
    );
  const output = path.join(publicRoot, "patch-files");
  if (
    path.dirname(output) !== publicRoot ||
    path.basename(output) !== "patch-files"
  )
    throw new Error("Invalid patch output path.");
  try {
    if ((await lstat(output)).isSymbolicLink())
      throw new Error("Generated patch output must not be a symbolic link.");
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
  // Only this dedicated, generated directory is replaced; repository patches stay intact.
  await rm(output, { recursive: true, force: true });
  await mkdir(output, { recursive: true });
  for (const copy of copies) {
    const destination = path.join(output, ...copy.segments);
    if (!destination.startsWith(output + path.sep))
      throw new Error("Patch path escapes the output directory.");
    await mkdir(path.dirname(destination), { recursive: true });
    await copyFile(copy.source, destination);
  }
  await mkdir(path.join(publicRoot, "data"), { recursive: true });
  await writeFile(
    path.join(publicRoot, "data/community.json"),
    JSON.stringify(data) + "\n",
  );
  return data;
}
