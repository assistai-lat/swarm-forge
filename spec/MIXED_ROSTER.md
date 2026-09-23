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
- El `victory-auditor` además usa una familia distinta a la del `orchestrator` cuando existe (principio de *Clean-room*); si no existe, se avisa.
- Es una **restricción dura**, no una preferencia: un juez de la misma familia solo aparece cuando no queda ningún candidato de otra.

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
3. **Familia de los jueces (6ª Ley):** un `judge` solo considera modelos de familias que no escribieron código. Si no queda ninguno, cae a la misma familia y lo avisa. El `victory-auditor` descarta además la familia del `orchestrator`, con el mismo fallback.

> Antes la familia era una penalización (−4) y un modelo con mucho puntaje base la superaba: con `--profile quality`, Opus quedaba de juez de workers Sonnet habiendo Gemini, DeepSeek o GLM disponibles (SF-4). Lo cubren los tests de [`tools/recommend-roster.test.mjs`](../tools/recommend-roster.test.mjs); córrelos con `node --test` desde la raíz.

### Puntuación (ordena candidatos)
```
score = Σ peso_rol[c] × capacidad_modelo[c]  −  costWeight(perfil) × cost  −  penalización(confidence)
        − 8 si un judge usa el mismo modelo que un writer (solo posible en el fallback de misma familia)
        − 2.5 × N si un judge repite un modelo ya usado por N jueces anteriores
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

---

## 7. Cockpit Humano, Golden Presets y Hot-Swap de Emergencia (`tools/team.mjs`)

Mientras que `recommend-roster.mjs` optimiza algorítmicamente el roster ponderando capacidades vs. costo, la operación práctica en producción introduce dos necesidades operativas:
1. **Curaduría de Modelos y Control de Tokens:** Evitar modelos con gasto desproporcionado (como Grok) o priorizar combinaciones de máxima solidez probadas en campo.
2. **Contingencias en Caliente (Hot-Swap):** Si un proveedor cae o agota su cuota de API a mitad de un sprint, migrar roles en segundos sin editar manualmente cientos de líneas de JSON ni romper esquemas, topologías o Write-Locks.

Swarm-Forge aborda esto con [`tools/team.mjs`](../tools/team.mjs):

### A. Cockpit Interactivo y Niveles de Esfuerzo
Al ejecutar `node tools/team.mjs`:
- El equipo se visualiza ordenado `[1..N]` con badges de esfuerzo inferido (`High (Deep)`, `Medium`, `Low (Fast)`).
- Permite seleccionar cualquier rol por número para alterar su nivel de esfuerzo / thinking, cambiar su proveedor conservando las salvaguardas o ingresar un modelo personalizado.

### B. Catálogo de Golden Presets (`--preset <nombre>`)
Alineaciones preconfiguradas y probadas en sprints reales:
* **`duo` / `claude,agy`:** Dúo Elite. Claude Opus en Workers y Sentinel, Claude Sonnet en Fase 3 y jueces, AGY Gemini 3.1 Pro en auditoría/orquestación. Cero Haiku, cero OpenCode.
* **`solo-claude`:** 100% Anthropic. Claude Opus en Workers y Sentinel, Claude Sonnet en Fase 3 y Exploración.
* **`solo-agy` / `gemini`:** 100% Google Gemini (Flash High / Pro High). Visión multimodal nativa en Sentinel, contexto de 1M, cero consumo de APIs externas de pago.
* **`solo-opencode` / `open-weights`:** Modelos abiertos de vanguardia (Kimi 2.7 backend, Qwen 3.6 frontend con visión, GLM 5.3 orquestación, DeepSeek v4 Pro revisión/seguridad, exploradores gratuitos nemotron/mimo). Cero Grok.
* **`mixed` / `agy,opencode`:** Combinación equilibrada de Google Gemini y modelos abiertos favoritos.
* **`trio` / `claude,agy,opencode`:** Trío Soberano. Claude Opus en backend, Qwen 3.6 en frontend, Sonnet en revisión Fase 3, Gemini Pro en auditoría.

### C. Botón de Emergencia (`--emergency-to <harness>`) y Restauración (`--restore`)
Ante una interrupción de servicio o agotamiento de saldo de un proveedor externo:
```bash
node tools/team.mjs --emergency-to agy
```
1. Genera automáticamente un respaldo del roster actual en `roster.last-mixed.json`.
2. Migra los agentes externos al harness especificado (`agy`, `claude`, `opencode`) preservando intactos sus `writeLock`, `writeLockExclude`, `verifyCommand`, `repo` y `baseBranch`.
3. Una vez superada la contingencia:
```bash
node tools/team.mjs --restore
```
Restaura el roster original desde el archivo de backup en un solo paso.
