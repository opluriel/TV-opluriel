import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const serverDirectory = resolve(root, "server");
const clientDirectory = resolve(root, "client");
const npmCli = process.env.npm_execpath;
const children = new Set();
let stopping = false;

function stopChildren() {
  if (stopping) return;
  stopping = true;
  for (const child of children) {
    if (child.exitCode === null) child.kill();
  }
}

process.on("SIGINT", stopChildren);
process.on("SIGTERM", stopChildren);

function runNode(args, cwd) {
  return new Promise((resolveRun, rejectRun) => {
    const child = spawn(process.execPath, args, { cwd, stdio: "inherit" });
    children.add(child);
    child.once("error", rejectRun);
    child.once("exit", (code) => {
      children.delete(child);
      if (code === 0) resolveRun();
      else rejectRun(new Error(`La commande a échoué avec le code ${code ?? "inconnu"}.`));
    });
  });
}

function startNode(args, cwd) {
  const child = spawn(process.execPath, args, { cwd, stdio: "inherit" });
  children.add(child);
  child.once("error", (error) => {
    console.error("Impossible de démarrer un processus de développement.", error);
    stopChildren();
    process.exitCode = 1;
  });
  child.once("exit", (code) => {
    children.delete(child);
    if (!stopping) {
      console.error(`Un processus de développement s’est arrêté (code ${code ?? "inconnu"}).`);
      stopChildren();
      process.exitCode = code === 0 ? 1 : code ?? 1;
    }
  });
}

async function main() {
  if (!npmCli) {
    throw new Error("Lancez cette commande avec npm run dev à la racine du projet.");
  }

  for (const directory of [serverDirectory, clientDirectory]) {
    if (!existsSync(resolve(directory, "node_modules"))) {
      console.log(`Installation des dépendances de ${directory === serverDirectory ? "server" : "client"}…`);
      await runNode([npmCli, "install"], directory);
    }
  }

  console.log("Compilation de l’API…");
  await runNode([npmCli, "run", "build"], serverDirectory);
  if (stopping) return;

  console.log("Démarrage de l’API et de Vite…");
  startNode(["dist/server.js"], serverDirectory);
  startNode(
    [resolve(clientDirectory, "node_modules/vite/bin/vite.js"), "--host", "127.0.0.1"],
    clientDirectory,
  );
  console.log("Interface : http://127.0.0.1:5173 — API : http://127.0.0.1:3001");
}

main().catch((error) => {
  console.error(error);
  stopChildren();
  process.exitCode = 1;
});
