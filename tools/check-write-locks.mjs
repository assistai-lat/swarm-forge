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
// Polyrepo (superficies con "repo" en topology.json, ver spec/TOPOLOGIES.md): cada repo se
// escanea con `git -C <root>/<repo>`, y sus rutas se anteponen con "<repo>/" antes de comparar
// contra paths/exclude (que siguen siendo relativos a la raíz de la topología). Con --role solo
// se escanea el repo de esa superficie; sin --role se escanean todos los repos declarados.
// --root fija la raíz de la topología (default: cwd).
//
// Los "infraRoles" declarados como objeto con paths (p. ej. un dba dueño de prisma/**) cuentan
// como una frontera más, con la misma regla de disjunción que las superficies.
//
// Sin --base se revisan solo los cambios sin commitear. Sin dependencias. Node >= 18.

import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { resolve } from "node:path";

// Artefactos de coordinación que cualquier rol puede escribir.
const ALWAYS_ALLOWED = [".swarm/**", ".codex/swarm/**", ".opencode/swarm/**", ".claude/swarm/**", "handoff*.md"];

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

function git(cwd, args) {
  const run = spawnSync("git", ["-C", cwd, ...args], { encoding: "utf8" });
  if (run.status !== 0) throw new Error(`git -C ${cwd} ${args.join(" ")}: ${run.stderr.trim()}`);
  return run.stdout.split("\n").map((l) => l.trim()).filter(Boolean);
}

// Cambios de un solo repo, con sus rutas ya relativas a ese repo (sin prefijo).
function changedFilesIn(cwd, base) {
  const files = new Set([
    ...(base ? git(cwd, ["diff", "--name-only", `${base}...HEAD`]) : []),
    ...git(cwd, ["diff", "--name-only", "HEAD"]),
    ...git(cwd, ["ls-files", "--others", "--exclude-standard"]),
  ]);
  return [...files].map((f) => f.replace(/\\/g, "/")).sort();
}

// Cambios de todos los repos que hacen falta, con las rutas ya antepuestas por "<repo>/"
// cuando corresponde. `repos` es una lista de carpetas de repo (null = raíz de la topología).
function changedFiles(root, repos, base) {
  const all = [];
  for (const repo of repos) {
    const cwd = repo ? resolve(root, repo) : root;
    const prefix = repo ? `${repo}/` : "";
    for (const f of changedFilesIn(cwd, base)) all.push(prefix + f);
  }
  return [...new Set(all)].sort();
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help || !args.topology) {
    console.log("Uso: node tools/check-write-locks.mjs --topology topology.json [--role <workerRole>] [--base <ref>] [--root <path>]");
    process.exit(args.help ? 0 : 2);
  }

  const root = resolve(args.root ?? ".");
  const topology = JSON.parse(readFileSync(resolve(args.topology), "utf8"));
  const surfaces = [
    ...Object.entries(topology.surfaces ?? {}).map(([key, s]) => ({
      key, role: s.workerRole ?? `worker_${key}`, repo: s.repo ?? null, lock: surfaceLock(s),
    })),
    ...(topology.infraRoles ?? []).map((entry) => {
      const s = typeof entry === "string" ? { role: entry } : entry;
      return { key: s.role, role: s.role, repo: s.repo ?? null, lock: surfaceLock(s) };
    }),
  ];

  let files;
  try {
    if (args.role) {
      const surface = surfaces.find((s) => s.role === args.role || s.key === args.role);
      if (!surface) {
        console.error(`Rol desconocido: ${args.role}. Roles en la topología: ${surfaces.map((s) => s.role).join(", ")}`);
        process.exit(2);
      }
      if (surface.lock.paths.length === 0) {
        console.error(`${surface.role} no declara Write-Lock (paths) en topology.json: su trabajo lo acota el DISPATCH.md.`);
        process.exit(2);
      }
      files = changedFiles(root, [surface.repo], args.base);
      files = files.filter((f) => !matchesAny(f, ALWAYS_ALLOWED));
      if (files.length === 0) {
        console.log("Sin cambios que revisar.");
        return;
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

    // Modo reporte: un repo por cada `repo` distinto declarado, más la raíz si alguna
    // superficie no declara repo (o si ninguna lo hace: comportamiento mono-repo de siempre).
    // Las fronteras sin paths no poseen archivos: no obligan a escanear su repo.
    const repos = [...new Set(surfaces.filter((s) => s.lock.paths.length).map((s) => s.repo))];
    if (repos.length === 0) repos.push(null);
    files = changedFiles(root, repos, args.base).filter((f) => !matchesAny(f, ALWAYS_ALLOWED));
  } catch (error) {
    console.error(error.message);
    process.exit(2);
  }

  if (files.length === 0) {
    console.log("Sin cambios que revisar.");
    return;
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
