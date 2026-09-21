# Swarm Architecture: Multi-Microservice Mesh

Este manifiesto rige la coordinación del equipo multi-agente en este ecosistema distribuido bajo el estándar **Swarm-Forge**.

## 1. Roster de Agentes y Modelos

Los modelos concretos salen de la columna de tu CLI en [`ROSETTA_STONE.md`](../../ROSETTA_STONE.md) según el Tier de cada rol (Modo A), o de tu `roster.json` (Modo B). Los jueces deben usar una familia de modelos distinta a la de los workers cuando tu CLI lo permita (6ª Ley).

| Rol | Tier | Visión | Ámbito / Write-Lock |
|---|---|---|---|
| **`sentinel`** | Tier 3 | **Obligatoria** | Interfaz de usuario & Liveness |
| **`orchestrator`** | Tier 1 | — | Coordinación & Gates |
| **`worker_core`** | Tier 2 | — | `daido-cloud-api/**` |
| **`worker_web`** | Tier 2 | **Obligatoria** | `daido-cloud-web/**` |
| **`worker_multimedia`** | Tier 2 | — | `daido-multimedia-api/**` |
| **`worker_scraper`** | Tier 2 | — | `daido-scrapper-api/**` |
| **`worker_mailer`** | Tier 2 | — | `mailer-backend/**` |
| **`contract_integrator`** | Tier 1 | — | Validación DTOs cruzados |
| **`dba`** | Tier 1 | — | Prisma & Alembic migrations |
| **`devops`** | Tier 2 | — | Docker & Coolify |
| **`forensic_auditor`** | Tier 1 | — | Git diff anti-mocks |
| **`victory_auditor`** | Tier 1 | — | Compilación 0 errores en todos |

## 2. Reglas Específicas
1. **Despacho selectivo:** Si una tarea no afecta un microservicio, su worker permanece inactivo.
2. **Contract Integrator obligatorio:** Ningún endpoint nuevo se une a la web sin la aprobación del integrador.
3. **Compilación políglota:** Deben compilar con éxito TypeScript (`pnpm run build`) y pasar los checks de Python (`pytest`, `ruff`).
