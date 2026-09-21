# 🔓 OpenCode — Adaptador Swarm-Forge (Modo A)

> **Estado:** ✅ Implementado. Plantillas extraídas de una adopción real en producción (funycheck: Next.js 14 + MongoDB) y validadas con `opencode agent list` (OpenCode 1.18).

OpenCode ejecuta el enjambre completo con su mecánica nativa: agentes en Markdown, subagentes invocados con la herramienta `task` (o con `@mención`) y Write-Locks **reales** mediante `permission.edit`. No necesitas herdr, scripts ni un runner con `--profile`.

Además, OpenCode puede asignar a cada agente un modelo de **otra familia** (GLM, Kimi, Grok, DeepSeek, GPT...). Por eso es el único adaptador de Modo A que cumple la 6ª Ley (Diversidad Adversarial) sin salir del CLI.

---

## Instalación en tu proyecto

```bash
# Desde la raíz de tu proyecto
mkdir -p .opencode/agents
cp <ruta-a-swarm-forge>/providers/opencode/templates/opencode.json   ./opencode.json
cp <ruta-a-swarm-forge>/providers/opencode/templates/AGENTS.protocol.md .opencode/AGENTS.md
cp <ruta-a-swarm-forge>/providers/opencode/templates/agents/*.md     .opencode/agents/
echo ".opencode/swarm/" >> .gitignore

opencode agent list   # deben aparecer sentinel, orchestrator, worker_*, jueces y devops
```

Después, adapta tres cosas:
1. **Write-Locks:** los `permission.edit` de `worker_backend.md`, `worker_frontend.md` y `devops.md` (y la sección equivalente de `.opencode/AGENTS.md`) con los paths de tu `topology.json`.
2. **Comandos de verificación:** los `bash` permitidos y los comandos de `.opencode/AGENTS.md`.
3. **Modelos:** cámbialos si tu gateway ofrece otros, respetando las dos reglas de abajo.

## Estructura

| Archivo en tu proyecto | Plantilla | Para qué |
|---|---|---|
| `opencode.json` | [`templates/opencode.json`](./templates/opencode.json) | Modelo por defecto, `small_model`, modelos de los agentes nativos y carga del protocolo vía `instructions`. |
| `.opencode/AGENTS.md` | [`templates/AGENTS.protocol.md`](./templates/AGENTS.protocol.md) | Protocolo de 5 fases, equipo, Write-Locks y comandos de verificación. |
| `.opencode/agents/*.md` | [`templates/agents/`](./templates/agents/) | Los roles del enjambre, cada uno con su modelo y sus permisos. |

> **¿Por qué `.opencode/AGENTS.md` y no el `AGENTS.md` de la raíz?** OpenCode también lee el de la raíz, pero esa ruta la usan AGY y Codex. Guardar el protocolo bajo `.opencode/` permite que varios CLIs convivan en el mismo repo sin pisarse.

## El equipo

| Agente | `mode` | Modelo | Permisos de edición |
|---|---|---|---|
| `sentinel` | `all` (primario y subagente) | glm-5.3 (visión) | Ninguno |
| `orchestrator` | `subagent` | glm-5.3 | Solo `.opencode/swarm/**` |
| `explore` (nativo) | `subagent` | glm-5.3-flash | Ninguno |
| `worker_backend` | `subagent` | kimi-k2.7-code | Su Write-Lock |
| `worker_frontend` | `subagent` | glm-5.3 (visión) | Su Write-Lock |
| `code-reviewer` | `subagent` | grok-4.6 | Ninguno |
| `security-auditor` | `subagent` | grok-4.6 | Ninguno (sin shell) |
| `challenger` | `subagent` | deepseek-v4-pro | Solo tests y `.opencode/swarm/**` |
| `forensic-auditor` | `subagent` | deepseek-v4-pro | Ninguno |
| `victory-auditor` | `subagent` | grok-4.6 | Ninguno |
| `devops` | `subagent` | deepseek-v4-flash | Archivos de infraestructura |

Probados en funycheck: `sentinel`, `orchestrator`, `worker_*`, `code-reviewer`, `security-auditor` y `devops`. Los modelos de `challenger`, `forensic-auditor` y `victory-auditor` cambiaron respecto de funycheck para cumplir la 6ª Ley (ver abajo).

## Las dos reglas al elegir modelos

1. **Visión obligatoria** en `sentinel` y `worker_frontend` (Imperativo Multimodal). DeepSeek, Kimi y Grok de este catálogo son solo texto; glm-5.3 tiene visión según lo reportado en funycheck.
2. **Diversidad Adversarial (6ª Ley):** los jueces (`code-reviewer`, `security-auditor`, `challenger`, `forensic-auditor`, `victory-auditor`) no deben usar la familia de ningún worker. Con los workers en Kimi (moonshot) y GLM (zhipu), los jueces van en Grok (xai) y DeepSeek.

## ⚠️ Cómo escribir un Write-Lock en OpenCode

Según la [documentación de permisos](https://opencode.ai/docs/permissions/), **gana la última regla que coincide**, y en los patrones `*` coincide con **cualquier carácter, incluida la `/`**. De ahí salen tres reglas:

```yaml
permission:
  edit:
    "*": deny              # 1. Primero, negar TODO con "*"
    "src/app/**": allow    # 2. Después, permitir la frontera
    "src/app/api/**": deny # 3. Al final, volver a negar las exclusiones
```

- **No uses `"**/*": deny`** como negación general: ese patrón exige que la ruta contenga una `/`, así que los archivos de la raíz (`package.json`, `Dockerfile`, `next.config.mjs`) **quedarían sin bloquear**.
- El orden importa: una exclusión escrita antes del `allow` no tiene efecto.
- Traducción directa desde `topology.json`: cada glob de `paths` es un `allow` y cada glob de `exclude` es un `deny` posterior.

## Operación

- Lanza OpenCode en **modo autónomo**: `opencode --auto`. Aprueba todo lo que no esté explícitamente negado, así que los Write-Locks (`edit: "*": deny`) y los `deny` de los jueces se siguen respetando. Ver [`spec/AUTONOMY.md`](../../spec/AUTONOMY.md).
- Pide el enjambre en lenguaje natural ("usa el enjambre para...") o cámbiate al agente `sentinel`.
- El Sentinel delega en el `orchestrator`, este escribe `DISPATCH.md` y los workers se invocan como subagentes.
- Para el `victory-auditor`, pásale solo los criterios de aceptación y las rutas: así mantiene el contexto frío.
