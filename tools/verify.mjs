#!/usr/bin/env node
// Swarm-Forge — Runner neutral de verificación por superficie.
// Ejecuta los `steps` de una superficie de topology.json con su `env`, y da el mismo resultado
// desde bash, PowerShell o cmd: en Windows los agentes de agy y opencode usan PowerShell y los
// de Claude Code Git Bash, y un `TZ=UTC pnpm test` solo funciona en la segunda.
//
// Uso, desde la raíz del repo de la superficie (o su worktree):
//   node tools/verify.mjs --topology topology.json --surface <clave|workerRole|rol de infraRoles> [--dir <ruta>]
//
// Sin `steps`, ejecuta el `verifyCommand` de la superficie. Se detiene en el primer paso que
// falla y sale con 1; 0 solo si todos salen con 0; 2 si el uso es incorrecto.
// Sin dependencias. Node >= 18.

import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { resolve } from "node:path";

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i++) {
    const key = argv[i].replace(/^--/, "");
    if (key === "help" || key === "h") args.help = true;
    else args[key] = argv[++i];
  }
  return args;
}

// Busca la superficie por su clave o su workerRole, o un rol de infraRoles declarado como objeto.
function findSurface(topology, name) {
  for (const [key, surface] of Object.entries(topology.surfaces ?? {})) {
    if (key === name || surface.workerRole === name) return { name: key, ...surface };
  }
  const infra = (topology.infraRoles ?? []).find((e) => typeof e === "object" && e.role === name);
  return infra ? { name: infra.role, ...infra } : null;
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help || !args.topology || !args.surface) {
    console.log("Uso: node tools/verify.mjs --topology topology.json --surface <clave|workerRole> [--dir <ruta>]");
    process.exit(args.help ? 0 : 2);
  }

  const topology = JSON.parse(readFileSync(resolve(args.topology), "utf8"));
  const surface = findSurface(topology, args.surface);
  if (!surface) {
    const known = [...Object.keys(topology.surfaces ?? {}),
      ...(topology.infraRoles ?? []).filter((e) => typeof e === "object").map((e) => e.role)];
    console.error(`Superficie desconocida: ${args.surface}. En la topología: ${known.join(", ")}`);
    process.exit(2);
  }
  const steps = surface.steps ?? (surface.verifyCommand ? [surface.verifyCommand] : []);
  if (steps.length === 0) {
    console.error(`${surface.name} no declara steps ni verifyCommand en topology.json.`);
    process.exit(2);
  }

  const cwd = resolve(args.dir ?? ".");
  // shell: true usa siempre la shell del sistema (cmd.exe en Windows, /bin/sh en el resto),
  // no la del agente que llama: por eso el resultado no depende de quién verifica.
  const env = { ...process.env, ...(surface.env ?? {}) };
  const envNames = Object.keys(surface.env ?? {});
  console.log(`Verificando ${surface.name} en ${cwd}${envNames.length ? ` (env: ${envNames.join(", ")})` : ""}`);

  for (const step of steps) {
    console.log(`\n▶ ${step}`);
    const started = Date.now();
    const run = spawnSync(step, { cwd, env, stdio: "inherit", shell: true });
    const seconds = ((Date.now() - started) / 1000).toFixed(0);
    if (run.status !== 0) {
      console.error(`\n✗ ${step} salió con ${run.status ?? run.signal} (${seconds} s). VERIFICACIÓN FALLIDA.`);
      process.exit(1);
    }
    console.log(`✓ ${step} (${seconds} s)`);
  }
  console.log(`\n✓ ${surface.name}: los ${steps.length} paso(s) salieron con 0.`);
}

main();
