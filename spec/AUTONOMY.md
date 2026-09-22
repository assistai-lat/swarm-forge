# 🤖 Especificación Universal: Modo Autónomo (Auto-Aprobación de Permisos)

> **Regla:** en un enjambre, los agentes que no hablan con el humano **deben ejecutarse en modo autónomo**. Si cada worker o juez se detiene a pedir permiso para cada comando, el enjambre se congela, y el Sentinel o el orchestrator no siempre detectan que un agente está esperando.

---

## 1. Por qué es obligatorio

En una sesión normal, cada CLI pide aprobación antes de ejecutar comandos, editar archivos o acceder a la web. Con un solo agente eso es razonable. Con 5 a 15 agentes en paralelo:

1. **El enjambre se detiene** en cada diálogo de aprobación, y nadie lo está mirando.
2. **El estado se vuelve engañoso.** Caso real (herdr 0.9, AGY 1.2.7): AGY esperaba aprobación para un `curl` y herdr lo reportaba como `done` en vez de `blocked`. El orchestrator habría creído que había terminado. Instalar la integración de herdr para AGY no lo evita: solo registra la sesión, no el estado.
3. **El humano se satura** aprobando comandos triviales y pierde de vista el único gate que sí le corresponde: el **Gate M0**.

> El modo autónomo **no elimina el control humano**: el Gate M0 (aprobación del plan) y la entrega del Victory Auditor siguen siendo decisiones humanas. Lo que se elimina es la micro-aprobación de cada comando.

---

## 2. Flags por CLI

| CLI | Modo autónomo recomendado | Máxima autonomía (solo en sandbox) | Configuración global |
|---|---|---|---|
| **Claude Code** | `claude --permission-mode auto` | `claude --dangerously-skip-permissions` | `"permissions": { "defaultMode": "auto" }` en `~/.claude/settings.json` |
| **Antigravity (AGY)** | `agy --dangerously-skip-permissions` | (el mismo) | — |
| **OpenCode** | `opencode --auto` | `"permission": { "*": "allow" }` en la config | `"permission"` en `~/.config/opencode/opencode.json` |
| **Codex CLI** | `codex -c approval_policy=never -c sandbox_mode=workspace-write` | `-c sandbox_mode=danger-full-access` | `approval_policy = "never"` en `~/.codex/config.toml` |

Detalles:
- **Claude Code:** `--permission-mode` acepta `acceptEdits`, `auto`, `bypassPermissions`, `manual`, `dontAsk` y `plan`. `auto` es el equilibrio para enjambres; `bypassPermissions` (o `--dangerously-skip-permissions`) desactiva todos los controles.
- **AGY:** `--dangerously-skip-permissions` auto-aprueba todas las solicitudes de herramientas.
- **OpenCode:** `--auto` auto-aprueba todo lo que **no esté explícitamente negado**. Los Write-Locks de [`providers/opencode/`](../providers/opencode/) (`edit: "*": deny`) y los `deny` de los jueces se siguen respetando: es el modo autónomo más seguro de los cuatro.
- **Codex:** `approval_policy = "never"` elimina los diálogos pero **mantiene el sandbox** (`workspace-write` solo escribe dentro del proyecto). Los jueces con `sandbox_mode = "read-only"` siguen sin poder escribir.

Flags verificados con `--help` en Claude Code, AGY 1.2.7 y OpenCode 1.18; las claves de Codex, en su [referencia de configuración](https://learn.chatgpt.com/docs/config-file/config-reference).

---

## 3. Quién corre en modo autónomo

| Rol | ¿Autónomo? | Motivo |
|---|---|---|
| `sentinel` | **Opcional** | Habla con el humano; el Gate M0 es conversacional, no un diálogo de permisos. |
| `orchestrator` | **Sí** | Coordina sin pausas. |
| `explorer`, jueces (`code-reviewer`, `security-auditor`, `forensic-auditor`, `contract-integrator`) | **Sí** | No escriben en el repo: el riesgo es mínimo **si no heredan MCPs con permisos de escritura** (sección 6). |
| `worker_*`, `dba`, `devops`, `challenger`, `victory-auditor` | **Sí, con aislamiento** | Escriben o ejecutan comandos: combínalo con Write-Locks físicos (permisos de OpenCode, worktrees de herdr) o con el sandbox de Codex. |

---

## 4. Salvaguardas obligatorias

El modo autónomo solo es seguro si el resto del protocolo está en su lugar:

1. **Repositorio confiable.** Nunca uses modo autónomo en un repo que no conoces: un `AGENTS.md` o un script malicioso se ejecutaría sin preguntar.
2. **Git limpio antes de empezar.** Todo cambio debe poder revertirse con git.
3. **Write-Locks** con el mecanismo más fuerte disponible: `permission.edit` en OpenCode, worktrees en el Modo B (`swarm-up.mjs --worktree`), sandbox `workspace-write` en Codex.
4. **Veto forense:** el `forensic-auditor` revisa el diff completo y [`tools/check-write-locks.mjs`](../tools/check-write-locks.mjs) detecta escrituras fuera de frontera.
5. **Sin secretos al alcance:** los modos `dangerously-*` pueden leer `.env` y ejecutar comandos de red. En máquinas con credenciales sensibles, prefiere los modos intermedios (`claude --permission-mode auto`, `opencode --auto`, Codex con sandbox).
6. **Gate M0 intacto:** el modo autónomo nunca autoriza a saltarse la aprobación humana del plan.
7. **MCPs con el mismo criterio que los archivos:** en modo autónomo un agente usa sus herramientas MCP sin preguntar. Ver la sección 6.

---

## 5. Aplicación por modo

- **Modo A (un solo CLI):** lanza tu CLI principal con el flag de la tabla. Los subagentes nativos heredan el modo de permisos de la sesión (en Codex, cada agente puede además fijar su propio `sandbox_mode`).
- **Modo B (herdr):** `swarm-up.mjs --auto` añade a cada agente el flag de su CLI (definido en `autoApproveArgs` de [`catalog/models.json`](../catalog/models.json)). Si lanzas agentes a mano:
  ```bash
  herdr agent start worker_api --kind agy --pane <id> -- --model gemini-3.8-flash-high --dangerously-skip-permissions
  ```
- **Integraciones de herdr:** instala `herdr integration install <cli>` para cada CLI. Solo la de **OpenCode** le informa a herdr el estado del agente (incluido `blocked`); las de Claude Code, AGY y Codex solo registran la sesión (detalle en [`providers/herdr/README.md`](../providers/herdr/README.md#qué-informa-cada-integración)). Por eso el modo autónomo es imprescindible con AGY y Codex, y las respuestas se reciben por archivo, no por el estado del agente.

---

## 6. MCPs por rol

Un agente autónomo usa sus herramientas MCP **sin preguntar**, igual que edita archivos. Y cada agente del enjambre hereda, salvo que se lo impidas, **todos** los MCPs configurados para su CLI: los del proyecto (`.mcp.json` en Claude Code, `opencode.json` en OpenCode) y los globales del usuario (`~/.claude.json`, `~/.gemini/config/mcp_config.json`, `~/.config/opencode/opencode.json`, `~/.codex/config.toml`).

> **Caso real (Modo B, Windows):** los workers y jueces de un enjambre sobre un CRM heredaron sin que nadie lo decidiera un MCP de Postgres conectado a la base de **producción** con un superusuario, y otro de Coolify con un token **con permiso de despliegue**. Un explorer "de solo lectura" podía desplegar a producción.

### Regla

**Ningún MCP se hereda: cada rol recibe solo los que su misión necesita, y con credenciales de mínimo privilegio.** Por defecto, cero MCPs.

| Rol | MCPs razonables |
|---|---|
| `explorer`, jueces | Ninguno, o documentación y lectura de tickets. |
| `worker_*` | Los de su superficie (docs del framework, navegador para `worker_ui`). |
| `dba` | Base de **desarrollo** o réplica, con usuario de solo lectura (ver abajo). |
| `devops` | Ninguno con permiso de despliegue: el despliegue lo aprueba el humano después del Victory Auditor. |
| `sentinel` | Los del humano: es el único que habla con él. |

### Cómo aislarlos en cada CLI

| CLI | Mecanismo | Alcance |
|---|---|---|
| **Claude Code** | `--strict-mcp-config --mcp-config=<mcp-rol>.json`. Con `{"mcpServers": {}}` el agente queda con cero MCPs (verificado: 142 herramientas MCP heredadas sin el flag, ninguna con él). Usa la forma con `=`: `--mcp-config` acepta varios archivos y, separado por espacio, se traga el argumento siguiente como si fuera otro archivo. | Por sesión. |
| **AGY** | `agy mcp disable <nombre>` antes de lanzar el enjambre y `agy mcp enable <nombre>` al terminar. No hay flag por sesión: la config es **solo global** (`~/.gemini/config/mcp_config.json`) y el cambio afecta también a tu sesión de AGY. | Global. |
| **OpenCode** | En la definición del agente del rol, `"tools": { "<servidor>_*": false }`, y lánzalo con `--agent <rol>`. O desactiva el servidor en el `opencode.json` del proyecto con `"enabled": false`. Según la documentación de OpenCode; no verificado en vivo. | Por agente / por proyecto. |
| **Codex** | `-c mcp_servers.<nombre>.enabled=false`. Según su referencia de configuración; no verificado en vivo (Codex no estaba instalado). | Por sesión. |

En el Modo B, los argumentos de Claude Code, OpenCode y Codex van en **`extraArgs` del agente en `roster.json`**: [`swarm-up.mjs`](../providers/herdr/swarm-up.mjs) los pasa al CLI después de `--model`. Si el modelo ya traía `extraArgs` del catálogo (p. ej. el nivel de razonamiento de Codex), consérvalos y añade los tuyos:

```json
{ "role": "code-reviewer", "harness": "claude", "model": "opus",
  "extraArgs": ["--strict-mcp-config", "--mcp-config=.swarm/mcp/none.json"] }
```

`recommend-roster.mjs` regenera `roster.json` desde cero: vuelve a aplicar estos ajustes cada vez que lo regeneres.

### Bases de datos

- **Nunca producción.** Usa una réplica o una copia anonimizada.
- **Solo lectura de verdad, en el servidor:** un usuario con `pg_read_all_data` y sin ningún otro privilegio. `ALTER ROLE ... SET default_transaction_read_only = on` es una segunda capa útil, pero la sesión puede desactivarla con `SET`: lo que protege son los privilegios.
- **No confíes en el "modo solo lectura" del MCP.** `@modelcontextprotocol/server-postgres` 0.6.2 envuelve cada consulta en `BEGIN TRANSACTION READ ONLY`, pero ejecuta el SQL tal cual: una consulta que empieza con `COMMIT;` cierra esa transacción y lo que sigue se ejecuta con los privilegios completos del usuario.

### Datos personales y proveedores

Un roster mixto envía contexto a varios proveedores (Anthropic, Google, OpenCode Go y los que este enrute...). Lo que un agente lee por MCP (filas de clientes, tickets, correos) sale hacia el proveedor de **su** modelo. Si los datos son personales o confidenciales, restringe esos MCPs a los roles cuyo proveedor esté aprobado para recibirlos, o no los conectes.
