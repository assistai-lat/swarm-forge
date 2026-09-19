# 🗿 Rosetta Stone: Mapeo Universal de Inteligencia y Modelos

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
| **Tier 1 (Deep Reasoning)** | `Orchestrator`, `Architect`, `Contract Integrator`, `Forensic Auditor`, `Victory Auditor` | **Gemini 2.5 Pro**<br>• Thinking: `Alto`<br>• Contexto: 1M tokens | **Claude 3.7 Sonnet**<br>• Extended Thinking: `16,000 tokens`<br>• System: Arquitecto estricto | **o3-mini** / **o1**<br>• Reasoning effort: `high`<br>• Strict structured outputs | **DeepSeek-R1**<br>• CoT sin censura<br>• Servido en vLLM / Ollama |
| **Tier 2 (Fast Precision)** | `Domain Workers` (Backend, Web, Mobile, BO), `Challengers`, `Code Reviewers` | **Gemini 2.5 Flash**<br>• Thinking: `Medio`<br>• Ejecución de comandos y tests | **Claude 3.7 Sonnet**<br>• Standard mode (Thinking: `off` o `4k`)<br>• Herramientas de edición | **GPT-4o**<br>• Temperature: `0.1`<br>• Tool calling avanzado | **Qwen 2.5 Coder 32B**<br>• Especializado en código multi-lenguaje |
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

---

## 4. Regla de Equivalencia de Tokens y Presupuesto

Cada proveedor debe implementar una política equivalente de **preservación de presupuesto**:
1. **Regla del 70/30:** El 70% del tiempo de CPU/Tokens del enjambre debe correr en **Tier 2 y Tier 3**. El **Tier 1** solo debe invocarse en la fase de planificación previa y en el anillo de verificación final.
2. **Context Shield (Sentinel):** El agente que interactúa con el humano debe limpiar o condensar su contexto periódicamente para nunca superar los **10,000 tokens** activos.
3. **Contexto Frío en Victory Audit:** El auditor final debe iniciarse en una sesión completamente fresca (*Clean-room*) para evitar que sesgos de intentos fallidos previos influyan en la certificación de calidad.
