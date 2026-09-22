#!/usr/bin/env node
// Swarm-Forge — Lanzador de rosters mixtos sobre herdr.
// Levanta cada agente del roster con su harness y modelo (claude, agy, opencode, codex...)
// en su propia pestaña de herdr; los writers pueden ir a un git worktree aislado.
//
// Uso (desde un pane de herdr):
//   node providers/herdr/swarm-up.mjs --roster roster.json --phase 0            # simulación
//   node providers/herdr/swarm-up.mjs --roster roster.json --phase 2 --worktree --auto --apply
//   node providers/herdr/swarm-up.mjs --roster roster.json --roles code-reviewer,forensic-auditor --apply
//   node providers/herdr/swarm-up.mjs --roster roster.json --phase 2 --worktree --base origin/main --apply
//
// Por defecto es un DRY-RUN: imprime los comandos herdr sin ejecutarlos.
// --auto lanza cada CLI en modo autónomo (sin diálogos de permisos; ver spec/AUTONOMY.md).

import { copyFileSync, existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { join, resolve } from "node:path";

function parseArgs(argv) {
  const args = { apply: false, worktree: false, brief: true, auto: false };
  for (let i = 0; i < argv.length; i++) {
    const key = argv[i].replace(/^--/, "");
    if (key === "apply") args.apply = true;
    else if (key === "worktree") args.worktree = true;
    else if (key === "auto") args.auto = true;
    else if (key === "no-brief") args.brief = false;
    else if (key === "help" || key === "h") args.help = true;
    else args[key] = argv[++i];
  }
  return args;
}

function sleep(ms) {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
}

function quote(arg) {
  return /^[\w@%+=:,./-]+$/.test(arg) ? arg : JSON.stringify(arg);
}

function herdr(args, { apply }) {
  console.log(`  herdr ${args.map(quote).join(" ")}`);
  if (!apply) return null;
  const run = spawnSync("herdr", args, { encoding: "utf8" });
  if (run.status !== 0) {
    const error = new Error(`herdr ${args[0]} ${args[1]} falló: ${(run.stderr || run.stdout).trim()}`);
    error.stderr = run.stderr;
    throw error;
  }
  return run.stdout.trim() ? JSON.parse(run.stdout) : null;
}

function firstPaneOf(workspaceId, tabId, opts) {
  const list = herdr(["pane", "list", "--workspace", workspaceId], opts);
  const panes = list.result.panes.filter((p) => !tabId || p.tab_id === tabId);
  if (panes.length === 0) throw new Error(`No hay panes en ${tabId ?? workspaceId}`);
  return panes[0].pane_id;
}

// Carpeta de trabajo del agente: su repo si declara "repo" (polyrepo, ver spec/TOPOLOGIES.md);
// si no, la raíz de la topología.
function homeDir(agent, args) {
  return agent.repo ? resolve(args.cwd, agent.repo) : args.cwd;
}

function git(dir, args) {
  return spawnSync("git", ["-C", dir, ...args], { encoding: "utf8" });
}

// Se comprueba también en dry-run: es de solo lectura y avisa antes de lanzar nada.
// Devuelve la raíz del repo.
function gitToplevel(dir, agent) {
  const run = git(dir, ["rev-parse", "--show-toplevel"]);
  if (run.status !== 0) {
    throw new Error(`${dir} no es un repositorio git: no se puede crear el worktree de ${agent.role}. ` +
      'Declara "repo" en su superficie o en infraRoles (spec/TOPOLOGIES.md), o lánzalo sin --worktree.');
  }
  return run.stdout.trim();
}

// Ruta del worktree de una rama, según git (no depende de dónde decida crearlo herdr).
function worktreePathOf(repoDir, branch) {
  const lines = git(repoDir, ["worktree", "list", "--porcelain"]).stdout.split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    if (lines[i] === `branch refs/heads/${branch}`) {
      for (let j = i; j >= 0; j--) if (lines[j].startsWith("worktree ")) return lines[j].slice("worktree ".length);
    }
  }
  return null;
}

// "copyEnv": los .env* no están versionados, así que el worktree nace sin ellos y el build o los
// tests fallan. Copia los de la raíz del repo que falten; nunca imprime su contenido.
function copyEnvFiles(repoDir, worktreeDir, opts) {
  const names = readdirSync(repoDir).filter((n) => n.startsWith(".env") && statSync(join(repoDir, n)).isFile());
  if (!opts.apply) {
    console.log(`  (copiaría al worktree los .env* de ${repoDir} que falten: ${names.join(", ") || "ninguno"})`);
    return;
  }
  const copied = names.filter((n) => !existsSync(join(worktreeDir, n)));
  for (const n of copied) copyFileSync(join(repoDir, n), join(worktreeDir, n));
  console.log(`  .env* copiados al worktree: ${copied.join(", ") || "ninguno (ya estaban)"}`);
}

// Crea el lugar donde vivirá el agente y devuelve su pane ID.
function createHome(agent, args, opts) {
  if (args.worktree && agent.kind === "writer") {
    // El worktree se crea DESDE el repo del agente, no desde la raíz de la topología
    // (que en un polyrepo ni siquiera es un repo git).
    const worktreeCwd = homeDir(agent, args);
    const repoDir = gitToplevel(worktreeCwd, agent);
    // La base de la superficie gana sobre --base: en un polyrepo cada repo puede partir de otra rama.
    const base = agent.baseBranch ?? args.base;
    const branch = `swarm/${agent.herdrName}`;
    const created = herdr(["worktree", "create",
      "--branch", branch,
      ...(base ? ["--base", base] : []),
      "--label", agent.herdrName,
      "--cwd", worktreeCwd,
      "--no-focus"], opts);
    if (agent.copyEnv) {
      const worktreeDir = opts.apply ? worktreePathOf(repoDir, branch) : "<worktree>";
      if (!worktreeDir) console.error(`  ⚠️ No encontré el worktree de ${branch}: copia los .env* a mano.`);
      else copyEnvFiles(repoDir, worktreeDir, opts);
    }
    if (!opts.apply) return "<pane-del-worktree>";
    return firstPaneOf(created.result.workspace.workspace_id, null, opts);
  }
  const created = herdr(["tab", "create",
    "--workspace", args.workspace,
    "--label", agent.herdrName,
    "--cwd", homeDir(agent, args),
    "--no-focus"], opts);
  if (!opts.apply) return "<pane-de-la-pestaña>";
  return created.result.root_pane?.pane_id
    ?? firstPaneOf(args.workspace, created.result.tab.tab_id, opts);
}

// Un pane recién creado puede tardar en mostrar su prompt de shell.
function startAgent(agent, paneId, opts) {
  const args = ["agent", "start", agent.herdrName, "--kind", agent.herdrKind, "--pane", paneId,
    "--timeout", "60000", "--", "--model", agent.model, ...(agent.extraArgs ?? []),
    ...(opts.auto ? agent.autoApproveArgs ?? [] : [])];
  for (let attempt = 1; ; attempt++) {
    try {
      return herdr(args, opts);
    } catch (error) {
      if (attempt >= 5 || !/not_ready|shell|prompt/i.test(error.message)) throw error;
      sleep(1500);
    }
  }
}

// Los globs del roster son relativos a la raíz de la topología; un agente de polyrepo trabaja
// dentro de su repo, así que se le dan relativos a él.
function inRepo(agent, globs) {
  const prefix = agent.repo ? `${agent.repo.replace(/\/+$/, "")}/` : "";
  return globs.map((g) => (prefix && g.startsWith(prefix) ? g.slice(prefix.length) : g)).join(", ");
}

// Qué espera cada rol antes de actuar. No todos reciben un DISPATCH: el orchestrator lo
// redacta y los explorers trabajan en la fase 0, cuando todavía no existe.
function waitFor(agent) {
  if (agent.template === "orchestrator") {
    return "Eres el orchestrator: el DISPATCH.md lo redactas tú, no lo esperas. No hagas nada hasta recibir la instrucción del Sentinel o del humano.";
  }
  if (agent.template === "sentinel") return "Eres el Sentinel: no hagas nada hasta que el humano te hable.";
  if (agent.kind === "utility") {
    return "Exploras en la fase 0, antes de que exista el DISPATCH.md: solo lees y reportas, no modificas archivos. No hagas nada hasta recibir tu encargo de exploración del orchestrator.";
  }
  if (agent.template === "victory-auditor") {
    return "Entras al final (fase 4), en contexto limpio. No hagas nada hasta recibir del orchestrator el pedido de auditoría final.";
  }
  if (agent.kind === "judge") return "No hagas nada hasta recibir del orchestrator el pedido de revisión (fase 3).";
  return "No hagas nada todavía: espera tu DISPATCH del orchestrator.";
}

function briefFor(agent, roster, inWorktree) {
  const lines = [
    `Eres el agente \`${agent.role}\` (plantilla ${agent.template}, fase ${agent.phase}) del enjambre Swarm-Forge "${roster.topology}".`,
    `Tu modelo: ${agent.harness}/${agent.model}. El enjambre mezcla modelos de varios proveedores y no compartís contexto; coordínate solo a través de los artefactos (DISPATCH.md, handoff.md, GATE_STATUS.md).`,
  ];
  if (agent.repo) {
    lines.push(`Trabajas en el repositorio \`${agent.repo}\` (tu carpeta actual es su raíz o un worktree suyo); no toques otros repositorios.`);
  }
  if (agent.writeLock) {
    const excluded = agent.writeLockExclude?.length ? ` EXCEPTO ${inRepo(agent, agent.writeLockExclude)}` : "";
    lines.push(`Write-Lock EXCLUSIVO: ${inRepo(agent, agent.writeLock)}${excluded}. Cualquier escritura fuera de estas rutas anula tu entrega.`);
  }
  if (agent.verifyCommand) {
    const where = agent.repo ? " desde la raíz de tu repositorio" : "";
    lines.push(`Antes de entregar ejecuta${where}: ${agent.verifyCommand} (código de salida 0).`);
  }
  if (inWorktree) {
    lines.push("Tu worktree es nuevo: antes de verificar, instala las dependencias en él con el gestor del repo (p. ej. pnpm install --frozen-lockfile --prefer-offline). No enlaces el node_modules del clon: prisma generate y similares escriben ahí y pisarían a las otras sesiones.");
  }
  if (agent.kind === "judge") {
    lines.push("Eres un juez: nunca modificas código de producto. Emites veredicto PASS/FAIL con evidencia.");
  }
  lines.push("Cada pedido que recibas indicará un archivo de respuesta: escribe ahí tu respuesta completa en Markdown, terminada en la marca que se te indique, en vez de responder solo en pantalla.");
  lines.push(waitFor(agent));
  return lines.join(" ");
}

function selectAgents(roster, args) {
  if (args.roles) {
    const wanted = new Set(args.roles.split(","));
    return roster.agents.filter((a) => wanted.has(a.role) || wanted.has(a.herdrName));
  }
  if (args.phase !== undefined) {
    return roster.agents.filter((a) => String(a.phase) === String(args.phase));
  }
  // Sentinel y orchestrator no se lanzan por defecto: el Sentinel suele ser el agente
  // con el que el humano ya está hablando en su pane.
  return roster.agents.filter((a) => a.phase !== "all");
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help || !args.roster) {
    console.log("Uso: node providers/herdr/swarm-up.mjs --roster roster.json [--phase 0|2|3|4 | --roles a,b] [--worktree [--base <ref>]] [--cwd <raíz>] [--auto] [--no-brief] [--apply]");
    process.exit(args.help ? 0 : 2);
  }

  if (args.apply && process.env.HERDR_ENV !== "1") {
    console.error("No estás dentro de un pane de herdr (HERDR_ENV != 1). Abre herdr y vuelve a ejecutar.");
    process.exit(1);
  }

  const roster = JSON.parse(readFileSync(resolve(args.roster), "utf8"));
  args.cwd ??= process.cwd();
  args.workspace ??= process.env.HERDR_WORKSPACE_ID ?? "<workspace-actual>";
  const opts = { apply: args.apply, auto: args.auto };

  const agents = selectAgents(roster, args);
  if (agents.length === 0) {
    console.error("Ningún agente del roster coincide con el filtro.");
    process.exit(1);
  }

  console.log(args.apply ? "Lanzando enjambre mixto:" : "DRY-RUN (añade --apply para ejecutar):");
  const failures = [];
  for (const agent of agents) {
    console.log(`\n# ${agent.role} → ${agent.harness}/${agent.model}`);
    try {
      const paneId = createHome(agent, args, opts);
      startAgent(agent, paneId, opts);
      const inWorktree = args.worktree && agent.kind === "writer";
      if (args.brief) herdr(["agent", "prompt", agent.herdrName, briefFor(agent, roster, inWorktree)], opts);
    } catch (error) {
      // Un agente bloqueado (p.ej. diálogo de confianza del harness) no debe tumbar al resto.
      console.error(`  ✗ ${error.message}`);
      failures.push(agent.herdrName);
    }
  }
  if (failures.length) {
    console.error(`\nRevisa con \`herdr agent read <nombre>\`: ${failures.join(", ")}`);
    process.exitCode = 1;
  }

  // Por ask.mjs y no por `herdr agent prompt --wait`: con AGY y Codex el estado de herdr no es
  // fiable, y la respuesta por archivo es el único canal válido (README, "Canal de respuesta por archivo").
  console.log("\nSiguiente: el orchestrator despacha trabajo y recibe la respuesta por archivo con");
  console.log('  node providers/herdr/ask.mjs <agente> "Lee DISPATCH.md y ejecuta tu misión" --timeout 1800000');
}

main();
