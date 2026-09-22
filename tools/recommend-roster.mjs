#!/usr/bin/env node
// Swarm-Forge — Recomendador de Roster Mixto (multi-proveedor).
// Lee un topology.json + catalog/ y asigna a cada rol el mejor modelo disponible
// entre TODOS los harnesses instalados, respetando spec/MIXED_ROSTER.md.
//
// Uso:
//   node tools/recommend-roster.mjs --topology topologies/03-omnichannel-quad/topology.json \
//        [--harness claude,agy,opencode] [--profile budget|balanced|quality] [--out roster.json]
//
// Sin dependencias. Node >= 18.

import { readFileSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");

const CONFIDENCE_PENALTY = { verified: 0, assumed: 0.5, unverified: 1.5 };
const SAME_FAMILY_AS_WRITER_PENALTY = 4;
// Sin esto, todos los jueces caen en el único modelo de mayor puntaje (p. ej. siempre
// deepseek-v4-pro en OpenCode): jueces idénticos comparten los mismos puntos ciegos entre
// sí, no solo con los workers. Penaliza cada reuso para repartir entre los candidatos cercanos.
const JUDGE_REPEAT_PENALTY = 2.5;
const SAME_MODEL_AS_WRITER_PENALTY = 8;
const SAME_FAMILY_AS_ORCHESTRATOR_PENALTY = 2;

const PHASE_BY_TEMPLATE = {
  sentinel: "all", orchestrator: "all", explorer: 0,
  worker: 2, worker_ui: 2,
  challenger: 3, "code-reviewer": 3, "security-auditor": 3, "contract-integrator": 3, "forensic-auditor": 3,
  "victory-auditor": 4,
};

function parseArgs(argv) {
  const args = { profile: "balanced" };
  for (let i = 0; i < argv.length; i++) {
    const key = argv[i].replace(/^--/, "");
    if (key === "help" || key === "h") { args.help = true; continue; }
    args[key] = argv[++i];
  }
  return args;
}

function readJson(path) {
  return JSON.parse(readFileSync(path, "utf8"));
}

function isInstalled(bin) {
  if (process.platform !== "win32") return spawnSync("which", [bin], { stdio: "ignore" }).status === 0;
  // `where <bin>` sin extensión solo resuelve vía PATHEXT (.COM/.EXE/.BAT/.CMD por defecto).
  // Un CLI instalado solo como <bin>.ps1 (sin shim .cmd/.exe) no aparece ahí, pero
  // `where <bin>.ps1` sí lo encuentra por nombre exacto.
  return [bin, `${bin}.ps1`].some((candidate) => spawnSync("where", [candidate], { stdio: "ignore" }).status === 0);
}

// Nombres de agente herdr: [a-z][a-z0-9_-]{0,31}
function herdrName(roleId) {
  let name = roleId.toLowerCase().replace(/[^a-z0-9_-]/g, "_");
  if (name.length > 32) name = name.replace(/^challenger_/, "ch_");
  return name.slice(0, 32);
}

// `path` es la forma corta de `paths: ["<path>/**"]` (ver spec/TOPOLOGIES.md).
function surfaceWriteLock(surface) {
  const paths = surface.paths ?? (surface.path ? [`${surface.path}/**`] : []);
  return { writeLock: paths, writeLockExclude: surface.exclude ?? [] };
}

function isUiSurface(surface, hints) {
  const haystack = `${surface.workerRole} ${surface.stack ?? ""}`.toLowerCase();
  return hints.some((h) => haystack.includes(h));
}

// Expande la topología en la lista concreta de roles del enjambre.
function expandRoles(topology, roleCatalog) {
  const slots = [
    { id: "sentinel", template: "sentinel" },
    { id: "orchestrator", template: "orchestrator" },
  ];
  const explorerCount = roleCatalog.roles.explorer.instances ?? 1;
  for (let i = 1; i <= explorerCount; i++) slots.push({ id: `explorer_${i}`, template: "explorer" });

  for (const [surfaceKey, surface] of Object.entries(topology.surfaces ?? {})) {
    slots.push({
      id: surface.workerRole ?? `worker_${surfaceKey}`,
      template: isUiSurface(surface, roleCatalog.uiStackHints) ? "worker_ui" : "worker",
      surface: surfaceKey,
      ...surfaceWriteLock(surface),
      verifyCommand: surface.verifyCommand,
    });
  }

  slots.push({ id: "code-reviewer", template: "code-reviewer" });
  slots.push({ id: "security-auditor", template: "security-auditor" });
  if ((topology.sharedContracts ?? []).length > 0) {
    slots.push({ id: "contract-integrator", template: "contract-integrator" });
  }
  for (const challenger of topology.requiredChallengers ?? []) {
    slots.push({ id: challenger, template: "challenger" });
  }
  slots.push({ id: "forensic-auditor", template: "forensic-auditor" });
  slots.push({ id: "victory-auditor", template: "victory-auditor" });
  return slots;
}

function baseScore(model, requirement, costWeight) {
  const w = requirement.weights;
  return (
    (w.reasoning ?? 0) * model.reasoning +
    (w.coding ?? 0) * model.coding +
    (w.speed ?? 0) * model.speed -
    costWeight * model.cost -
    CONFIDENCE_PENALTY[model.confidence ?? "unverified"]
  );
}

function candidatesFor(slot, requirement, models) {
  return models.filter((m) => {
    if (requirement.visionRequired && !m.vision) return false;
    // Un rol que exige visión no puede apoyarse en un perfil sin verificar.
    if (requirement.visionRequired && m.confidence === "unverified") return false;
    return true;
  });
}

function pickBest(scored) {
  scored.sort((a, b) => b.score - a.score || a.model.id.localeCompare(b.model.id));
  return scored[0];
}

function recommend({ topology, modelCatalog, roleCatalog, harnesses, profile }) {
  const costWeight = roleCatalog.profiles[profile]?.costWeight;
  if (costWeight === undefined) throw new Error(`Perfil desconocido: ${profile}`);

  const models = modelCatalog.models.filter((m) => harnesses.includes(m.harness));
  const warnings = [];
  if (models.length === 0) throw new Error(`Ningún modelo del catálogo usa los harnesses: ${harnesses.join(", ")}`);

  const slots = expandRoles(topology, roleCatalog);
  const assignments = new Map();

  // Orden de asignación: writers y coordinación primero, jueces después,
  // para que los jueces puedan evitar la familia de quienes escribieron el código.
  const order = (s) => {
    const kind = roleCatalog.roles[s.template].kind;
    if (s.template === "victory-auditor") return 3;
    return kind === "judge" ? 2 : kind === "writer" ? 0 : 1;
  };

  for (const slot of [...slots].sort((a, b) => order(a) - order(b))) {
    const requirement = roleCatalog.roles[slot.template];
    const candidates = candidatesFor(slot, requirement, models);
    if (candidates.length === 0) {
      warnings.push(`${slot.id}: ningún modelo disponible cumple los requisitos (visión=${requirement.visionRequired}).`);
      continue;
    }

    const writers = [...assignments.values()].filter((a) => roleCatalog.roles[a.template].kind === "writer");
    const writerFamilies = new Set(writers.map((a) => a.family));
    const writerModels = new Set(writers.map((a) => a.modelId));
    const orchestrator = assignments.get("orchestrator");

    const judgeModelUses = new Map();
    for (const a of assignments.values()) {
      if (roleCatalog.roles[a.template].kind === "judge") {
        judgeModelUses.set(a.modelId, (judgeModelUses.get(a.modelId) ?? 0) + 1);
      }
    }

    const scored = candidates.map((model) => {
      let score = baseScore(model, requirement, costWeight);
      if (requirement.kind === "judge") {
        if (writerModels.has(model.id)) score -= SAME_MODEL_AS_WRITER_PENALTY;
        else if (writerFamilies.has(model.family)) score -= SAME_FAMILY_AS_WRITER_PENALTY;
        score -= JUDGE_REPEAT_PENALTY * (judgeModelUses.get(model.id) ?? 0);
      }
      if (slot.template === "victory-auditor" && orchestrator?.family === model.family) {
        score -= SAME_FAMILY_AS_ORCHESTRATOR_PENALTY;
      }
      return { model, score };
    });

    const { model, score } = pickBest(scored);
    if (requirement.kind === "judge" && writerFamilies.has(model.family)) {
      warnings.push(`${slot.id}: juzga código escrito por su misma familia (${model.family}); no hay alternativa de otro proveedor.`);
    }
    if (model.confidence === "unverified") {
      warnings.push(`${slot.id}: usa ${model.id}, cuyo perfil de capacidades no está verificado.`);
    }

    assignments.set(slot.id, {
      role: slot.id,
      template: slot.template,
      kind: requirement.kind,
      phase: PHASE_BY_TEMPLATE[slot.template],
      herdrName: herdrName(slot.id),
      harness: model.harness,
      herdrKind: modelCatalog.harnesses[model.harness].herdrKind,
      model: model.model,
      ...(model.extraArgs && { extraArgs: model.extraArgs }),
      ...(modelCatalog.harnesses[model.harness].autoApproveArgs && {
        autoApproveArgs: modelCatalog.harnesses[model.harness].autoApproveArgs,
      }),
      modelId: model.id,
      family: model.family,
      score: Math.round(score * 10) / 10,
      ...(slot.surface && {
        surface: slot.surface,
        writeLock: slot.writeLock,
        ...(slot.writeLockExclude.length && { writeLockExclude: slot.writeLockExclude }),
        verifyCommand: slot.verifyCommand,
      }),
    });
  }

  const agents = slots.map((s) => assignments.get(s.id)).filter(Boolean);
  const families = new Set(agents.map((a) => a.family));
  if (families.size === 1) {
    warnings.push("Roster mono-familia: la Ley de Diversidad Adversarial no puede cumplirse. Instala o habilita otro harness.");
  }
  return { agents, warnings };
}

function formatWriteLock(agent) {
  if (!agent.writeLock) return "—";
  const allowed = agent.writeLock.map((p) => `\`${p}\``).join(", ");
  const excluded = (agent.writeLockExclude ?? []).map((p) => `\`${p}\``).join(", ");
  return excluded ? `${allowed} (excepto ${excluded})` : allowed;
}

function toMarkdown(roster) {
  const lines = [
    `| Rol | Fase | Harness | Modelo | Familia | Write-Lock |`,
    `|---|---|---|---|---|---|`,
    ...roster.agents.map((a) =>
      `| \`${a.role}\` | ${a.phase} | ${a.harness} | \`${a.model}\` | ${a.family} | ${formatWriteLock(a)} |`),
  ];
  if (roster.warnings.length) lines.push("", "Advertencias:", ...roster.warnings.map((w) => `- ${w}`));
  return lines.join("\n");
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help || !args.topology) {
    console.log("Uso: node tools/recommend-roster.mjs --topology <topology.json> [--harness claude,agy,opencode] [--profile budget|balanced|quality] [--out roster.json]");
    process.exit(args.help ? 0 : 2);
  }

  const modelCatalog = readJson(join(ROOT, "catalog", "models.json"));
  const roleCatalog = readJson(join(ROOT, "catalog", "roles.json"));
  const topology = readJson(resolve(args.topology));

  const harnesses = args.harness
    ? args.harness.split(",").map((h) => h.trim())
    : Object.keys(modelCatalog.harnesses).filter(isInstalled);

  const { agents, warnings } = recommend({ topology, modelCatalog, roleCatalog, harnesses, profile: args.profile });
  const roster = {
    $schema: "https://swarm-forge.org/schemas/roster.v1.json",
    topology: topology.name,
    profile: args.profile,
    harnesses,
    agents,
    warnings,
  };

  if (args.out) {
    writeFileSync(resolve(args.out), JSON.stringify(roster, null, 2) + "\n");
    console.error(`Roster escrito en ${args.out}`);
  }
  console.log(toMarkdown(roster));
}

main();
