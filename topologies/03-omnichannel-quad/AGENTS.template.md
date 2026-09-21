# Swarm Architecture: Omnichannel Quad (API + Web + Backoffice + Mobile)

Este manifiesto rige la coordinación del equipo multi-agente en este ecosistema omnicanal bajo el estándar **Swarm-Forge**.

## 1. Roster de Agentes y Modelos

Los modelos concretos salen de la columna de tu CLI en [`ROSETTA_STONE.md`](../../ROSETTA_STONE.md) según el Tier de cada rol (Modo A), o de tu `roster.json` (Modo B). Los jueces deben usar una familia de modelos distinta a la de los workers cuando tu CLI lo permita (6ª Ley).

| Rol | Tier | Visión | Ámbito / Write-Lock |
|---|---|---|---|
| **`sentinel`** | Tier 3 | **Obligatoria** | Interfaz de usuario & Liveness |
| **`orchestrator`** | Tier 1 | — | Coordinación & Gates |
| **`worker_api`** | Tier 2 | — | `api/**` |
| **`worker_web`** | Tier 2 | **Obligatoria** | `web/**` |
| **`worker_backoffice`** | Tier 2 | — | `backoffice/**` |
| **`worker_mobile`** | Tier 2 | **Obligatoria** | `mobile/**` (Flutter) |
| **`contract_integrator`** | Tier 1 | — | DTOs API vs Dart Models vs Web |
| **`challenger_backward_compat`** | Tier 2 | — | No-rotura de apps móviles viejas |
| **`challenger_mobile_offline`** | Tier 2 | — | Resiliencia offline móvil |
| **`forensic_auditor`** | Tier 1 | — | Git diff anti-mocks |
| **`victory_auditor`** | Tier 1 | — | Compilación tsc y flutter analyze |

## 2. Reglas Cruciales
1. **Regla de Retrocompatibilidad:** Ningún cambio de API puede ser destructivo para clientes móviles ya instalados.
2. **Sincronización Dart:** Al agregar o modificar endpoints, el `contract_integrator` valida que los modelos Dart reflejen los cambios sin discrepancias de tipos o nullability.
3. **Compilación Multi-Lenguaje:** Código de salida 0 en `pnpm run build` (Next/Nest) y `flutter analyze` (Flutter).
