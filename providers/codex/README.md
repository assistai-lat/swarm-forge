# 🤖 OpenAI Codex — Adaptador Swarm-Forge (Modo A)

> **Estado:** ✅ Implementado. Verificado en vivo con Codex CLI 0.157.1 en Windows: flags de modo autónomo, sandbox `workspace-write`, carga de `.codex/config.toml` con `--strict-config` y desactivación de MCPs. Falta una corrida end-to-end del enjambre (subagentes y `codex exec` de victoria).

Codex CLI ejecuta el enjambre con su mecánica nativa: **subagentes definidos en TOML** (`.codex/agents/*.toml`), cada uno con su propio modelo, su nivel de razonamiento y su sandbox. Además, `codex exec` permite algo que ningún otro CLI da tan limpio: una **auditoría de victoria en un proceso nuevo, efímero y con salida en JSON validada por esquema**.

---

## Modelos (septiembre 2026)

| Modelo | Uso en el enjambre | Razonamiento | Precio por 1M tokens (entrada / salida) |
|---|---|---|---|
| `gpt-6-astra` | `forensic_auditor`, `victory_auditor` (vetos críticos, invocados pocas veces) | `high` | $10 / $50 |
| `gpt-5.6-sol` | `orchestrator`, `security_auditor`, `code_reviewer` | `high` / `medium` | $4 / $20 |
| `gpt-5.6-terra` | `worker_backend`, `worker_frontend`, `challenger` | `medium` / `high` | $2 / $12 |
| `gpt-5.6-luna` | Sentinel (hilo principal), `explorer`, `devops` | `low` / `medium` | $0.20 / $1.20 |

- Codex 0.157.1 también lista `gpt-6-sol` y `gpt-6-luna` (este último es su modelo por defecto). Están en [`catalog/models.json`](../../catalog/models.json) como `unverified`, con las capacidades de sus pares 5.6 hasta probarlos. La lista real está en `~/.codex/models_cache.json` (Codex no tiene un comando `models`).

- Todos aceptan imágenes, así que el Sentinel y el `worker_frontend` cumplen el Imperativo Multimodal.
- Todos tienen un contexto de ~1M tokens.
- Existe `gpt-5.6-cyber`, especializado en ciberseguridad; si tu cuenta tiene acceso, es un buen candidato para el `security_auditor`.
- `gpt-oss-120b` y `gpt-oss-20b` son de pesos abiertos y **no se sirven por la API de OpenAI**: úsalos vía OpenCode, AGY u Ollama.

Fuentes: [modelos de OpenAI](https://developers.openai.com/api/docs/models), [subagentes de Codex](https://learn.chatgpt.com/docs/agent-configuration/subagents), [modo no interactivo](https://learn.chatgpt.com/docs/non-interactive-mode).

> **Límite de la 6ª Ley (Diversidad Adversarial):** Codex solo ofrece modelos de OpenAI, así que los jueces comparten familia con los workers. Si quieres jueces de otra familia, combina Codex con otro CLI en el **Modo B** ([`providers/herdr`](../herdr/)); por ejemplo, workers en Codex y jueces en Claude Code o AGY.

---

## Instalación en tu proyecto

```bash
# Desde la raíz de tu proyecto
cp -r <ruta-a-swarm-forge>/providers/codex/templates/.codex ./.codex
cp <ruta-a-swarm-forge>/providers/codex/templates/AGENTS.protocol.md ./AGENTS.md   # o añádelo a tu AGENTS.md
cp <ruta-a-swarm-forge>/topologies/<tu-topología>/topology.json ./topology.json
echo ".codex/swarm/" >> .gitignore
```

- Codex solo carga `.codex/config.toml` en proyectos **confiables**, y la confianza es por raíz de repo git: un repo nuevo dentro de una carpeta confiable no la hereda. Acepta el diálogo de confianza la primera vez o regístralo en `~/.codex/config.toml`:
  ```toml
  [projects.'c:\ruta\a\tu-proyecto']
  trust_level = "trusted"
  ```
  Si no se carga, Codex ignora en silencio el modelo, el sandbox y los `[agents]` del proyecto (verificado: arranca con tu modelo global y en `read-only`).
- Para el enjambre, lanza Codex en **modo autónomo**, sin diálogos de permisos:
  ```bash
  codex --ask-for-approval never --sandbox workspace-write     # corto: codex -a never -s workspace-write
  ```
  O de forma global, en `~/.codex/config.toml`:
  ```toml
  approval_policy = "never"
  sandbox_mode = "workspace-write"
  ```
  Elimina los diálogos pero mantiene el sandbox, así que los jueces `read-only` siguen sin poder escribir. No omitas `--sandbox`: en un repo no confiable el valor por defecto es `read-only` y, sin diálogos, el agente no puede escribir ni avisarte. `--dangerously-bypass-approvals-and-sandbox` quita también el sandbox: solo en entornos ya aislados. Ver [`spec/AUTONOMY.md`](../../spec/AUTONOMY.md).
- Adapta los comandos de verificación en `AGENTS.md` y los Write-Locks en `topology.json`.

## Estructura

| Archivo en tu proyecto | Para qué |
|---|---|
| `AGENTS.md` | Protocolo de 5 fases para el hilo principal (Sentinel). Codex lo descubre solo. |
| `.codex/config.toml` | Modelo del Sentinel, sandbox por defecto y ajustes de `[agents]` (concurrencia, modelo por defecto de subagentes). |
| `.codex/agents/*.toml` | 10 roles: `orchestrator`, `explorer`, `worker_backend`, `worker_frontend`, `devops`, `code_reviewer`, `security_auditor`, `challenger`, `forensic_auditor`, `victory_auditor`. |
| `.codex/victory.schema.json` | Formato fijo del veredicto de victoria (`--output-schema`). |

## Cómo se cumplen las reglas en Codex

| Regla Swarm-Forge | Mecanismo en Codex |
|---|---|
| Jueces sin permiso de escritura | `sandbox_mode = "read-only"` en `code_reviewer`, `security_auditor`, `forensic_auditor` y `explorer` |
| Write-Locks de los workers | Instrucción en `developer_instructions` + verificación con [`tools/check-write-locks.mjs`](../../tools/check-write-locks.mjs) + veto del `forensic_auditor`. Codex no restringe la escritura por rutas; para locks físicos usa el Modo B con worktrees. |
| Victoria en contexto frío | `codex exec --ephemeral`: proceso nuevo, sin historial, con salida validada por `victory.schema.json` |
| Context Shield del Sentinel | Hilo principal en `gpt-5.6-luna` que delega todo lo pesado |
| Tiers de inteligencia | `model` + `model_reasoning_effort` por agente |

## Operación

```text
Tú: "Usa el enjambre para añadir recuperación de contraseña."

Sentinel (hilo principal)
 ├─ lanza 3 explorer en paralelo            → informes
 ├─ lanza orchestrator                      → .codex/swarm/ANALYSIS_REPORT.md
 ├─ Gate M0: te presenta el reporte y espera tu aprobación
 ├─ lanza worker_backend + worker_frontend  → código + handoff-*.md
 ├─ corre check-write-locks.mjs por worker
 ├─ lanza code_reviewer + security_auditor + challenger, luego forensic_auditor
 └─ codex exec --ephemeral (victory)        → .codex/swarm/VICTORY.json
```

Para lanzar un subagente basta con pedirlo en lenguaje natural ("lanza el agente worker_backend con su bloque del DISPATCH"). Con `/agent` cambias entre los hilos activos.

## Por verificar

- **Subagentes TOML y victoria con `codex exec`:** falta la corrida del enjambre completo. Las claves de `.codex/config.toml` pasan `--strict-config` en 0.157.1 y la función `multi_agent` está activa por defecto.
- **Diálogo de confianza en el Modo B:** cada worktree de herdr es un repo sin confianza registrada. Con `--sandbox` explícito el agente escribe igual, pero no está comprobado si la TUI muestra el diálogo de confianza al arrancar; si un agente de Codex queda detenido al lanzarlo, mira su pane con `herdr agent read <nombre>`.

Resuelto con Codex 0.157.1: los niveles de razonamiento dependen del modelo (`gpt-6-astra`, `gpt-6-sol` y la familia 5.6 salvo Luna llegan hasta `ultra`; las Luna, hasta `max`), y el modelo por defecto es `gpt-6-luna`. Las plantillas siguen usando `low`, `medium` y `high` y fijando el modelo de forma explícita.
