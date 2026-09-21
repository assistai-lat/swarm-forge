#!/usr/bin/env node
// Swarm-Forge — Pedido con respuesta por archivo sobre herdr.
// Envía un pedido a un agente y espera su respuesta en un archivo Markdown con una
// marca de fin, en vez de inferirla de la pantalla o del estado del agente.
//
// Uso (desde un pane de herdr):
//   node providers/herdr/ask.mjs <agente> "<pedido>" [--dir .swarm/replies] [--timeout 1800000]
//
// Imprime la respuesta por stdout (sin la marca) y sale con:
//   0 respuesta completa · 1 timeout · 2 uso incorrecto · 3 agente bloqueado (blocked)
// Sin dependencias. Node >= 18.

import { existsSync, mkdirSync, readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { resolve } from "node:path";

const DONE_MARKER = "<!-- SWARM:DONE -->";
const POLL_MS = 3000;

function parseArgs(argv) {
  const args = { positional: [] };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--help" || argv[i] === "-h") args.help = true;
    else if (argv[i].startsWith("--")) args[argv[i].slice(2)] = argv[++i];
    else args.positional.push(argv[i]);
  }
  return args;
}

function sleep(ms) {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
}

function herdr(args) {
  const run = spawnSync("herdr", args, { encoding: "utf8" });
  if (run.status !== 0) throw new Error(`herdr ${args.slice(0, 2).join(" ")} falló: ${(run.stderr || run.stdout).trim()}`);
  return run.stdout.trim() ? JSON.parse(run.stdout) : null;
}

// El estado de herdr no es fiable en todos los CLIs (ver providers/herdr/README.md),
// así que solo se usa como aviso temprano: la fuente de verdad es el archivo.
function agentStatus(agent) {
  try {
    return herdr(["agent", "get", agent]).result.agent.agent_status;
  } catch {
    return "unknown";
  }
}

function replyInstructions(replyPath) {
  return `IMPORTANTE: cuando termines, escribe tu respuesta COMPLETA en Markdown en el archivo ${replyPath} ` +
    `(puedes crear ese archivo aunque esté fuera de tu Write-Lock; no crees ningún otro). ` +
    `La última línea del archivo debe ser exactamente: ${DONE_MARKER} . ` +
    `Escríbela solo cuando la respuesta esté completa. En la pantalla basta con indicar la ruta del archivo.`;
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const [agent, request] = args.positional;
  if (args.help || !agent || !request) {
    console.log('Uso: node providers/herdr/ask.mjs <agente> "<pedido>" [--dir .swarm/replies] [--timeout <ms>]');
    process.exit(args.help ? 0 : 2);
  }
  if (process.env.HERDR_ENV !== "1") {
    console.error("No estás dentro de un pane de herdr (HERDR_ENV != 1).");
    process.exit(2);
  }

  const dir = resolve(args.dir ?? ".swarm/replies");
  mkdirSync(dir, { recursive: true });
  const replyPath = resolve(dir, `${agent}-${Date.now()}.md`).replace(/\\/g, "/");
  const timeout = Number(args.timeout ?? 1_800_000);

  // --wait con un timeout corto solo confirma la entrega: "timeout" significa que el agente
  // sigue trabajando (bien); "agent_prompt_stalled" significa que no se vio actividad.
  // No se reenvía: un falso "stalled" (estado mal detectado) duplicaría el pedido.
  try {
    herdr(["agent", "prompt", agent, `${request} ${replyInstructions(replyPath)}`, "--wait", "--timeout", "20000"]);
  } catch (error) {
    if (/agent_prompt_stalled/.test(error.message)) {
      console.error(`⚠️ No se vio actividad en ${agent}: el pedido pudo no llegar. Revisa: herdr agent read ${agent}`);
    } else if (/agent_blocked/.test(error.message)) {
      console.error(`${agent} ya estaba esperando una aprobación o respuesta. Revísalo con: herdr agent read ${agent}`);
      process.exit(3);
    } else if (!/timeout/i.test(error.message)) {
      throw error;
    }
  }
  console.error(`Pedido enviado a ${agent}. Esperando ${replyPath}`);

  const deadline = Date.now() + timeout;
  while (Date.now() < deadline) {
    if (existsSync(replyPath)) {
      const content = readFileSync(replyPath, "utf8");
      if (content.includes(DONE_MARKER)) {
        console.log(content.replace(DONE_MARKER, "").trimEnd());
        return;
      }
    }
    if (agentStatus(agent) === "blocked") {
      console.error(`${agent} está esperando una aprobación o respuesta. Revísalo con: herdr agent read ${agent}`);
      process.exit(3);
    }
    sleep(POLL_MS);
  }

  console.error(`Sin respuesta completa de ${agent} tras ${timeout} ms. Revisa: herdr agent read ${agent} --source recent-unwrapped`);
  process.exit(1);
}

main();
