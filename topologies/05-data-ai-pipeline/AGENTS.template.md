# Swarm Architecture: Data & AI Pipeline Mesh

Este manifiesto rige la coordinación del equipo multi-agente para proyectos intensivos en datos e inteligencia artificial bajo el estándar **Swarm-Forge**.

## 1. Roster de Agentes y Modelos

Los modelos concretos salen de la columna de tu CLI en [`ROSETTA_STONE.md`](../../ROSETTA_STONE.md) según el Tier de cada rol (Modo A), o de tu `roster.json` (Modo B). Los jueces deben usar una familia de modelos distinta a la de los workers cuando tu CLI lo permita (6ª Ley).

| Rol | Tier | Visión | Ámbito / Write-Lock |
|---|---|---|---|
| **`sentinel`** | Tier 3 | **Obligatoria** | Interfaz de usuario & Liveness |
| **`orchestrator`** | Tier 1 | — | Coordinación & Gates |
| **`worker_gateway`** | Tier 2 | — | `api-gateway/**` |
| **`worker_queues`** | Tier 2 | — | `worker-queues/**` |
| **`worker_ai`** | Tier 1 | — | `ai-engine/**` |
| **`challenger_resilience`** | Tier 2 | — | Caídas de Redis y Jobs |
| **`challenger_llm`** | Tier 2 | — | Cuotas de API & Prompt drift |
| **`victory_auditor`** | Tier 1 | — | Build tsc y pytest |
