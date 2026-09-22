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
// Worktrees (swarm-up --worktree): cada writer trabaja en la rama swarm/<agente>, en un worktree
// que herdr crea FUERA del clon (~/.herdr/worktrees/...). Si esa rama existe, se revisa la rama
// (<base>...swarm/<agente>) más lo no commiteado de su worktree, no el directorio del clon. La
// base es la baseBranch de la superficie; --base es el valor por defecto, y sin ninguna de las
// dos, el HEAD del clon. --branch fuerza otra rama con --role.
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
// Sin --base (ni rama de agente) se revisan solo los cambios sin commitear. Node >= 18.

import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { resolve } from "node:path";
import { herdrName } from "./recommend-roster.mjs";

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

function run(cwd, args) {
  return spawnSync("git", ["-C", cwd, ...args], { encoding: "utf8" });
}

function git(cwd, args) {
  const result = run(cwd, args);
  if (result.status !== 0) throw new Error(`git -C ${cwd} ${args.join(" ")}: ${result.stderr.trim()}`);
  return result.stdout.split("\n").map((l) => l.trim()).filter(Boolean);
}

const normalize = (files) => [...new Set(files)].map((f) => f.replace(/\\/g, "/")).sort();

// Lo no commiteado de un directorio de trabajo (clon o worktree).
function uncommittedIn(cwd) {
  return [
    ...git(cwd, ["diff", "--name-only", "HEAD"]),
    ...git(cwd, ["ls-files", "--others", "--exclude-standard"]),
  ];
}

// Cambios de un solo repo, con sus rutas ya relativas a ese repo (sin prefijo).
function changedFilesIn(cwd, base) {
  return normalize([
    ...(base ? git(cwd, ["diff", "--name-only", `${base}...HEAD`]) : []),
    ...uncommittedIn(cwd),
  ]);
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
  return normalize(all);
}

// Ruta del worktree que tiene una rama, según git (igual que en swarm-up.mjs).
function worktreePathOf(repoDir, branch) {
  const lines = git(repoDir, ["worktree", "list", "--porcelain"]);
  for (let i = 0; i < lines.length; i++) {
    if (lines[i] === `branch refs/heads/${branch}`) {
      for (let j = i; j >= 0; j--) if (lines[j].startsWith("worktree ")) return lines[j].slice("worktree ".length);
    }
  }
  return null;
}

// Cambios de un agente con worktree: su rama contra su base, más lo no commiteado de su worktree.
// Devuelve null si la rama no existe (el agente no trabaja en worktree: se revisa el clon).
function agentChanges(root, surface, args, branchOverride) {
  const repoDir = surface.repo ? resolve(root, surface.repo) : root;
  const branch = branchOverride ?? `swarm/${herdrName(surface.role)}`;
  if (run(repoDir, ["rev-parse", "--verify", "--quiet", `refs/heads/${branch}`]).status !== 0) {
    if (branchOverride) throw new Error(`La rama ${branch} no existe en ${repoDir}.`);
    return null;
  }
  const base = surface.baseBranch ?? args.base ?? "HEAD";
  const worktree = worktreePathOf(repoDir, branch);
  const files = [
    ...git(repoDir, ["diff", "--name-only", `${base}...${branch}`]),
    // Si el worktree existe pero git no puede leerlo, git() lanza: nunca "sin cambios" por error.
    ...(worktree ? uncommittedIn(worktree) : []),
  ];
  const prefix = surface.repo ? `${surface.repo}/` : "";
  return {
    branch, base, worktree,
    files: normalize(files).map((f) => prefix + f).filter((f) => !matchesAny(f, ALWAYS_ALLOWED)),
  };
}

function describe(agent) {
  return `rama ${agent.branch} desde ${agent.base}${agent.worktree ? ` + worktree ${agent.worktree}` : ""}`;
}

// Revisa los archivos de un rol contra su frontera. Devuelve cuántas violaciones hubo.
function checkRole(surface, files, source) {
  const where = source ? ` (${source})` : "";
  if (files.length === 0) {
    console.log(`✅ ${surface.role}: sin cambios${where}.`);
    return 0;
  }
  const violations = files.filter((f) => !owns(surface.lock, f));
  if (violations.length === 0) {
    console.log(`✅ ${surface.role}: los ${files.length} archivo(s) cambiado(s) están dentro de su Write-Lock${where}.`);
    return 0;
  }
  console.log(`❌ ${surface.role} escribió fuera de su Write-Lock${where}:`);
  for (const f of violations) console.log(`  - ${f}`);
  return violations.length;
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help || !args.topology) {
    console.log("Uso: node tools/check-write-locks.mjs --topology topology.json [--role <workerRole> [--branch <rama>]] [--base <ref>] [--root <path>]");
    process.exit(args.help ? 0 : 2);
  }

  const root = resolve(args.root ?? ".");
  const topology = JSON.parse(readFileSync(resolve(args.topology), "utf8"));
  const entry = (key, role, s) => ({ key, role, repo: s.repo ?? null, baseBranch: s.baseBranch, lock: surfaceLock(s) });
  const surfaces = [
    ...Object.entries(topology.surfaces ?? {}).map(([key, s]) => entry(key, s.workerRole ?? `worker_${key}`, s)),
    ...(topology.infraRoles ?? []).map((e) => {
      const s = typeof e === "string" ? { role: e } : e;
      return entry(s.role, s.role, s);
    }),
  ];

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
      const agent = agentChanges(root, surface, args, args.branch);
      const files = agent
        ? agent.files
        : changedFiles(root, [surface.repo], args.base).filter((f) => !matchesAny(f, ALWAYS_ALLOWED));
      if (checkRole(surface, files, agent ? describe(agent) : null)) process.exit(1);
      return;
    }

    // Modo reporte. Primero, cada agente con rama propia se compara contra su propia base.
    let problems = 0;
    const withLock = surfaces.filter((s) => s.lock.paths.length);
    for (const surface of withLock) {
      const agent = agentChanges(root, surface, args);
      if (agent) problems += checkRole(surface, agent.files, describe(agent));
    }

    // Después, lo que haya en los clones: un repo por cada `repo` distinto declarado, más la
    // raíz si alguna superficie no declara repo (o si ninguna lo hace: mono-repo de siempre).
    // Las fronteras sin paths no poseen archivos: no obligan a escanear su repo.
    const repos = [...new Set(withLock.map((s) => s.repo))];
    if (repos.length === 0) repos.push(null);
    const files = changedFiles(root, repos, args.base).filter((f) => !matchesAny(f, ALWAYS_ALLOWED));
    if (files.length === 0) console.log("Clones: sin cambios que revisar.");
    for (const f of files) {
      const owners = surfaces.filter((s) => owns(s.lock, f)).map((s) => s.role);
      if (owners.length === 1) console.log(`  ${f} → ${owners[0]}`);
      else if (owners.length === 0) { console.log(`⚠️ ${f} → sin dueño (debe asignarlo el DISPATCH, p. ej. a devops)`); problems++; }
      else { console.log(`❌ ${f} → solape entre ${owners.join(", ")} (los Write-Locks deben ser disjuntos)`); problems++; }
    }
    if (problems) process.exitCode = 1;
  } catch (error) {
    console.error(error.message);
    process.exit(2);
  }
}

main();
