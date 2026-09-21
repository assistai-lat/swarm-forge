# 🧭 Modos de Enjambre: Un Solo CLI vs. Varios CLIs

Swarm-Forge ofrece **dos formas de ejecutar el mismo protocolo** (las 5 fases, los 12 roles, los Write-Locks y el Gate M0 son idénticos en ambas). Lo que cambia es **qué programa lanza a los agentes**:

- **Modo A — Mono-Harness:** un solo CLI de agentes (Claude Code, AGY, Codex u OpenCode) lanza a todo el equipo con sus subagentes nativos.
- **Modo B — Multi-Harness:** varios CLIs distintos trabajan juntos, cada uno en su pane, coordinados con [herdr](https://github.com/ogulcancelik/herdr).

> **Ojo: "un solo CLI" no siempre significa "un solo proveedor de modelos".** Claude Code y Codex solo ejecutan modelos de su empresa, pero OpenCode puede asignar a cada subagente un modelo de otra familia (GLM, Kimi, Grok, DeepSeek...), y AGY ofrece Gemini, Claude y gpt-oss. Si lo que buscas es **mezclar modelos**, primero mira si tu CLI ya lo permite. El Modo B solo hace falta para mezclar **CLIs**.

---

## Resumen en una tabla

| | 🏠 **Modo A — Mono-Harness** | 🧬 **Modo B — Multi-Harness (herdr)** |
|---|---|---|
| **Quién lanza los subagentes** | La herramienta nativa del CLI (`Task` de Claude Code, `invoke_subagent` de AGY, `task` de OpenCode...) | herdr: cada agente es un CLI real en su propio pane |
| **Modelos posibles** | Los que ofrezca ese CLI: un solo proveedor (Claude Code, Codex) o varios (OpenCode, AGY) | Cualquier modelo de cualquier CLI instalado |
| **Write-Locks** | Instrucción en el prompt + permisos del CLI (p. ej. `permission.edit` en OpenCode) | Instrucción en el prompt **+ git worktree físico** por worker |
| **Diversidad adversarial (6ª Ley)** | Solo si el CLI ofrece modelos de varias familias | ✅ Siempre alcanzable con dos o más CLIs |
| **Qué asigna los modelos** | [`ROSETTA_STONE.md`](./ROSETTA_STONE.md) (una columna por CLI) | [`catalog/`](./catalog/) + [`tools/recommend-roster.mjs`](./tools/recommend-roster.mjs) → `roster.json` |
| **Especificación** | [`spec/`](./spec/) | [`spec/`](./spec/) + [`spec/MIXED_ROSTER.md`](./spec/MIXED_ROSTER.md) |
| **Adaptador** | [`providers/antigravity`](./providers/antigravity/), [`claude-code`](./providers/claude-code/), [`codex`](./providers/codex/), [`opencode`](./providers/opencode/) | [`providers/herdr`](./providers/herdr/) |
| **Requisitos** | Un solo CLI | herdr + dos o más CLIs de agentes instalados |
| **Complejidad** | Baja: un proceso, subagentes nativos | Media: varios procesos, coordinación por artefactos en disco |

---

## ¿Cuál elijo?

**Elige el Modo A (Mono-Harness) si:**
- Usas un solo CLI y te basta con los modelos que ofrece.
- Buscas la configuración más simple, o la tarea es pequeña.
- Usas OpenCode o AGY y quieres mezclar familias de modelos sin salir de ese CLI.

**Elige el Modo B (Multi-Harness) si:**
- Quieres combinar lo mejor de CLIs distintos (p. ej. workers en Claude Code, jueces en Codex o AGY).
- Tu CLI principal solo ofrece modelos de una familia y quieres jueces independientes.
- Quieres Write-Locks físicos con git worktrees.

> Puedes empezar en el Modo A y pasar al B más adelante: los artefactos (`PROJECT.md`, `DISPATCH.md`, `handoff.md`, `GATE_STATUS.md`) son los mismos.

> **En ambos modos, los agentes corren en modo autónomo** (sin diálogos de aprobación por comando): `claude --permission-mode auto`, `agy --dangerously-skip-permissions`, `opencode --auto`, `codex -c approval_policy=never`. La aprobación humana queda reservada al Gate M0. Ver [`spec/AUTONOMY.md`](./spec/AUTONOMY.md).

---

## 🏠 Modo A — Cómo funciona

```text
  Humano ──► Sentinel (un solo CLI, p. ej. OpenCode)
                 │  subagentes nativos (task / Task / invoke_subagent)
                 ├──► Orchestrator      (glm)
                 ├──► Workers           (kimi, glm)
                 └──► Auditores         (grok, deepseek)   ← otra familia, si el CLI lo permite
```

1. Elige tu CLI en [`providers/`](./providers/).
2. Copia el `AGENTS.template.md` de tu topología (o las plantillas del adaptador) a tu proyecto.
3. Asigna los modelos con la columna de tu CLI en [`ROSETTA_STONE.md`](./ROSETTA_STONE.md). Si tu CLI ofrece varias familias, respeta la 6ª Ley: los jueces no deben usar la misma familia que los workers.

## 🧬 Modo B — Cómo funciona

```text
  Humano ──► Sentinel (p. ej. Claude Code, dentro de herdr)
                 │  herdr agent start / prompt / wait / read
                 ├──► pane: orchestrator      (opencode · deepseek)
                 ├──► worktree: worker_api    (claude · sonnet)
                 ├──► worktree: worker_web    (claude · sonnet)
                 ├──► pane: forensic-auditor  (codex · gpt)        ← otro CLI y otra familia
                 └──► pane: victory-auditor   (agy · gemini pro)   ← otro CLI y otra familia
```

El enjambre se puede operar de tres maneras, de menor a mayor autonomía:

| Nivel | Quién ejecuta los comandos `herdr` | Cómo |
|---|---|---|
| 1. Manual | Tú | Abres un agente por pane; la barra lateral de herdr te muestra quién trabaja 🟡, terminó 🔵 o espera 🔴. |
| 2. Script | [`swarm-up.mjs`](./providers/herdr/swarm-up.mjs) | Levanta los agentes del `roster.json` por fase, cada uno con su CLI y modelo. |
| 3. **Agente-director** | Tu agente principal (el Sentinel) | Con el skill de herdr instalado, el agente con el que hablas lanza, instruye y espera a los demás agentes. Ver [`providers/herdr/SENTINEL_PROMPT.md`](./providers/herdr/SENTINEL_PROMPT.md). |

La guía completa de instalación y operación está en [`providers/herdr/README.md`](./providers/herdr/README.md).
