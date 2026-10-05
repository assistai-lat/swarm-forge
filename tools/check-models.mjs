#!/usr/bin/env node
// Swarm-Forge — Verificador de modelos retirados.
// Compara el modelo de cada agente de un roster con la lista "retired" de catalog/models.json
// (familias que el proveedor apaga o va a apagar). swarm-up.mjs usa la misma regla y se niega
// a lanzar un agente con un modelo retirado.
//
// Uso:
//   node tools/check-models.mjs roster.json [otro/roster.json ...]
//       → falla (código 1) si algún agente usa un modelo retirado, y sugiere el reemplazo.
//
// Para retirar una familia basta añadir una entrada a "retired" en catalog/models.json:
//   { "pattern": "<regex sobre el nombre del modelo>", "replaceWith": "<texto que sustituye
//     a lo que casa el patrón>", "since": "AAAA-MM-DD", "reason": "..." }
// Node >= 18.

import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");

export function loadCatalog() {
  return JSON.parse(readFileSync(join(ROOT, "catalog", "models.json"), "utf8"));
}

// Devuelve la regla que retira ese modelo (con el reemplazo sugerido) o null.
export function retiredRule(model, catalog) {
  for (const rule of catalog.retired ?? []) {
    const pattern = new RegExp(rule.pattern, "i");
    if (pattern.test(model)) {
      return { ...rule, suggestion: rule.replaceWith ? model.replace(pattern, rule.replaceWith) : null };
    }
  }
  return null;
}

// Revisa todos los campos de modelo del agente (model, modelId...), no solo "model".
export function retiredAgents(agents, catalog) {
  const found = [];
  for (const agent of agents) {
    for (const [field, value] of Object.entries(agent)) {
      if (!/model/i.test(field) || typeof value !== "string") continue;
      const rule = retiredRule(value, catalog);
      if (rule) {
        found.push({ role: agent.role, field, model: value, reason: rule.reason, suggestion: rule.suggestion });
        break;
      }
    }
  }
  return found;
}

export function describeRetired(entry) {
  const fix = entry.suggestion ? ` → usa ${entry.suggestion}` : "";
  return `${entry.role}: ${entry.model} está retirado${fix}. ${entry.reason ?? ""}`.trim();
}

function main() {
  const paths = process.argv.slice(2).filter((a) => !a.startsWith("--"));
  if (paths.length === 0 || process.argv.includes("--help")) {
    console.log("Uso: node tools/check-models.mjs <roster.json> [<roster.json> ...]");
    process.exit(process.argv.includes("--help") ? 0 : 2);
  }

  const catalog = loadCatalog();
  let problems = 0;
  for (const path of paths) {
    const roster = JSON.parse(readFileSync(resolve(path), "utf8"));
    const retired = retiredAgents(roster.agents ?? [], catalog);
    problems += retired.length;
    console.log(`${retired.length ? "✗" : "✓"} ${path}`);
    for (const entry of retired) console.log(`    ${describeRetired(entry)}`);
  }
  if (problems) process.exitCode = 1;
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) main();
