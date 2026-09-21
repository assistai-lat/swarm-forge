# Swarm Architecture: Mobile-First Triad

Este manifiesto rige la coordinación del equipo multi-agente para productos centrados en aplicaciones móviles bajo el estándar **Swarm-Forge**.

## 1. Roster de Agentes y Modelos

Los modelos concretos salen de la columna de tu CLI en [`ROSETTA_STONE.md`](../../ROSETTA_STONE.md) según el Tier de cada rol (Modo A), o de tu `roster.json` (Modo B). Los jueces deben usar una familia de modelos distinta a la de los workers cuando tu CLI lo permita (6ª Ley).

| Rol | Tier | Visión | Ámbito / Write-Lock |
|---|---|---|---|
| **`sentinel`** | Tier 3 | **Obligatoria** | Interfaz de usuario & Liveness |
| **`orchestrator`** | Tier 1 | — | Coordinación & Gates |
| **`worker_api`** | Tier 2 | — | `api/**` |
| **`worker_web`** | Tier 3 | — | `web-landing/**` |
| **`worker_mobile`** | Tier 2 | **Obligatoria** | `mobile-app/**` |
| **`challenger_backward_compat`** | Tier 2 | — | Clientes móviles v1 vs v2 |
| **`challenger_push`** | Tier 2 | — | Deserialización Push & FCM |
| **`victory_auditor`** | Tier 1 | — | Build tsc y flutter analyze |
