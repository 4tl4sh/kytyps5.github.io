import { spawn } from "node:child_process";
import { setTimeout } from "node:timers/promises";

const servers = [];
async function start(args, port) {
  let listening = false;
  try {
    listening = (await fetch(`http://127.0.0.1:${port}`)).ok;
  } catch {}
  if (listening) {
    if (port === 5173 && process.env.KYTY_REUSE_DEV_SERVER === "true") return;
    throw new Error(`Port ${port} is already in use`);
  }
  const child = spawn(
    process.execPath,
    [
      "node_modules/vite/bin/vite.js",
      ...args,
      "--host",
      "127.0.0.1",
      "--port",
      String(port),
      "--strictPort",
    ],
    { stdio: "inherit", windowsHide: true },
  );
  servers.push(child);
  let exited = false;
  child.on("exit", () => {
    exited = true;
  });
  const deadline = Date.now() + 30000;
  while (Date.now() < deadline && !exited) {
    try {
      if ((await fetch(`http://127.0.0.1:${port}`)).ok) return;
    } catch {}
    await setTimeout(250);
  }
  throw new Error(`Test server ${port} failed to start`);
}
async function run(script) {
  await new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [`scripts/${script}.mjs`], {
      stdio: "inherit",
      windowsHide: true,
    });
    child.on("error", reject);
    child.on("exit", (code) =>
      code === 0
        ? resolve()
        : reject(new Error(`${script} exited with ${code}`)),
    );
  });
}
try {
  await start([], 5173);
  await start(["preview"], 5174);
  for (const script of [
    "verify",
    "verify-functionality",
    "verify-audit-fixes",
    "verify-featured",
    "verify-enhancements",
    "verify-hero-deck",
    "verify-cache-ripple",
    "verify-parity",
  ])
    await run(script);
} finally {
  for (const server of servers) server.kill();
}
