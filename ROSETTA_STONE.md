# 🗿 Rosetta Stone: Mapeo Universal de Inteligencia y Modelos

> **Alcance: Modo A — Mono-Harness (un solo CLI).** Cada columna describe un enjambre completo dentro de un CLI. Algunos CLIs (OpenCode, AGY) ofrecen modelos de varias familias: úsalos para cumplir la 6ª Ley (jueces de otra familia). Si quieres combinar **varios CLIs** en un mismo enjambre (Modo B), la asignación sale de [`catalog/`](./catalog/) y [`spec/MIXED_ROSTER.md`](./spec/MIXED_ROSTER.md). Ver [`SWARM_MODES.md`](./SWARM_MODES.md).
>
> **Vigencia: septiembre 2026.** Los modelos son ejemplos de su época; el contrato es el **Tier abstracto**. Cuando un proveedor cambie su línea de modelos, actualiza esta tabla y [`catalog/models.json`](./catalog/models.json) a la vez.

Este documento traduce la arquitectura de **Tiers Abstractos de Inteligencia** de Swarm-Forge a los modelos, mecanismos de razonamiento (*thinking*) y herramientas nativas de los cuatro principales CLIs de desarrollo asistido por IA:

1. **Antigravity (AGY)** — Google DeepMind (Referencia Dorada)
2. **Claude Code** — Anthropic
3. **Codex CLI** — OpenAI
4. **OpenCode** — Multi-proveedor (gateways como `opencode-go` y modelos locales vía Ollama / vLLM)

---

## 1. Definición de los 3 Tiers Abstractos de Inteligencia

```
┌────────────────────────────────────────────────────────────────────────┐
│                        TIER 1: DEEP REASONING                          │
│   • Pensamiento arquitectónico de alto nivel y visión holística.       │
│   • Detección de fallos sutiles, IDOR, colisiones y carreras de estado.│
│   • Veto absoluto de auditoría forense y certificación en frío.        │
├────────────────────────────────────────────────────────────────────────┤
│                        TIER 2: FAST PRECISION                          │
│   • Escritura de código de alta velocidad con tipado estricto.         │
│   • Ejecución de scripts adversariales (fuzzing masivo de rutas).      │
│   • Implementación fiel a contratos de interfaces pre-congelados.      │
├────────────────────────────────────────────────────────────────────────┤
│                        TIER 3: BULK UTILITY                            │
│   • Mapeo superficial y concurrente de repositorios enteros.           │
│   • Búsquedas semánticas, lectura de logs y redacción de docs.         │
│   • Costo casi nulo por token; máxima velocidad de respuesta.          │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Matriz de Equivalencias por CLI

| Tier Abstracto | Rol Típico en Swarm-Forge | Antigravity (AGY) | Claude Code | Codex CLI (OpenAI) | OpenCode |
|---|---|---|---|---|---|
| **Tier 1 (Deep Reasoning)** | `Orchestrator`, `Architect`, `Contract Integrator`, `Forensic Auditor`, `Victory Auditor` | **`gemini-3.1-pro-high`**<br>• Thinking: `Alto` | **Opus** (`opus`)<br>• Extended thinking alto | **`gpt-6-astra`** (vetos) / **`gpt-5.6-sol`** (planificación)<br>• `model_reasoning_effort = "high"` | **`glm-5.3`** (orchestrator)<br>**`deepseek-v4-pro`** (forensic)<br>**`grok-4.6`** (victory) |
| **Tier 2 (Fast Precision)** | `Domain Workers` (Backend, Mobile, BO), `Challengers`, `Code Reviewers` | **`gemini-3.8-flash-medium`** / **`-high`**<br>• Thinking: `Medio` | **Sonnet** (`sonnet`) | **`gpt-5.6-terra`**<br>• `model_reasoning_effort = "medium"` | **`kimi-k2.7-code`** (backend)<br>**`grok-4.6`** (reviewers)<br>**`deepseek-v4-pro`** (challenger) |
| **Tier 2/3 (Multimodal / UI & Sentinel)** | `Sentinel` (Interfaz de usuario), `Worker Frontend`, `UI Inspector` | **`gemini-3.8-flash-low`** (Sentinel)<br>**`gemini-3.8-flash-medium`** (UI)<br>• Visión nativa | **Haiku** (Sentinel)<br>**Sonnet** (UI)<br>• Visión nativa | **`gpt-5.6-luna`** (Sentinel)<br>**`gpt-5.6-terra`** (UI)<br>• Visión nativa | **`glm-5.3`**<br>• ⚠️ **VLM obligatorio**: la mayoría de los modelos de código del gateway son solo texto |
| **Tier 3 (Bulk Utility)** | `Explorers / Surveys`, `Docs Writer`, `Liveness Monitor` | **`gemini-3.8-flash-low`**<br>• Thinking: `Mínimo` | **Haiku** (`haiku`) | **`gpt-5.6-luna`**<br>• `model_reasoning_effort = "low"` | **`glm-5.3-flash`** (exploración)<br>**`deepseek-v4-flash`** (devops) |

Notas:
- **Claude Code** usa alias (`opus`, `sonnet`, `haiku`) que el CLI resuelve al modelo vigente de cada línea.
- **AGY** también ofrece `claude-opus-4-6-thinking`, `claude-sonnet-4-6` y `gpt-oss-120b-medium`: úsalos en los jueces para cumplir la 6ª Ley sin salir de AGY (lista completa con `agy models`).
- **Codex** solo ofrece modelos de OpenAI: la 6ª Ley no es alcanzable dentro de Codex (ver [`providers/codex/`](./providers/codex/)). Precios y detalles de cada modelo en su README.
- **OpenCode**: la columna refleja el enjambre de producción de funycheck, corregido para cumplir la 6ª Ley (lista completa con `opencode models`). Con modelos locales, aplica la misma lógica: VLM en la frontera con el usuario y en la UI, y modelos de texto fuertes en el resto.

---

## 3. Mapeo de Capacidades y Herramientas

| Concepto Swarm-Forge | Antigravity (AGY) | Claude Code | Codex CLI | OpenCode |
|---|---|---|---|---|
| **Definición de Agentes y Reglas** | `AGENTS.md` y reglas en `.gemini/` | `CLAUDE.md` + subagentes en `.claude/agents/*.md` | `AGENTS.md` + subagentes TOML en `.codex/agents/*.toml` | `.opencode/AGENTS.md` (vía `instructions`) + agentes en `.opencode/agents/*.md` |
| **Gestión de Subagentes** | `invoke_subagent`, `send_message`, `manage_task` | Herramienta `Task` | Subagentes nativos ("lanza el agente X"); `/agent` cambia de hilo | Herramienta `task` o `@mención` |
| **Modelo por Subagente** | Parámetro `model` de `invoke_subagent` | Campo `model` del agente | Campos `model` y `model_reasoning_effort` del TOML | Campo `model` del agente (`proveedor/modelo`) |
| **Aislamiento de Archivos (Write-Locks)** | Especificado en `DISPATCH.md` por worker | Instrucción en el prompt; los jueces sin herramientas de edición (campo `tools`) | Instrucción en el prompt + [`check-write-locks.mjs`](./tools/check-write-locks.mjs); jueces en `sandbox_mode = "read-only"` | **Físico**: `permission.edit` por agente (gana la última regla) |
| **Comando de Inicio (*Entrypoint*)** | `/teamwork-preview` o skill `@swarm-forge` | Prompt inicial ("usa el enjambre...") | Prompt inicial; `codex exec` para pasos no interactivos | Prompt inicial o agente `sentinel` (`mode: all`) |
| **Contexto Frío (Victory Audit)** | Subagente nuevo | Subagente nuevo (`Task`) | Proceso nuevo: `codex exec --ephemeral` con `--output-schema` | Subagente nuevo con solo criterios y rutas |
| **Soporte MCP (Model Context Protocol)** | `~/.gemini/config/mcp_config.json` | `.mcp.json` | `mcp_servers` en `config.toml` | `mcp` en `opencode.json` |
| **Soporte Multimodal / Visión** | **Nativo** en los modelos Gemini | **Nativo** en Opus, Sonnet y Haiku | **Nativo** en GPT-6 Astra y GPT-5.6 Sol, Terra y Luna | **Condicional**: depende del modelo. Verifica la visión antes de asignar el Sentinel o la UI. |

---

## 4. Regla de Equivalencia de Tokens y Presupuesto

Cada proveedor debe implementar una política equivalente de **preservación de presupuesto**:
1. **Regla del 70/30:** El 70% del tiempo de CPU/Tokens del enjambre debe correr en **Tier 2 y Tier 3**. El **Tier 1** solo debe invocarse en la fase de planificación previa y en el anillo de verificación final.
2. **Context Shield (Sentinel):** El agente que interactúa con el humano debe limpiar o condensar su contexto periódicamente para nunca superar los **10,000 tokens** activos.
3. **Contexto Frío en Victory Audit:** El auditor final debe iniciarse en una sesión completamente fresca (*Clean-room*) para evitar que sesgos de intentos fallidos previos influyan en la certificación de calidad.

---

## 5. Directriz Crítica: El Imperativo Multimodal (VLM vs. Text-Only)

### El Riesgo de la "Ceguera Visual"
En Claude Code, AGY y Codex, todos los modelos del catálogo incorporan visión. En cambio, en los gateways multi-proveedor y en los modelos locales (OpenCode, Ollama, vLLM), **muchos de los modelos más fuertes en código y razonamiento son solo texto** (p. ej. `deepseek-v4-pro`, `kimi-k2.7-code`, `grok-4.6` en `opencode-go`).

En el flujo de trabajo real de un desarrollador de software:
- Los reportes de bugs a menudo consisten en una captura de pantalla del navegador o de la consola de red DevTools.
- Las tareas de diseño o frontend se apoyan en capturas de pantalla de Figma o wireframes.
- Los errores de layout no siempre emiten un stacktrace textual, sino un defecto gráfico visible.

Si se asigna un modelo text-only al `Sentinel` (el agente que atiende al humano) o al revisor de UI:
1. El backend del proveedor arrojará un error 400 (`unsupported media type` / `no image support`) al recibir la captura de pantalla.
2. El agente ignorará por completo la imagen y alucinará una respuesta desconectada de la realidad visual del usuario.
3. La experiencia del desarrollador se degradará drásticamente.

### Las 3 Reglas de Oro Multimodales:
1. **Regla del Centinela Vidente:** El agente `Sentinel` **SIEMPRE debe ser multimodal (VLM)**. Bajo ninguna circunstancia se debe desplegar un Sentinel con un modelo puramente de texto.
2. **Especialización Asimétrica en CLIs multi-modelo (OpenCode):**
   - **Frontera de Usuario y UI (`Sentinel`, `Worker Frontend`):** un modelo con visión verificada (hoy `glm-5.3` en `opencode-go`; en local, un VLM de la familia Qwen-VL o equivalente).
   - **Razonamiento Profundo y Backend (`Orchestrator`, `Forensic Auditor`, `Worker Backend`, `DBA`):** los modelos de texto más fuertes disponibles (hoy `deepseek-v4-pro`, `kimi-k2.7-code`).
3. **Mecanismo de Respaldo (Router / Vision Bridge):** Si la infraestructura local no puede correr un VLM pesado en simultáneo, el adaptador debe configurar una sub-rutina o servidor MCP de visión ligera (un VLM pequeño o un script OCR local) que describa o transcriba la imagen antes de entregar el payload al orquestador.
