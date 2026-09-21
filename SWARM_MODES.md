# 🧭 Modos de Enjambre: Mono-Proveedor vs. Multi-Proveedor

Swarm-Forge ofrece **dos formas de ejecutar el mismo protocolo** (las 5 fases, los 12 roles, los Write-Locks y el Gate M0 son idénticos en ambas). Lo que cambia es **quién lanza a los agentes y de qué proveedor pueden ser sus modelos**.

---

## Resumen en una tabla

| | 🏠 **Modo A — Mono-Proveedor** | 🧬 **Modo B — Multi-Proveedor (herdr)** |
|---|---|---|
| **Modelos** | Todos del mismo proveedor (solo Gemini, solo Claude, solo OpenAI o solo modelos abiertos) | Cada rol con el mejor modelo disponible de **cualquier** proveedor |
| **Quién lanza los subagentes** | La herramienta nativa del harness (`Task` de Claude Code, `invoke_subagent` de AGY, `task` de OpenCode) | [herdr](https://github.com/ogulcancelik/herdr): cada agente es un CLI real en su propio pane |
| **Aislamiento de Write-Locks** | Instrucción en el prompt / permisos del harness | Instrucción en el prompt **+ git worktree físico** por worker |
| **Diversidad adversarial** | ❌ Los jueces comparten familia con los workers | ✅ Los jueces usan otra familia de modelos (6ª Ley) |
| **Qué asigna los modelos** | [`ROSETTA_STONE.md`](./ROSETTA_STONE.md) (una columna por proveedor) | [`catalog/`](./catalog/) + [`tools/recommend-roster.mjs`](./tools/recommend-roster.mjs) → `roster.json` |
| **Especificación** | [`spec/`](./spec/) | [`spec/`](./spec/) + [`spec/MIXED_ROSTER.md`](./spec/MIXED_ROSTER.md) |
| **Adaptador** | [`providers/antigravity`](./providers/antigravity/), [`claude-code`](./providers/claude-code/), [`codex`](./providers/codex/), [`opencode`](./providers/opencode/) | [`providers/herdr`](./providers/herdr/) |
| **Requisitos** | Un solo CLI y una sola suscripción o API key | herdr + dos o más CLIs de agentes instalados |
| **Complejidad** | Baja: un solo proceso, contexto compartido nativo | Media: varios procesos, coordinación por artefactos en disco |

---

## ¿Cuál elijo?

**Elige el Modo A (Mono-Proveedor) si:**
- Solo tienes una suscripción o API key.
- Buscas la configuración más simple, o la tarea es pequeña.
- Tu harness ya ofrece subagentes nativos y te basta.

**Elige el Modo B (Multi-Proveedor) si:**
- Tienes acceso a varios proveedores (p. ej. Claude Code + Antigravity + OpenCode).
- Quieres que el código lo revise un modelo **distinto** al que lo escribió.
- Quieres optimizar el costo por rol (visión barata para el Sentinel, razonamiento fuerte solo para los auditores).
- Quieres Write-Locks físicos con git worktrees.

> Puedes empezar en el Modo A y pasar al B más adelante: los artefactos (`PROJECT.md`, `DISPATCH.md`, `handoff.md`, `GATE_STATUS.md`) son los mismos.

---

## 🏠 Modo A — Cómo funciona

```text
  Humano ──► Sentinel (Claude Code)
                 │  Task tool nativa
                 ├──► Orchestrator (Claude Opus)
                 ├──► Workers (Claude Sonnet)
                 └──► Auditores (Claude Opus)      ← misma familia de modelos
```

1. Elige tu proveedor en [`providers/`](./providers/).
2. Copia el `AGENTS.template.md` de tu topología como `AGENTS.md` o `CLAUDE.md`.
3. Asigna los modelos con la columna de tu proveedor en [`ROSETTA_STONE.md`](./ROSETTA_STONE.md).

## 🧬 Modo B — Cómo funciona

```text
  Humano ──► Sentinel (p. ej. Claude Code, dentro de herdr)
                 │  herdr agent start / prompt / wait / read
                 ├──► pane: orchestrator      (opencode · deepseek)
                 ├──► worktree: worker_api    (claude · sonnet)
                 ├──► worktree: worker_web    (claude · sonnet)
                 ├──► pane: forensic-auditor  (opencode · deepseek)   ← otra familia
                 └──► pane: victory-auditor   (agy · gemini pro)      ← otra familia
```

El enjambre se puede operar de tres maneras, de menor a mayor autonomía:

| Nivel | Quién ejecuta los comandos `herdr` | Cómo |
|---|---|---|
| 1. Manual | Tú | Abres un agente por pane; la barra lateral de herdr te muestra quién trabaja 🟡, terminó 🔵 o espera 🔴. |
| 2. Script | [`swarm-up.mjs`](./providers/herdr/swarm-up.mjs) | Levanta los agentes del `roster.json` por fase, cada uno con su modelo. |
| 3. **Agente-director** | Tu agente principal (el Sentinel) | Con el skill de herdr instalado, el agente con el que hablas lanza, instruye y espera a los demás agentes. Ver [`providers/herdr/SENTINEL_PROMPT.md`](./providers/herdr/SENTINEL_PROMPT.md). |

La guía completa de instalación y operación está en [`providers/herdr/README.md`](./providers/herdr/README.md).
