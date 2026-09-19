# Swarm Architecture: Mobile-First Triad

Este manifiesto rige la coordinación del equipo multi-agente para productos centrados en aplicaciones móviles bajo el estándar **Swarm-Forge**.

## 1. Roster de Agentes y Modelos

| Rol | Tier | Modelo Gemini (AGY) | Modelo Claude | Modelo Codex | Ámbito / Write-Lock |
|---|---|---|---|---|---|
| **`sentinel`** | Tier 3 | Gemini Flash-Lite | Claude 3.5 Haiku | GPT-4o-mini | Interfaz de usuario & Liveness |
| **`orchestrator`** | Tier 1 | Gemini Pro (Alto) | Claude 3.7 Sonnet (16k) | o3-mini (High) | Coordinación & Gates |
| **`worker_api`** | Tier 2 | Gemini Flash (Medio) | Claude 3.7 Sonnet | GPT-4o | `api/**` |
| **`worker_web`** | Tier 3 | Gemini Flash-Lite | Claude 3.5 Haiku | GPT-4o-mini | `web-landing/**` |
| **`worker_mobile`** | Tier 2 | Gemini Flash (Medio) | Claude 3.7 Sonnet | GPT-4o | `mobile-app/**` |
| **`challenger_backward_compat`** | Tier 2 | Gemini Flash (Medio) | Claude 3.7 Sonnet | GPT-4o | Clientes móviles v1 vs v2 |
| **`challenger_push`** | Tier 2 | Gemini Flash (Medio) | Claude 3.7 Sonnet | GPT-4o | Deserialización Push & FCM |
| **`victory_auditor`** | Tier 1 | Gemini Pro (Alto) | Claude 3.7 Sonnet (16k) | o3-mini (High) | Build tsc y flutter analyze |
