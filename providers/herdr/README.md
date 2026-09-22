# 🐑 herdr — Adaptador para Enjambres Multi-Harness (Modo B)

> **Estado:** ✅ Probado en vivo con herdr 0.9: `swarm-up.mjs --apply` (pestañas, `--worktree`, `--auto`) con AGY y Claude Code, y `ask.mjs` de punta a punta con OpenCode y AGY (en paralelo). Pendiente solo Codex, por no estar instalado.
>
> Este adaptador es el **Modo B — Multi-Harness**: varios CLIs de agentes en un mismo enjambre. Si trabajas con un solo CLI no lo necesitas (Modo A), aunque ese CLI mezcle modelos de varias familias, como OpenCode. Comparativa en [`SWARM_MODES.md`](../../SWARM_MODES.md).

[herdr](https://github.com/ogulcancelik/herdr) es un multiplexor de terminal para agentes de código. Ejecuta los CLIs reales (Claude Code, AGY, OpenCode, Codex, Gemini CLI...) cada uno en su pane, detecta su estado (`idle`, `working`, `blocked`, `done`) y expone todo por CLI y socket API. Eso lo convierte en la **capa neutral** que un roster mixto necesita (ver [`spec/MIXED_ROSTER.md`](../../spec/MIXED_ROSTER.md)): los subagentes nativos de cada CLI solo lanzan los modelos que ese CLI ofrece; herdr combina CLIs.

---

## Mapeo Swarm-Forge → herdr

| Concepto Swarm-Forge | Primitiva herdr |
|---|---|
| Instanciar un rol con su modelo | `herdr agent start <rol> --kind <harness> --pane <id> -- --model <modelo>` |
| Despachar y recibir la respuesta | `node providers/herdr/ask.mjs <rol> "Lee DISPATCH.md..."`: la respuesta llega en un archivo `.md` con marca de fin (ver [Canal de respuesta por archivo](#canal-de-respuesta-por-archivo)) |
| Esperar el handoff | La marca de fin del archivo de respuesta; `herdr agent wait <rol>` solo como aviso (el estado no es fiable en todos los CLIs) |
| Leer el resultado | El archivo de respuesta y `handoff.md` en disco; `herdr agent read` solo para diagnosticar |
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
#    (más preciso que la detección por pantalla). Instala la de cada CLI que uses: sin ella,
#    herdr puede reportar "done" a un agente que en realidad espera una aprobación.
herdr integration install claude
herdr integration install opencode
herdr integration install codex
herdr integration install antigravity-cli

# 3. Skill de herdr para tu agente principal (necesario para el Nivel 3, Agente-Director).
#    Ejemplo para Claude Code; en otros harnesses, copia la salida de `herdr --skill`
#    a su carpeta de skills o reglas.
mkdir -p ~/.claude/skills/herdr && herdr --skill > ~/.claude/skills/herdr/SKILL.md
```

### Qué informa cada integración

No todas las integraciones hacen lo mismo. Solo algunas le informan a herdr el estado del agente; las demás solo registran el ID de la sesión (para retomarla tras un reinicio) y herdr sigue adivinando el estado mirando la pantalla:

| CLI | Mecanismo | Informa el estado (working / blocked / idle) |
|---|---|---|
| **OpenCode** | Plugin JS `herdr-agent-state.js` en `~/.config/opencode/plugins/` | ✅ Sí: herdr usa el aviso del plugin en vez de la pantalla. Excepción: en OpenCode V2, los clientes Mini y sin interfaz no lo reportan. |
| **Claude Code** | Hook `SessionStart` (`~/.claude/hooks/herdr-agent-state.ps1`) | ❌ No: solo la sesión (`report-agent-session`), verificado en el hook instalado. El estado sale de la detección en pantalla. |
| **Antigravity** | Hook `PreInvocation` en `~/.gemini/config/hooks.json` | ❌ No: solo la conversación (`agy --conversation <id>`). |
| **Codex** | Hook `SessionStart` en `~/.codex/hooks.json` + `[features] hooks = true` | ❌ No: solo la sesión. |

Consecuencia: con AGY y Codex, **no confíes en el estado de herdr para saber si un agente terminó**. Usa el [canal de respuesta por archivo](#canal-de-respuesta-por-archivo) y lanza los agentes en [modo autónomo](../../spec/AUTONOMY.md) para que no queden esperando aprobaciones que herdr no detecta.

Fuentes: [integraciones de herdr](https://herdr.dev/docs/integrations/) y el código en [`src/integration/assets/`](https://github.com/herdrdev/herdr/tree/master/src/integration/assets), investigados por agentes de OpenCode y AGY dirigidos con herdr.

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
node providers/herdr/swarm-up.mjs --roster roster.json --phase 0 --auto --apply
node providers/herdr/swarm-up.mjs --roster roster.json --phase 2 --worktree --auto --apply   # tras el Gate M0
node providers/herdr/swarm-up.mjs --roster roster.json --phase 3 --auto --apply
node providers/herdr/swarm-up.mjs --roster roster.json --phase 4 --auto --apply
```

- Por defecto **no ejecuta nada**: imprime los comandos. `--apply` los ejecuta y exige `HERDR_ENV=1`.
- Lanza por fases a propósito: los roles que no participan en la fase actual permanecen dormidos (Principio de Cero Desperdicio de Tokens).
- `sentinel` y `orchestrator` no se lanzan por defecto: el Sentinel es normalmente el agente con el que ya hablas en tu pane. Usa `--roles orchestrator` si quieres uno separado.
- `--auto` lanza cada CLI en **modo autónomo** con su flag (`--permission-mode auto`, `--dangerously-skip-permissions`, `--auto`, `approval_policy=never`), para que el enjambre no se congele en diálogos de aprobación. Úsalo siempre con `--worktree` en la fase 2. Ver [`spec/AUTONOMY.md`](../../spec/AUTONOMY.md).
- Cada agente recibe un brief corto con su rol, Write-Lock y `verifyCommand`; desactívalo con `--no-brief`.
- **Polyrepo:** si la superficie declara `repo` ([`spec/TOPOLOGIES.md`](../../spec/TOPOLOGIES.md#superficies-en-repositorios-independientes-repo)), el agente se abre en ese repo y `--worktree` lo crea desde él. Lanza el script desde la raíz de la topología o pásale `--cwd <raíz>`. `--base origin/main` hace que cada worktree parta de esa rama en vez del `HEAD` actual. (Polyrepo y `--base` probados en dry-run; falta una corrida con `--apply`.)
- **`extraArgs` por agente:** lo que pongas en `extraArgs` de un agente de `roster.json` se pasa a su CLI después de `--model`. Sirve, por ejemplo, para aislar sus MCPs (`--strict-mcp-config --mcp-config=<archivo>` en Claude Code, `--agent <rol>` en OpenCode); ver [`spec/AUTONOMY.md`](../../spec/AUTONOMY.md#6-mcps-por-rol).
- Si un agente arranca bloqueado (p. ej. el diálogo de confianza de carpeta del harness), el lanzador sigue con el resto y te lista cuáles revisar con `herdr agent read`.

---

## Canal de respuesta por archivo

**Regla del Modo B: los agentes responden en un archivo, no en la pantalla.** Cada pedido le indica al agente un archivo `.md` de respuesta y una marca de fin (`<!-- SWARM:DONE -->`) que debe escribir como última línea. El orchestrator espera a que el archivo tenga la marca; nunca infiere la respuesta de la pantalla.

Por qué (lo vimos en una prueba real con herdr 0.9):
- **Pantalla alterna:** OpenCode dibuja su interfaz en la pantalla alterna de la terminal; lo que sale de ella no queda en el historial y `herdr agent read` solo recupera el final de la respuesta.
- **Estado poco fiable:** AGY apareció como `done` mientras esperaba una aprobación, y como `idle` mientras clonaba un repo. Con `agent prompt --wait`, la espera terminó al instante.
- **Artefactos:** el archivo es la misma idea que `handoff.md` y `GATE_STATUS.md`: la fuente de verdad está en disco.

[`ask.mjs`](./ask.mjs) lo hace en un solo comando:

```bash
node providers/herdr/ask.mjs worker_api "Lee DISPATCH.md (sección worker_api) y ejecuta tu misión." --timeout 1800000
```

1. Envía el pedido en una sola línea, con las instrucciones del archivo de respuesta (`.swarm/replies/<agente>-<timestamp>.md`).
2. Confirma la entrega: si no ve actividad, avisa que el pedido pudo no llegar, **sin reenviarlo** (un reenvío por un estado mal detectado duplicaría el trabajo).
3. Espera la marca de fin e imprime la respuesta. Códigos de salida: `0` respuesta completa · `1` timeout · `3` agente `blocked`.

Añade `.swarm/` a tu `.gitignore`. Probado de punta a punta con OpenCode (GLM-5.3, `--auto`): 16 a 30 segundos por pedido.

---

## Bucle del Orchestrator

El orchestrator (en cualquier harness) coordina al resto solo con `ask.mjs`, la CLI de herdr y los artefactos en disco:

```bash
# Fase 2: despacho paralelo a workers en CLIs distintos (cada respuesta queda en .swarm/replies/)
node providers/herdr/ask.mjs worker_api "Lee DISPATCH.md (sección worker_api) y ejecuta tu misión. Al terminar escribe handoff.md." &
node providers/herdr/ask.mjs worker_web "Lee DISPATCH.md (sección worker_web) y ejecuta tu misión. Al terminar escribe handoff.md." &
wait

# Fase 3: jueces de otra familia de modelos sobre el diff
node providers/herdr/ask.mjs forensic-auditor "Audita git diff main...swarm/worker_api y swarm/worker_web. Emite FORENSIC CLEAN o FORENSIC REJECTED con evidencia."
```

Reglas:
1. **Con AGY (y Codex): `ask.mjs` es el ÚNICO canal válido, nunca `herdr agent wait` ni el `agent_status`.** Sus integraciones de herdr solo registran la sesión, no el ciclo de vida (ver [Qué informa cada integración](#qué-informa-cada-integración)): un AGY `blocked` esperando aprobación puede aparecer como `done`, y uno `working` como `idle`. Confiar en el estado ahí produce despachos duplicados o respuestas dadas por perdidas sin estarlo.
2. Nunca respondas por tu cuenta a un agente en `blocked`: lee su pantalla (`herdr agent read`) y escala al humano.
3. Un `timeout` no prueba que el pedido no llegó: no reenvíes a ciegas.
4. No cierres panes, pestañas ni worktrees que no creó el enjambre.
5. El primer pedido enviado justo después de `agent start` se perdió una vez en nuestras pruebas (causa sin confirmar): si `ask.mjs` avisa que no vio actividad, revisa la pantalla antes de hacer nada.

---

## Harnesses soportados

`herdr agent start --kind` acepta, entre otros: `claude`, `codex`, `agy`, `gemini`, `opencode`, `qwen`, `kimi`, `cursor`, `copilot`, `amp`, `droid`, `grok`. Para usar uno nuevo añade el harness y sus modelos a [`catalog/models.json`](../../catalog/models.json) con `"confidence": "unverified"` hasta probarlo.

## Limitaciones conocidas

- herdr en Windows está en beta.
- El flag `--model` está verificado en `claude`, `agy`, `opencode` y `codex`; en `gemini` y otros CLIs, verifícalo antes de usarlos.
- La comunicación entre agentes es texto sobre la terminal: los artefactos en disco siguen siendo la fuente de verdad, no la salida del pane.
