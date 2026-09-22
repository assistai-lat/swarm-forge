# 🧬 Especificación Universal: Rosters Mixtos Multi-Harness

> **Alcance: Modo B — Multi-Harness (varios CLIs).** Esta especificación se suma a `PROTOCOL.md`, `ROLES.md` y `ARTIFACTS.md`; no los reemplaza. En el Modo A (un solo CLI) los modelos salen de [`ROSETTA_STONE.md`](../ROSETTA_STONE.md). Ver [`SWARM_MODES.md`](../SWARM_MODES.md).

> Un enjambre Swarm-Forge **no tiene por qué vivir dentro de un solo CLI**. Cada rol puede correr en el harness y modelo que mejor cumpla sus requisitos: el Sentinel en Gemini Flash (visión barata), los workers en Claude Sonnet, los auditores en DeepSeek o Gemini Pro.

---

## 1. Por qué mezclar proveedores

La `ROSETTA_STONE.md` traduce los Tiers a **una columna por CLI**: el enjambre entero corre en AGY, o en Claude Code, o en OpenCode. Combinar CLIs añade tres ventajas:

1. **Diversidad adversarial siempre alcanzable.** La Ley de No-Auto-Aprobación prohíbe que un agente apruebe su propio código, pero un Reviewer del mismo modelo que el Worker comparte sus puntos ciegos: tiende a encontrar correcto lo que su familia habría escrito. Un juez de otra familia de modelos es un revisor independiente de verdad.
2. **Costo por capacidad, no por marca.** Cada proveedor es fuerte y barato en cosas distintas. Un roster mixto usa el modelo más barato que cumple cada requisito.
3. **Resiliencia.** Si un proveedor cae o agota la cuota, solo se reasignan los roles afectados.

---

## 2. Ley de Diversidad Adversarial (6ª Ley de [`PROTOCOL.md`](./PROTOCOL.md))

> **Todo rol `judge` (Reviewers, Security, Contract Integrator, Challengers, Forensic y Victory Auditor) debe usar una familia de modelos distinta a la de los `writer` cuyo código evalúa, siempre que exista una alternativa disponible.**

- Si no existe alternativa (roster mono-familia), el recomendador lo permite pero lo **declara como advertencia** en el roster y en el `ANALYSIS_REPORT.md` del Gate M0.
- El `victory-auditor` además prefiere una familia distinta a la del `orchestrator`, reforzando el principio de *Clean-room*.

---

## 3. Modelo de Capacidades

La asignación deja de ser "Tier → modelo del proveedor X" y pasa a ser **requisitos del rol × capacidades del modelo**:

| Archivo | Contenido |
|---|---|
| [`catalog/models.json`](../catalog/models.json) | Cada modelo con su harness (`claude`, `agy`, `opencode`, `codex`...), familia, `reasoning`, `coding`, `speed`, `cost` (1-5), `vision` y `confidence`. |
| [`catalog/roles.json`](../catalog/roles.json) | Cada plantilla de rol con su tipo (`writer` / `judge` / `coord` / `utility`), si exige visión y cómo pondera cada capacidad. Incluye los perfiles `budget`, `balanced` y `quality`. |

### Restricciones duras (filtran candidatos)
1. **Harness instalado:** solo se consideran modelos cuyo CLI está disponible.
2. **Visión:** `sentinel` y workers de UI (`web`, `frontend`, `mobile`, `backoffice`...) solo aceptan modelos con `vision: true` **y** perfil no `unverified` (Imperativo Multimodal de la Rosetta Stone).

### Puntuación (ordena candidatos)
```
score = Σ peso_rol[c] × capacidad_modelo[c]  −  costWeight(perfil) × cost  −  penalización(confidence)
        − 8 si un judge usa el mismo modelo que un writer
        − 4 si un judge usa la misma familia que un writer
        − 2.5 × N si un judge repite un modelo ya usado por N jueces anteriores
        − 2 si el victory-auditor comparte familia con el orchestrator
```
Los writers se asignan primero; los jueces después, conociendo ya qué familias escribieron el código. La penalización por repetición evita que todos los jueces colapsen en el único modelo de mayor puntaje (p. ej. siempre el mismo modelo de texto con `reasoning:5`): jueces idénticos comparten los mismos puntos ciegos entre sí, no solo con los workers.

### Confianza del catálogo
Las capacidades de los modelos cambian cada pocos meses. Cada entrada declara `confidence`:
- `verified` — probada por el equipo.
- `assumed` — inferida de la documentación del proveedor.
- `unverified` — solo se conoce el nombre (descubierto con `agy models`, `opencode models`...).

El recomendador penaliza lo no verificado y lo lista en las advertencias. **Nunca** asigna un perfil `unverified` a un rol que exige visión.

---

## 4. El Artefacto `roster.json`

Salida del recomendador y entrada de los lanzadores. Se guarda en la raíz del proyecto junto a `topology.json`.

```json
{
  "topology": "Dual-Surface-App",
  "profile": "balanced",
  "harnesses": ["claude", "agy", "opencode"],
  "agents": [
    { "role": "worker_backend", "template": "worker", "kind": "writer", "phase": 2,
      "herdrName": "worker_backend", "harness": "claude", "herdrKind": "claude",
      "model": "sonnet", "family": "anthropic",
      "surface": "backend", "writeLock": ["backend/**"], "verifyCommand": "pnpm --filter backend run build" },
    { "role": "forensic-auditor", "template": "forensic-auditor", "kind": "judge", "phase": 3,
      "herdrName": "forensic-auditor", "harness": "agy", "herdrKind": "agy",
      "model": "gemini-3.1-pro-high", "family": "google" }
  ],
  "warnings": []
}
```

Generarlo:
```bash
node tools/recommend-roster.mjs --topology topology.json --profile balanced --out roster.json
```
Sin `--harness`, detecta automáticamente qué CLIs están instalados.

**Vetar modelos** (por costo, calidad o política del cliente) sin editar el catálogo:

| Flag | Efecto |
|---|---|
| `--exclude-harness codex,agy` | Descarta harnesses enteros, aunque estén instalados. |
| `--exclude-model haiku,kimi-k3` | Descarta modelos por su `id` en [`catalog/models.json`](../catalog/models.json). |
| `--exclude-family moonshot` | Descarta todos los modelos de una familia (`anthropic`, `google`, `deepseek`...). |
| `--max-cost 3` | Descarta los modelos con `cost` mayor (escala 1-5 del catálogo). |

Los filtros se aplican antes de puntuar y quedan registrados en `roster.json` (`excludeModels`, `excludeFamilies`, `maxCost`) para que el Gate M0 muestre qué se vetó. Si ningún modelo sobrevive, el recomendador falla y dice qué filtro lo dejó vacío. Recuerda que vetar familias reduce la diversidad adversarial: revisa las advertencias.

---

## 5. Ejecución: ¿quién orquesta a agentes de CLIs distintos?

Los subagentes nativos (`Task` de Claude Code, `invoke_subagent` de AGY, `task` de OpenCode) solo pueden lanzar modelos de su propio CLI. Un roster mixto necesita una **capa neutral** que controle varios CLIs a la vez. Swarm-Forge define dos:

| Capa | Cómo |
|---|---|
| **Multiplexor de agentes** (recomendado) | [`providers/herdr/`](../providers/herdr/): cada rol es un agente real (Claude Code, AGY, OpenCode, Codex...) en su propio pane, controlado por CLI (`herdr agent start / prompt / wait / read`). Los writers pueden aislarse en git worktrees. |
| **Artefactos en disco** | Siempre obligatoria: `DISPATCH.md`, `handoff.md`, `GATE_STATUS.md` y las respuestas en `.swarm/replies/` (canal de respuesta por archivo, con [`ask.mjs`](../providers/herdr/ask.mjs)) son el único canal de estado entre modelos distintos, que no comparten memoria ni formato de herramientas. Nunca se infiere una respuesta de la pantalla. |

---

## 6. Integración con Topology Drift

Cuando `TOPOLOGY_DRIFT.md` detecta una nueva superficie o un cambio de harnesses disponibles, el `orchestrator` debe **regenerar `roster.json`** y reportar en el Gate M0 las reasignaciones y advertencias de diversidad.
