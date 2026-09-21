# Swarm Architecture: Dual-Surface (Backend + Frontend)

Este manifiesto rige la coordinación del equipo multi-agente en este repositorio bajo el estándar **Swarm-Forge**.

## 1. Roster de Agentes y Modelos

| Rol | Tier Abstracto | Modelo Gemini (AGY) | Modelo Claude | Modelo Codex | Modelo OpenCode | Ámbito / Write-Lock |
|---|---|---|---|---|---|---|
| **`sentinel`** | Tier 3 (VLM) | Gemini Flash-Lite | Claude 3.5 Haiku | GPT-4o-mini | Qwen 2.5 VL 7B *(Visión Obligatoria)* | Interfaz de usuario & Liveness |
| **`orchestrator`** | Tier 1 | Gemini Pro (Alto) | Claude 3.7 Sonnet (16k) | o3-mini (High) | DeepSeek-R1 | Coordinación & Gates |
| **`worker_backend`** | Tier 2 | Gemini Flash (Medio) | Claude 3.7 Sonnet | GPT-4o | Qwen 2.5 Coder 32B | `backend/**` |
| **`worker_frontend`** | Tier 2 (VLM) | Gemini Flash (Medio) | Claude 3.7 Sonnet | GPT-4o | Qwen 2.5 VL 7B / Coder | `frontend/**` |
| **`challenger_routing`** | Tier 2 | Gemini Flash (Medio) | Claude 3.7 Sonnet | GPT-4o | Qwen 2.5 Coder 32B | Tests de navegación & URLs |
| **`challenger_realtime`** | Tier 2 | Gemini Flash (Medio) | Claude 3.7 Sonnet | GPT-4o | Qwen 2.5 Coder 32B | Tests de Sockets & Concurrencia |
| **`forensic_auditor`** | Tier 1 | Gemini Pro (Alto) | Claude 3.7 Sonnet (16k) | o3-mini (High) | DeepSeek-R1 | Git diff anti-mocks |
| **`victory_auditor`** | Tier 1 | Gemini Pro (Alto) | Claude 3.7 Sonnet (16k) | o3-mini (High) | DeepSeek-R1 | Verificación final en frío |

## 2. Protocolo de Ejecución
1. **Fase 0:** Exploración concurrente backend/frontend y redacción de `ANALYSIS_REPORT.md`.
2. **Fase 1:** Gate M0 Humano obligatorio. Pausa hasta aprobación.
3. **Fase 2:** Implementación paralela con Write-Locks en `backend/` y `frontend/`.
4. **Fase 3:** Retadores de routing y tiempo real prueban la integración. Auditor forense inspecciona diffs.
5. **Fase 4:** Victory auditor independiente ejecuta `npx tsc --noEmit` en ambos directorios. 0 errores requeridos.
