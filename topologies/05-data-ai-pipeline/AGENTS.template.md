# Swarm Architecture: Data & AI Pipeline Mesh

Este manifiesto rige la coordinación del equipo multi-agente para proyectos intensivos en datos e inteligencia artificial bajo el estándar **Swarm-Forge**.

## 1. Roster de Agentes y Modelos

| Rol | Tier | Modelo Gemini (AGY) | Modelo Claude | Modelo Codex | Modelo OpenCode | Ámbito / Write-Lock |
|---|---|---|---|---|---|---|
| **`sentinel`** | Tier 3 (VLM) | Gemini Flash-Lite | Claude 3.5 Haiku | GPT-4o-mini | Qwen 2.5 VL 7B *(Visión Obligatoria)* | Interfaz de usuario & Liveness |
| **`orchestrator`** | Tier 1 | Gemini Pro (Alto) | Claude 3.7 Sonnet (16k) | o3-mini (High) | DeepSeek-R1 | Coordinación & Gates |
| **`worker_gateway`** | Tier 2 | Gemini Flash (Medio) | Claude 3.7 Sonnet | GPT-4o | Qwen 2.5 Coder 32B | `api-gateway/**` |
| **`worker_queues`** | Tier 2 | Gemini Flash (Medio) | Claude 3.7 Sonnet | GPT-4o | Qwen 2.5 Coder 32B | `worker-queues/**` |
| **`worker_ai`** | Tier 1 | Gemini Pro (Alto) | Claude 3.7 Sonnet (16k) | o3-mini (High) | DeepSeek-R1 | `ai-engine/**` |
| **`challenger_resilience`** | Tier 2 | Gemini Flash (Medio) | Claude 3.7 Sonnet | GPT-4o | Qwen 2.5 Coder 32B | Caídas de Redis y Jobs |
| **`challenger_llm`** | Tier 2 | Gemini Flash (Medio) | Claude 3.7 Sonnet | GPT-4o | Qwen 2.5 Coder 32B | Cuotas de API & Prompt drift |
| **`victory_auditor`** | Tier 1 | Gemini Pro (Alto) | Claude 3.7 Sonnet (16k) | o3-mini (High) | DeepSeek-R1 | Build tsc y pytest |
