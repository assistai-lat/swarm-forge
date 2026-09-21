# 🗿 Rosetta Stone: Mapeo Universal de Inteligencia y Modelos

> **Alcance: Modo A — Mono-Proveedor.** Cada columna describe un enjambre completo dentro de un solo proveedor. Si quieres combinar modelos de varios proveedores en un mismo enjambre (Modo B), la asignación sale de [`catalog/`](./catalog/) y [`spec/MIXED_ROSTER.md`](./spec/MIXED_ROSTER.md). Ver [`SWARM_MODES.md`](./SWARM_MODES.md).
>
> Los modelos de las tablas son ejemplos de su época; el contrato es el **Tier abstracto**.

Este documento traduce la arquitectura de **Tiers Abstractos de Inteligencia** de Swarm-Forge a los modelos, mecanismos de razonamiento (*thinking*) y herramientas nativas de los cuatro principales entornos de desarrollo asistido por IA:

1. **Antigravity (AGY)** — Google DeepMind (Referencia Dorada)
2. **Claude Code** — Anthropic
3. **Codex / OpenAI Operator** — OpenAI
4. **OpenCode Interpreter** — Modelos de Código Abierto (Open Weights)

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

## 2. Matriz de Equivalencias por Proveedor

| Tier Abstracto | Rol Típico en Swarm-Forge | Antigravity (AGY) | Claude Code | OpenAI Codex / CLI | OpenCode (Open Weights) |
|---|---|---|---|---|---|
| **Tier 1 (Deep Reasoning)** | `Orchestrator`, `Architect`, `Contract Integrator`, `Forensic Auditor`, `Victory Auditor` | **Gemini 2.5 Pro**<br>• Thinking: `Alto`<br>• Contexto: 1M tokens | **Claude 3.7 Sonnet**<br>• Extended Thinking: `16,000 tokens`<br>• System: Arquitecto estricto | **o3-mini** / **o1**<br>• Reasoning effort: `high`<br>• Strict structured outputs | **DeepSeek-R1**<br>• CoT sin censura<br>• Servido en vLLM / Ollama *(100% Texto)* |
| **Tier 2 (Fast Precision)** | `Domain Workers` (Backend, Mobile, BO), `Challengers`, `Code Reviewers` | **Gemini 2.5 Flash**<br>• Thinking: `Medio`<br>• Ejecución de comandos y tests | **Claude 3.7 Sonnet**<br>• Standard mode (Thinking: `off` o `4k`)<br>• Herramientas de edición | **GPT-4o**<br>• Temperature: `0.1`<br>• Tool calling avanzado | **Qwen 2.5 Coder 32B**<br>• Especializado en código multi-lenguaje *(100% Texto)* |
| **Tier 2/3 (Multimodal / UI & Sentinel)** | `Sentinel` (Interfaz de usuario), `Worker Frontend`, `UI Inspector` | **Gemini 2.5 Flash / Flash-Lite**<br>• Visión nativa de capturas<br>• Context Shield < 10k | **Claude 3.5 Haiku / Sonnet**<br>• Visión nativa<br>• Inspección de UI y errores | **GPT-4o / GPT-4o-mini**<br>• Visión nativa<br>• Análisis visual rápido | **Qwen 2.5 VL (7B / 72B)** o **Llama 3.2 11B Vision**<br>• ⚠️ **Obligatorio VLM**: No usar modelos text-only |
| **Tier 3 (Bulk Utility)** | `Explorers / Surveys`, `Docs Writer`, `Liveness Monitor` | **Gemini 2.5 Flash-Lite**<br>• Thinking: `Mínimo / Cero`<br>• 70% ahorro de tokens | **Claude 3.5 Haiku**<br>• Máxima velocidad<br>• Solo lectura de archivos | **GPT-4o-mini**<br>• Ultrarrápido<br>• Inspección de dependencias | **Llama 3.1 8B Instruct**<br>• Ligero en GPU local |

---

## 3. Mapeo de Capacidades y Herramientas

| Concepto Swarm-Forge | Antigravity (AGY) | Claude Code | OpenAI Codex | OpenCode Interpreter |
|---|---|---|---|---|
| **Definición de Agentes y Reglas** | Archivo `AGENTS.md` y `<RULE[]>` en `.gemini/` | Archivo `CLAUDE.md` y `.claude/settings.json` | Archivo `AGENTS.md` / `codex.json` | `opencode.json` y perfiles de sistema |
| **Gestión de Subagentes** | `invoke_subagent`, `send_message`, `manage_task` | `Task` tool / sub-hilos de Claude | Assistants API / Swarm SDK loops | Múltiples instancias CLI concurrentes |
| **Aislamiento de Archivos (Write-Locks)** | Especificado en `DISPATCH.md` por worker | Directiva estricta en prompt de sub-tarea | Restricción en `allowed_tools` y prompt | Restricciones de rutas por script |
| **Comando de Inicio (*Entrypoint*)** | `/teamwork-preview` o skill `@swarm-forge` | Comando `/swarm` o prompt inicial en terminal | Script de orquestación python / CLI | CLI runner con bandera `--profile` |
| **Soporte MCP (Model Context Protocol)** | `~/.gemini/config/mcp_config.json` | `.mcp.json` o config nativa Claude | Integración MCP nativa | `opencode.json` mcpServers |
| **Soporte Multimodal / Visión (Capturas de pantalla)** | **Nativo en todos los tiers** (Gemini 2.5 Pro/Flash/Flash-Lite) | **Nativo** (Claude 3.7 / 3.5 procesan imágenes) | **Nativo** (GPT-4o / GPT-4o-mini procesan imágenes) | **Condicional (Requiere VLM)**: El Sentinel y UI deben usar Qwen 2.5 VL o Llama 3.2 Vision. Prohibido usar DeepSeek-R1 text-only en Sentinel. |

---

## 4. Regla de Equivalencia de Tokens y Presupuesto

Cada proveedor debe implementar una política equivalente de **preservación de presupuesto**:
1. **Regla del 70/30:** El 70% del tiempo de CPU/Tokens del enjambre debe correr en **Tier 2 y Tier 3**. El **Tier 1** solo debe invocarse en la fase de planificación previa y en el anillo de verificación final.
2. **Context Shield (Sentinel):** El agente que interactúa con el humano debe limpiar o condensar su contexto periódicamente para nunca superar los **10,000 tokens** activos.
3. **Contexto Frío en Victory Audit:** El auditor final debe iniciarse en una sesión completamente fresca (*Clean-room*) para evitar que sesgos de intentos fallidos previos influyan en la certificación de calidad.

---

## 5. Directriz Crítica: El Imperativo Multimodal (VLM vs. Text-Only)

### El Riesgo de la "Ceguera Visual" en Enjambres Locales / Abiertos
En plataformas en la nube comerciales (Antigravity con Gemini, Claude Code, OpenAI), todos los modelos del catálogo incorporan visión multimodal por defecto. Sin embargo, en el ecosistema de **código abierto (Open Weights / OpenCode / Ollama / vLLM)**, los modelos más populares y con mayor benchmark de código y razonamiento (como **DeepSeek-R1** o **Qwen 2.5 Coder 32B**) son **estrictamente de texto**.

En el flujo de trabajo real de un desarrollador de software:
- Los reportes de bugs a menudo consisten en una captura de pantalla del navegador o de la consola de red DevTools.
- Las tareas de diseño o frontend se apoyan en capturas de pantalla de Figma o wireframes.
- Los errores de layout no siempre emiten un stacktrace textual, sino un defecto gráfico visible.

Si un proveedor asigna un modelo text-only al `Sentinel` (el agente que atiende al humano) o al revisor de UI:
1. El backend del proveedor arrojará un error 400 (`unsupported media type` / `no image support`) al recibir la captura de pantalla.
2. El agente ignorará por completo la imagen y alucinará una respuesta desconectada de la realidad visual del usuario.
3. La experiencia del desarrollador se degradará drásticamente.

### Las 3 Reglas de Oro Multimodales:
1. **Regla del Centinela Vidente:** El agente `Sentinel` **SIEMPRE debe ser multimodal (VLM)**. Bajo ninguna circunstancia se debe desplegar un Sentinel con un modelo puramente de texto.
2. **Especialización Asimétrica en OpenCode:**
   - **Frontera de Usuario y UI (`Sentinel`, `Worker Frontend`):** Asignar **Qwen 2.5 VL** (7B para rapidez o 72B para alta precisión) o **Llama 3.2 11B Vision**.
   - **Razonamiento Profundo y Backend (`Orchestrator`, `Forensic Auditor`, `Worker Backend`, `DBA`):** Asignar **DeepSeek-R1** o **Qwen 2.5 Coder 32B** (modelos de texto puro donde su potencia de Chain-of-Thought y generación de código es insuperable).
3. **Mecanismo de Respaldo (Router / Vision Bridge):** Si la infraestructura local cuenta con memoria VRAM limitada que impida correr un VLM pesado en simultáneo, el adaptador de OpenCode debe configurar una sub-rutina o servidor MCP de visión ligera (ej. `Qwen2.5-VL-7B` o script OCR local) que describa o transcriba visualmente la imagen antes de entregar el payload al orquestador.
