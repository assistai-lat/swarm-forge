# Swarm Architecture: Data & AI Pipeline Mesh

Este manifiesto rige la coordinación del equipo multi-agente para proyectos intensivos en datos e inteligencia artificial bajo el estándar **Swarm-Forge**.

## 1. Roster de Agentes y Modelos

| Rol | Tier | Modelo Gemini (AGY) | Modelo Claude | Modelo Codex | Ámbito / Write-Lock |
|---|---|---|---|---|---|
| **`sentinel`** | Tier 3 | Gemini Flash-Lite | Claude 3.5 Haiku | GPT-4o-mini | Interfaz de usuario & Liveness |
| **`orchestrator`** | Tier 1 | Gemini Pro (Alto) | Claude 3.7 Sonnet (16k) | o3-mini (High) | Coordinación & Gates |
| **`worker_gateway`** | Tier 2 | Gemini Flash (Medio) | Claude 3.7 Sonnet | GPT-4o | `api-gateway/**` |
| **`worker_queues`** | Tier 2 | Gemini Flash (Medio) | Claude 3.7 Sonnet | GPT-4o | `worker-queues/**` |
| **`worker_ai`** | Tier 1 | Gemini Pro (Alto) | Claude 3.7 Sonnet (16k) | o3-mini (High) | `ai-engine/**` |
| **`challenger_resilience`** | Tier 2 | Gemini Flash (Medio) | Claude 3.7 Sonnet | GPT-4o | Caídas de Redis y Jobs |
| **`challenger_llm`** | Tier 2 | Gemini Flash (Medio) | Claude 3.7 Sonnet | GPT-4o | Cuotas de API & Prompt drift |
| **`victory_auditor`** | Tier 1 | Gemini Pro (Alto) | Claude 3.7 Sonnet (16k) | o3-mini (High) | Build tsc y pytest |
