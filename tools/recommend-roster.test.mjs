// Tests del recomendador de rosters. Sin dependencias: node --test (desde la raíz del repo).
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { recommend } from "./recommend-roster.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const readJson = (path) => JSON.parse(readFileSync(resolve(ROOT, path), "utf8"));
const modelCatalog = readJson("catalog/models.json");
const roleCatalog = readJson("catalog/roles.json");

const kindOf = (agent) => roleCatalog.roles[agent.template].kind;

function judgesSharingWriterFamily(agents) {
  const writerFamilies = new Set(agents.filter((a) => kindOf(a) === "writer").map((a) => a.family));
  return agents.filter((a) => kindOf(a) === "judge" && writerFamilies.has(a.family));
}

// SF-4: topología de Kasah (4 superficies + contratos + 2 challengers). En "quality",
// Opus superaba la penalización de familia y quedaba de contract-integrator juzgando
// a 4 workers Sonnet, con un aviso falso de "no hay alternativa".
const kasah = {
  name: "Kasah-draft",
  surfaces: {
    api: { path: "kasah-api", stack: "nestjs-prisma", workerRole: "worker_api" },
    web: { path: "kasah-web", stack: "nextjs-web", workerRole: "worker_web" },
    backoffice: { path: "kasah-bo", stack: "nextjs-backoffice", workerRole: "worker_backoffice" },
    mobile: { path: "kasah-mob", stack: "flutter", workerRole: "worker_mobile" },
  },
  sharedContracts: ["kasah-api/src/**/dto/**"],
  requiredChallengers: ["challenger_backward_compat", "challenger_payments_rbac"],
};

for (const profile of ["quality", "balanced", "budget"]) {
  test(`6ª Ley en perfil ${profile}: ningún juez comparte familia con los writers si hay alternativa`, () => {
    const { agents, warnings } = recommend({
      topology: kasah, modelCatalog, roleCatalog, harnesses: ["claude", "agy", "opencode"], profile,
    });
    assert.deepEqual(judgesSharingWriterFamily(agents).map((a) => `${a.role}=${a.family}`), []);
    assert.equal(warnings.filter((w) => w.includes("misma familia")).length, 0);
  });
}

test("victory-auditor usa otra familia que el orchestrator cuando existe", () => {
  for (const profile of ["quality", "balanced", "budget"]) {
    const { agents } = recommend({
      topology: kasah, modelCatalog, roleCatalog, harnesses: ["claude", "agy", "opencode"], profile,
    });
    const orchestrator = agents.find((a) => a.role === "orchestrator");
    const victory = agents.find((a) => a.role === "victory-auditor");
    assert.notEqual(victory.family, orchestrator.family, profile);
  }
});

test("roster mono-familia: cae a la misma familia y el aviso lo dice", () => {
  const { agents, warnings } = recommend({
    topology: kasah, modelCatalog, roleCatalog, harnesses: ["claude"], profile: "quality",
  });
  const judges = agents.filter((a) => kindOf(a) === "judge");
  assert.ok(judges.length > 0);
  assert.ok(judges.every((a) => a.family === "anthropic"));
  assert.equal(warnings.filter((w) => w.includes("misma familia")).length, judges.length);
});

test("con una sola familia alternativa, los jueces la usan aunque puntúe mucho menos", () => {
  const catalog = {
    harnesses: modelCatalog.harnesses,
    models: [
      { id: "a/top", harness: "claude", model: "top", family: "alpha", reasoning: 5, coding: 5, speed: 3, cost: 1, vision: true, confidence: "verified" },
      { id: "b/weak", harness: "opencode", model: "weak", family: "beta", reasoning: 1, coding: 1, speed: 1, cost: 5, vision: false, confidence: "unverified" },
    ],
  };
  const topology = { name: "t", surfaces: { api: { path: "api", stack: "node", workerRole: "worker_api" } } };
  const { agents, warnings } = recommend({
    topology, modelCatalog: catalog, roleCatalog, harnesses: ["claude", "opencode"], profile: "quality",
  });
  assert.equal(agents.find((a) => a.role === "worker_api").family, "alpha");
  for (const judge of agents.filter((a) => kindOf(a) === "judge")) assert.equal(judge.family, "beta", judge.role);
  assert.equal(warnings.filter((w) => w.includes("misma familia")).length, 0);
});
