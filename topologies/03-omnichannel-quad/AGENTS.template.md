# Swarm Architecture: Omnichannel Quad (API + Web + Backoffice + Mobile)

Este manifiesto rige la coordinación del equipo multi-agente en este ecosistema omnicanal bajo el estándar **Swarm-Forge**.

## 1. Roster de Agentes y Modelos

| Rol | Tier | Modelo Gemini (AGY) | Modelo Claude | Modelo Codex | Ámbito / Write-Lock |
|---|---|---|---|---|---|
| **`sentinel`** | Tier 3 | Gemini Flash-Lite | Claude 3.5 Haiku | GPT-4o-mini | Interfaz de usuario & Liveness |
| **`orchestrator`** | Tier 1 | Gemini Pro (Alto) | Claude 3.7 Sonnet (16k) | o3-mini (High) | Coordinación & Gates |
| **`worker_api`** | Tier 2 | Gemini Flash (Medio) | Claude 3.7 Sonnet | GPT-4o | `api/**` |
| **`worker_web`** | Tier 2 | Gemini Flash (Medio) | Claude 3.7 Sonnet | GPT-4o | `web/**` |
| **`worker_backoffice`**| Tier 2 | Gemini Flash (Medio) | Claude 3.7 Sonnet | GPT-4o | `backoffice/**` |
| **`worker_mobile`** | Tier 2 | Gemini Flash (Medio) | Claude 3.7 Sonnet | GPT-4o | `mobile/**` (Flutter) |
| **`contract_integrator`**| Tier 1 | Gemini Pro (Alto) | Claude 3.7 Sonnet (16k) | o3-mini (High) | DTOs API vs Dart Models vs Web |
| **`challenger_backward_compat`** | Tier 2 | Gemini Flash (Medio) | Claude 3.7 Sonnet | GPT-4o | No-rotura de apps móviles viejas |
| **`challenger_mobile_offline`** | Tier 2 | Gemini Flash (Medio) | Claude 3.7 Sonnet | GPT-4o | Resiliencia offline móvil |
| **`forensic_auditor`** | Tier 1 | Gemini Pro (Alto) | Claude 3.7 Sonnet (16k) | o3-mini (High) | Git diff anti-mocks |
| **`victory_auditor`** | Tier 1 | Gemini Pro (Alto) | Claude 3.7 Sonnet (16k) | o3-mini (High) | Compilación tsc y flutter analyze |

## 2. Reglas Cruciales
1. **Regla de Retrocompatibilidad:** Ningún cambio de API puede ser destructivo para clientes móviles ya instalados.
2. **Sincronización Dart:** Al agregar o modificar endpoints, el `contract_integrator` valida que los modelos Dart reflejen los cambios sin discrepancias de tipos o nullability.
3. **Compilación Multi-Lenguaje:** Código de salida 0 en `pnpm run build` (Next/Nest) y `flutter analyze` (Flutter).
