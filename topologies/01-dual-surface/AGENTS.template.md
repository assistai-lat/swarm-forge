# Swarm Architecture: Dual-Surface (Backend + Frontend)

Este manifiesto rige la coordinación del equipo multi-agente en este repositorio bajo el estándar **Swarm-Forge**.

## 1. Roster de Agentes y Modelos

Los modelos concretos salen de la columna de tu CLI en [`ROSETTA_STONE.md`](../../ROSETTA_STONE.md) según el Tier de cada rol (Modo A), o de tu `roster.json` (Modo B). Los jueces deben usar una familia de modelos distinta a la de los workers cuando tu CLI lo permita (6ª Ley).

| Rol | Tier | Visión | Ámbito / Write-Lock |
|---|---|---|---|
| **`sentinel`** | Tier 3 | **Obligatoria** | Interfaz de usuario & Liveness |
| **`orchestrator`** | Tier 1 | — | Coordinación & Gates |
| **`worker_backend`** | Tier 2 | — | `backend/**` |
| **`worker_frontend`** | Tier 2 | **Obligatoria** | `frontend/**` |
| **`challenger_routing`** | Tier 2 | — | Tests de navegación & URLs |
| **`challenger_realtime`** | Tier 2 | — | Tests de Sockets & Concurrencia |
| **`forensic_auditor`** | Tier 1 | — | Git diff anti-mocks |
| **`victory_auditor`** | Tier 1 | — | Verificación final en frío |

## 2. Protocolo de Ejecución
1. **Fase 0:** Exploración concurrente backend/frontend y redacción de `ANALYSIS_REPORT.md`.
2. **Fase 1:** Gate M0 Humano obligatorio. Pausa hasta aprobación.
3. **Fase 2:** Implementación paralela con Write-Locks en `backend/` y `frontend/`.
4. **Fase 3:** Retadores de routing y tiempo real prueban la integración. Auditor forense inspecciona diffs.
5. **Fase 4:** Victory auditor independiente ejecuta `npx tsc --noEmit` en ambos directorios. 0 errores requeridos.
