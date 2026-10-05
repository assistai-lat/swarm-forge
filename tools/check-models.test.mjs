import test from "node:test";
import assert from "node:assert/strict";
import { loadCatalog, retiredAgents, retiredRule } from "./check-models.mjs";
import { GOLDEN_PRESETS } from "./team.mjs";

const catalog = loadCatalog();

test("Gemini 3.6 y 3.7 Flash están retirados, en cualquier nivel", () => {
  for (const model of ["gemini-3.6-flash-high", "gemini-3.7-flash-low", "gemini-3.7-flash", "google/gemini-3.6-flash-medium"]) {
    assert.ok(retiredRule(model, catalog), `${model} debería estar retirado`);
  }
});

test("el reemplazo sugerido conserva el nivel", () => {
  assert.equal(retiredRule("gemini-3.7-flash-medium", catalog).suggestion, "gemini-3.8-flash-medium");
});

test("los modelos vigentes no se marcan", () => {
  for (const model of ["gemini-3.8-flash-high", "gemini-3.1-pro-high", "opus", "gpt-6.1-sol", "opencode-go/qwen3.6-plus"]) {
    assert.equal(retiredRule(model, catalog), null, `${model} no debería estar retirado`);
  }
});

test("retiredAgents señala solo a los agentes afectados", () => {
  const found = retiredAgents([
    { role: "explorer_1", harness: "agy", model: "gemini-3.6-flash-low" },
    { role: "worker_api", harness: "claude", model: "opus" },
    { role: "challenger", harness: "agy", model: "gemini-3.8-flash-high", modelId: "agy/gemini-3.7-flash-high" },
  ], catalog);
  assert.deepEqual(found.map((f) => f.role), ["explorer_1", "challenger"]);
  assert.equal(found[0].suggestion, "gemini-3.8-flash-low");
});

test("un catálogo sin 'retired' no retira nada", () => {
  assert.equal(retiredRule("gemini-3.6-flash-low", { models: [] }), null);
});

test("ningún modelo del catálogo está retirado", () => {
  const retired = catalog.models.filter((m) => retiredRule(m.model, catalog)).map((m) => m.id);
  assert.deepEqual(retired, []);
});

test("ningún Golden Preset usa un modelo retirado", () => {
  const retired = [];
  for (const [name, preset] of Object.entries(GOLDEN_PRESETS)) {
    for (const [role, cfg] of Object.entries(preset.roles ?? {})) {
      if (cfg?.model && retiredRule(cfg.model, catalog)) retired.push(`${name}/${role}: ${cfg.model}`);
    }
  }
  assert.deepEqual(retired, []);
});
