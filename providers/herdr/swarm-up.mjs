#!/usr/bin/env node
// Swarm-Forge — Lanzador de rosters mixtos sobre herdr.
// Levanta cada agente del roster con su harness y modelo (claude, agy, opencode, codex...)
// en su propia pestaña de herdr; los writers pueden ir a un git worktree aislado.
//
// Uso (desde un pane de herdr):
//   node providers/herdr/swarm-up.mjs --roster roster.json --phase 0            # simulación
//   node providers/herdr/swarm-up.mjs --roster roster.json --phase 2 --worktree --apply
//   node providers/herdr/swarm-up.mjs --roster roster.json --roles code-reviewer,forensic-auditor --apply
//
// Por defecto es un DRY-RUN: imprime los comandos herdr sin ejecutarlos.

import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { resolve } from "node:path";

function parseArgs(argv) {
  const args = { apply: false, worktree: false, brief: true };
  for (let i = 0; i < argv.length; i++) {
    const key = argv[i].replace(/^--/, "");
    if (key === "apply") args.apply = true;
    else if (key === "worktree") args.worktree = true;
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

// Crea el lugar donde vivirá el agente y devuelve su pane ID.
function createHome(agent, args, opts) {
  if (args.worktree && agent.kind === "writer") {
    const created = herdr(["worktree", "create",
      "--branch", `swarm/${agent.herdrName}`,
      "--label", agent.herdrName,
      "--cwd", args.cwd,
      "--no-focus"], opts);
    if (!opts.apply) return "<pane-del-worktree>";
    return firstPaneOf(created.result.workspace.workspace_id, null, opts);
  }
  const created = herdr(["tab", "create",
    "--workspace", args.workspace,
    "--label", agent.herdrName,
    "--cwd", args.cwd,
    "--no-focus"], opts);
  if (!opts.apply) return "<pane-de-la-pestaña>";
  return created.result.root_pane?.pane_id
    ?? firstPaneOf(args.workspace, created.result.tab.tab_id, opts);
}

// Un pane recién creado puede tardar en mostrar su prompt de shell.
function startAgent(agent, paneId, opts) {
  const args = ["agent", "start", agent.herdrName, "--kind", agent.herdrKind, "--pane", paneId,
    "--timeout", "60000", "--", "--model", agent.model, ...(agent.extraArgs ?? [])];
  for (let attempt = 1; ; attempt++) {
    try {
      return herdr(args, opts);
    } catch (error) {
      if (attempt >= 5 || !/not_ready|shell|prompt/i.test(error.message)) throw error;
      sleep(1500);
    }
  }
}

function briefFor(agent, roster) {
  const lines = [
    `Eres el agente \`${agent.role}\` (plantilla ${agent.template}, fase ${agent.phase}) del enjambre Swarm-Forge "${roster.topology}".`,
    `Tu modelo: ${agent.harness}/${agent.model}. El enjambre mezcla modelos de varios proveedores y no compartís contexto; coordínate solo a través de los artefactos (DISPATCH.md, handoff.md, GATE_STATUS.md).`,
  ];
  if (agent.writeLock) {
    const excluded = agent.writeLockExclude?.length ? ` EXCEPTO ${agent.writeLockExclude.join(", ")}` : "";
    lines.push(`Write-Lock EXCLUSIVO: ${agent.writeLock.join(", ")}${excluded}. Cualquier escritura fuera de estas rutas anula tu entrega.`);
    lines.push(`Antes de entregar ejecuta: ${agent.verifyCommand} (código de salida 0).`);
  }
  if (agent.kind === "judge") {
    lines.push("Eres un juez: nunca modificas código de producto. Emites veredicto PASS/FAIL con evidencia.");
  }
  lines.push("No hagas nada todavía: espera tu DISPATCH del orchestrator.");
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
    console.log("Uso: node providers/herdr/swarm-up.mjs --roster roster.json [--phase 0|2|3|4 | --roles a,b] [--worktree] [--no-brief] [--apply]");
    process.exit(args.help ? 0 : 2);
  }

  if (args.apply && process.env.HERDR_ENV !== "1") {
    console.error("No estás dentro de un pane de herdr (HERDR_ENV != 1). Abre herdr y vuelve a ejecutar.");
    process.exit(1);
  }

  const roster = JSON.parse(readFileSync(resolve(args.roster), "utf8"));
  args.cwd ??= process.cwd();
  args.workspace ??= process.env.HERDR_WORKSPACE_ID ?? "<workspace-actual>";
  const opts = { apply: args.apply };

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
      if (args.brief) herdr(["agent", "prompt", agent.herdrName, briefFor(agent, roster)], opts);
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

  console.log("\nSiguiente: el orchestrator despacha trabajo con");
  console.log('  herdr agent prompt <agente> "Lee DISPATCH.md y ejecuta tu misión" --wait --timeout 1800000');
}

main();
