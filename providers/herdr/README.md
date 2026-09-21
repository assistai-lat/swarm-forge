# 🐑 herdr — Adaptador para Enjambres Multi-Proveedor (Modo B)

> **Estado:** Funcional en modo simulación (dry-run). Pendiente de validación end-to-end con `--apply`.
>
> Este adaptador es el **Modo B — Multi-Proveedor**. Si solo usas un proveedor, no lo necesitas: usa el adaptador de tu proveedor (Modo A). Comparativa en [`SWARM_MODES.md`](../../SWARM_MODES.md).

[herdr](https://github.com/ogulcancelik/herdr) es un multiplexor de terminal para agentes de código. Ejecuta los CLIs reales (Claude Code, AGY, OpenCode, Codex, Gemini CLI...) cada uno en su pane, detecta su estado (`idle`, `working`, `blocked`, `done`) y expone todo por CLI y socket API. Eso lo convierte en la **capa neutral** que un roster mixto necesita (ver [`spec/MIXED_ROSTER.md`](../../spec/MIXED_ROSTER.md)): los subagentes nativos de cada proveedor no pueden lanzar modelos de la competencia, herdr sí.

---

## Mapeo Swarm-Forge → herdr

| Concepto Swarm-Forge | Primitiva herdr |
|---|---|
| Instanciar un rol con su modelo | `herdr agent start <rol> --kind <harness> --pane <id> -- --model <modelo>` |
| Despachar (`DISPATCH.md`) | `herdr agent prompt <rol> "Lee DISPATCH.md..." --wait --timeout <ms>` |
| Esperar el handoff | `herdr agent wait <rol>` (estados `idle` / `done` / `blocked`) |
| Leer el resultado | `herdr agent read <rol> --source recent-unwrapped --lines 200` + `handoff.md` en disco |
| **Write-Lock físico** | `herdr worktree create --branch swarm/<worker>`: cada writer trabaja en su propio git worktree |
| Verificación de la superficie | `herdr pane run <pane> "<verifyCommand>"` + `herdr pane wait-output --match ...` |
| Gate humano M0 | Un agente en `blocked` aparece en rojo en la barra lateral: el humano ve quién espera respuesta |
| Victory Auditor en contexto limpio | Se lanza como agente nuevo, en pane nuevo, con otra familia de modelo |

---

## Instalación

Una sola vez por máquina:

```bash
# 1. Instala herdr: https://herdr.dev/docs/quick-start/

# 2. Integración de estado: el harness le informa a herdr cuándo trabaja, termina o te espera
#    (más preciso que la detección por pantalla). Repetir por cada harness que uses.
herdr integration install claude

# 3. Skill de herdr para tu agente principal (necesario para el Nivel 3, Agente-Director).
#    Ejemplo para Claude Code; en otros harnesses, copia la salida de `herdr --skill`
#    a su carpeta de skills o reglas.
mkdir -p ~/.claude/skills/herdr && herdr --skill > ~/.claude/skills/herdr/SKILL.md
```

> El skill de herdr solo se activa cuando **nombras herdr** en tu pedido (p. ej. *"usa herdr para abrir un Codex que revise mi diff"*). Así el agente nunca abre panes por su cuenta.

---

## Tres niveles de uso

| Nivel | Quién ejecuta los comandos `herdr` | Para qué |
|---|---|---|
| **1. Manual** | Tú | Abres un agente por pane. La barra lateral muestra quién trabaja 🟡, terminó 🔵 o espera 🔴. |
| **2. Script** | `swarm-up.mjs` | Levanta los agentes del `roster.json` por fase, cada uno con su harness y modelo. |
| **3. Agente-Director** | Tu agente principal | Actúa de Sentinel: lanza, instruye, espera y lee a los demás agentes. Pégale [`SENTINEL_PROMPT.md`](./SENTINEL_PROMPT.md). |

---

## Puesta en marcha

Los comandos asumen que estás en la raíz de este repositorio. Desde otro proyecto, antepone la ruta a tu copia de swarm-forge (`node <ruta-a-swarm-forge>/tools/...`).

```bash
# 1. Genera el roster mixto con los CLIs que tengas instalados
node tools/recommend-roster.mjs --topology topology.json --profile balanced --out roster.json

# 2. Revisa la tabla y las advertencias; ajusta roster.json a mano si quieres

# 3. Desde un pane de herdr, simula y luego lanza por fases
node providers/herdr/swarm-up.mjs --roster roster.json --phase 0            # dry-run: exploradores
node providers/herdr/swarm-up.mjs --roster roster.json --phase 0 --apply
node providers/herdr/swarm-up.mjs --roster roster.json --phase 2 --worktree --apply   # tras el Gate M0
node providers/herdr/swarm-up.mjs --roster roster.json --phase 3 --apply
node providers/herdr/swarm-up.mjs --roster roster.json --phase 4 --apply
```

- Por defecto **no ejecuta nada**: imprime los comandos. `--apply` los ejecuta y exige `HERDR_ENV=1`.
- Lanza por fases a propósito: los roles que no participan en la fase actual permanecen dormidos (Principio de Cero Desperdicio de Tokens).
- `sentinel` y `orchestrator` no se lanzan por defecto: el Sentinel es normalmente el agente con el que ya hablas en tu pane. Usa `--roles orchestrator` si quieres uno separado.
- Cada agente recibe un brief corto con su rol, Write-Lock y `verifyCommand`; desactívalo con `--no-brief`.
- Si un agente arranca bloqueado (p. ej. el diálogo de confianza de carpeta del harness), el lanzador sigue con el resto y te lista cuáles revisar con `herdr agent read`.

---

## Bucle del Orchestrator

El orchestrator (en cualquier harness) coordina al resto solo con la CLI de herdr y los artefactos en disco:

```bash
# Fase 2: despacho paralelo a workers de proveedores distintos
herdr agent prompt worker_api "Lee DISPATCH.md (sección worker_api) y ejecuta tu misión. Al terminar escribe handoff.md." 
herdr agent prompt worker_web "Lee DISPATCH.md (sección worker_web) y ejecuta tu misión. Al terminar escribe handoff.md."
herdr agent wait worker_api --timeout 1800000
herdr agent wait worker_web --timeout 1800000

# Fase 3: jueces de otra familia de modelos sobre el diff
herdr agent prompt forensic-auditor "Audita git diff main...swarm/worker_api y swarm/worker_web. Escribe tu veredicto en GATE_STATUS.md." --wait --timeout 1800000
```

Reglas:
1. Nunca respondas por tu cuenta a un agente en `blocked`: lee su pantalla (`herdr agent read`) y escala al humano.
2. Un `timeout` no prueba que el prompt no llegó: no reenvíes a ciegas.
3. No cierres panes, pestañas ni worktrees que no creó el enjambre.

---

## Harnesses soportados

`herdr agent start --kind` acepta, entre otros: `claude`, `codex`, `agy`, `gemini`, `opencode`, `qwen`, `kimi`, `cursor`, `copilot`, `amp`, `droid`, `grok`. Para usar uno nuevo añade el harness y sus modelos a [`catalog/models.json`](../../catalog/models.json) con `"confidence": "unverified"` hasta probarlo.

## Limitaciones conocidas

- herdr en Windows está en beta.
- El flag de modelo se asume `--model` para todos los harnesses del catálogo; verifica el de cada CLI nuevo.
- La comunicación entre agentes es texto sobre la terminal: los artefactos en disco siguen siendo la fuente de verdad, no la salida del pane.
