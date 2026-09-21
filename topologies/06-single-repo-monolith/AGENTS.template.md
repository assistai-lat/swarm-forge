# Swarm Architecture: Single-Repo Monolith (API + UI en un solo repo)

Este manifiesto rige la coordinación del equipo multi-agente en este monolito bajo el estándar **Swarm-Forge**.

## 1. Roster de Agentes y Modelos

Los modelos concretos salen de la columna de tu CLI en [`ROSETTA_STONE.md`](../../ROSETTA_STONE.md) según el Tier de cada rol (Modo A), o de tu `roster.json` (Modo B). Los jueces deben usar una familia de modelos distinta a la de los workers cuando tu CLI lo permita (6ª Ley).

| Rol | Tier | Visión | Ámbito / Write-Lock |
|---|---|---|---|
| **`sentinel`** | Tier 3 | **Obligatoria** | Interfaz de usuario & Liveness |
| **`orchestrator`** | Tier 1 | — | Coordinación & Gates |
| **`worker_backend`** | Tier 2 | — | `src/app/api/**`, `src/models/**`, `src/lib/**`, `src/types/**`, `src/middleware.ts`, `scripts/**` |
| **`worker_frontend`** | Tier 2 | **Obligatoria** | `src/app/**` **excepto** `src/app/api/**`, `src/components/**`, `src/contexts/**`, `src/hooks/**`, `src/styles/**`, `src/utils/**`, `public/**` |
| **`devops`** | Tier 3 | — | `package.json`, `Dockerfile`, `next.config.*`, `.env.example` (solo si el DISPATCH lo asigna) |
| **`contract_integrator`** | Tier 1 | — | Tipos compartidos `src/types/**` vs. consumo en la UI |
| **`challenger_routing`** | Tier 2 | — | IDs inválidos, params hostiles, métodos HTTP inesperados |
| **`challenger_auth_flows`** | Tier 2 | — | Tokens de reset/verificación, enumeración de usuarios |
| **`challenger_double_submit`** | Tier 2 | — | Doble envío, idempotencia, concurrencia |
| **`challenger_hostile_uploads`** | Tier 2 | — | Archivos gigantes, MIME falso, path traversal |
| **`forensic_auditor`** | Tier 1 | — | Git diff anti-mocks + archivos fuera de los Write-Locks |
| **`victory_auditor`** | Tier 1 | — | Lint, tipos, build y tests en frío |

## 2. Reglas de Desempate

1. `src/lib/**` es código de servidor (backend); `src/utils/**` es código de cliente (frontend).
2. `src/app/layout.tsx` y las páginas son de la UI; `src/app/api/**` nunca lo toca el frontend.
3. Los tipos compartidos (`src/types/**`) son del backend; el frontend pide cambios en su `handoff.md`.
4. Los archivos de raíz no tienen dueño: solo los toca quien designe el `DISPATCH.md`.
5. Verificación de fronteras: `node <ruta-a-swarm-forge>/tools/check-write-locks.mjs --topology topology.json --role <worker>`.

## 3. Protocolo de Ejecución
1. **Fase 0:** Exploración concurrente de API, UI y tipos compartidos; redacción de `ANALYSIS_REPORT.md`.
2. **Fase 1:** Gate M0 Humano obligatorio. Pausa hasta aprobación.
3. **Fase 2:** Implementación paralela con Write-Locks por subcarpetas (ver tabla).
4. **Fase 3:** Los challengers atacan rutas, auth, concurrencia y uploads. El auditor forense inspecciona el diff y las fronteras.
5. **Fase 4:** El victory auditor ejecuta en frío `pnpm lint`, `npx tsc --noEmit`, el build y los tests. 0 errores requeridos.
