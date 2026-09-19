# Swarm Architecture: Multi-Microservice Mesh

Este manifiesto rige la coordinación del equipo multi-agente en este ecosistema distribuido bajo el estándar **Swarm-Forge**.

## 1. Roster de Agentes y Modelos

| Rol | Tier | Modelo Gemini (AGY) | Modelo Claude | Modelo Codex | Ámbito / Write-Lock |
|---|---|---|---|---|---|
| **`sentinel`** | Tier 3 | Gemini Flash-Lite | Claude 3.5 Haiku | GPT-4o-mini | Interfaz de usuario & Liveness |
| **`orchestrator`** | Tier 1 | Gemini Pro (Alto) | Claude 3.7 Sonnet (16k) | o3-mini (High) | Coordinación & Gates |
| **`worker_core`** | Tier 2 | Gemini Flash (Medio) | Claude 3.7 Sonnet | GPT-4o | `daido-cloud-api/**` |
| **`worker_web`** | Tier 2 | Gemini Flash (Medio) | Claude 3.7 Sonnet | GPT-4o | `daido-cloud-web/**` |
| **`worker_multimedia`**| Tier 2 | Gemini Flash (Medio) | Claude 3.7 Sonnet | GPT-4o | `daido-multimedia-api/**`|
| **`worker_scraper`** | Tier 2 | Gemini Flash (Medio) | Claude 3.7 Sonnet | GPT-4o | `daido-scrapper-api/**` |
| **`worker_mailer`** | Tier 2 | Gemini Flash (Medio) | Claude 3.7 Sonnet | GPT-4o | `mailer-backend/**` |
| **`contract_integrator`**| Tier 1 | Gemini Pro (Alto) | Claude 3.7 Sonnet (16k) | o3-mini (High) | Validación DTOs cruzados |
| **`dba`** | Tier 1 | Gemini Pro (Alto) | Claude 3.7 Sonnet (16k) | o3-mini (High) | Prisma & Alembic migrations |
| **`devops`** | Tier 2 | Gemini Flash (Medio) | Claude 3.7 Sonnet | GPT-4o | Docker & Coolify |
| **`forensic_auditor`** | Tier 1 | Gemini Pro (Alto) | Claude 3.7 Sonnet (16k) | o3-mini (High) | Git diff anti-mocks |
| **`victory_auditor`** | Tier 1 | Gemini Pro (Alto) | Claude 3.7 Sonnet (16k) | o3-mini (High) | Compilación 0 errores en todos |

## 2. Reglas Específicas
1. **Despacho selectivo:** Si una tarea no afecta un microservicio, su worker permanece inactivo.
2. **Contract Integrator obligatorio:** Ningún endpoint nuevo se une a la web sin la aprobación del integrador.
3. **Compilación políglota:** Deben compilar con éxito TypeScript (`pnpm run build`) y pasar los checks de Python (`pytest`, `ruff`).
