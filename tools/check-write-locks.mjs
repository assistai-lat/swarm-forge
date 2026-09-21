#!/usr/bin/env node
// Swarm-Forge — Verificador de Write-Locks.
// Compara los archivos cambiados en git con la frontera (paths / exclude) de las superficies
// de topology.json. Útil en cualquier CLI, y clave donde los Write-Locks no son físicos (Codex).
//
// Uso:
//   node tools/check-write-locks.mjs --topology topology.json --role worker_backend [--base main]
//       → falla si worker_backend tocó archivos fuera de su frontera.
//   node tools/check-write-locks.mjs --topology topology.json [--base main]
//       → muestra a qué superficie pertenece cada archivo cambiado y marca huérfanos y solapes.
//
// Sin --base se revisan solo los cambios sin commitear. Sin dependencias. Node >= 18.

import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { resolve } from "node:path";

// Artefactos de coordinación que cualquier rol puede escribir.
const ALWAYS_ALLOWED = [".codex/swarm/**", ".opencode/swarm/**", ".claude/swarm/**", "handoff*.md"];

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i++) {
    const key = argv[i].replace(/^--/, "");
    if (key === "help" || key === "h") args.help = true;
    else args[key] = argv[++i];
  }
  return args;
}

// Glob estándar: ** cruza directorios, * y ? no cruzan "/".
function globToRegExp(glob) {
  let re = "";
  for (let i = 0; i < glob.length; i++) {
    const c = glob[i];
    if (c === "*" && glob[i + 1] === "*") {
      const slash = glob[i + 2] === "/";
      re += slash ? "(?:.*/)?" : ".*";
      i += slash ? 2 : 1;
    } else if (c === "*") re += "[^/]*";
    else if (c === "?") re += "[^/]";
    else re += c.replace(/[.+^${}()|[\]\\]/g, "\\$&");
  }
  return new RegExp(`^${re}$`);
}

const matchesAny = (file, globs) => globs.some((g) => globToRegExp(g).test(file));

function surfaceLock(surface) {
  return {
    paths: surface.paths ?? (surface.path ? [`${surface.path}/**`] : []),
    exclude: surface.exclude ?? [],
  };
}

function owns(lock, file) {
  return matchesAny(file, lock.paths) && !matchesAny(file, lock.exclude);
}

function git(args) {
  const run = spawnSync("git", args, { encoding: "utf8" });
  if (run.status !== 0) throw new Error(`git ${args.join(" ")}: ${run.stderr.trim()}`);
  return run.stdout.split("\n").map((l) => l.trim()).filter(Boolean);
}

function changedFiles(base) {
  const files = new Set([
    ...(base ? git(["diff", "--name-only", `${base}...HEAD`]) : []),
    ...git(["diff", "--name-only", "HEAD"]),
    ...git(["ls-files", "--others", "--exclude-standard"]),
  ]);
  return [...files].map((f) => f.replace(/\\/g, "/")).sort();
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help || !args.topology) {
    console.log("Uso: node tools/check-write-locks.mjs --topology topology.json [--role <workerRole>] [--base <ref>]");
    process.exit(args.help ? 0 : 2);
  }

  const topology = JSON.parse(readFileSync(resolve(args.topology), "utf8"));
  const surfaces = Object.entries(topology.surfaces ?? {}).map(([key, s]) => ({
    key, role: s.workerRole ?? `worker_${key}`, lock: surfaceLock(s),
  }));
  const files = changedFiles(args.base).filter((f) => !matchesAny(f, ALWAYS_ALLOWED));

  if (files.length === 0) {
    console.log("Sin cambios que revisar.");
    return;
  }

  if (args.role) {
    const surface = surfaces.find((s) => s.role === args.role || s.key === args.role);
    if (!surface) {
      console.error(`Rol desconocido: ${args.role}. Roles en la topología: ${surfaces.map((s) => s.role).join(", ")}`);
      process.exit(2);
    }
    const violations = files.filter((f) => !owns(surface.lock, f));
    if (violations.length === 0) {
      console.log(`✅ ${surface.role}: los ${files.length} archivo(s) cambiado(s) están dentro de su Write-Lock.`);
      return;
    }
    console.log(`❌ ${surface.role} escribió fuera de su Write-Lock:`);
    for (const f of violations) console.log(`  - ${f}`);
    process.exit(1);
  }

  let problems = 0;
  for (const f of files) {
    const owners = surfaces.filter((s) => owns(s.lock, f)).map((s) => s.role);
    if (owners.length === 1) console.log(`  ${f} → ${owners[0]}`);
    else if (owners.length === 0) { console.log(`⚠️ ${f} → sin dueño (debe asignarlo el DISPATCH, p. ej. a devops)`); problems++; }
    else { console.log(`❌ ${f} → solape entre ${owners.join(", ")} (los Write-Locks deben ser disjuntos)`); problems++; }
  }
  if (problems) process.exitCode = 1;
}

main();
