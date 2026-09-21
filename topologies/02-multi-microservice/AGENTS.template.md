# Swarm Architecture: Multi-Microservice Mesh

Este manifiesto rige la coordinación del equipo multi-agente en este ecosistema distribuido bajo el estándar **Swarm-Forge**.

## 1. Roster de Agentes y Modelos

| Rol | Tier | Modelo Gemini (AGY) | Modelo Claude | Modelo Codex | Modelo OpenCode | Ámbito / Write-Lock |
|---|---|---|---|---|---|---|
| **`sentinel`** | Tier 3 (VLM) | Gemini Flash-Lite | Claude 3.5 Haiku | GPT-4o-mini | Qwen 2.5 VL 7B *(Visión Obligatoria)* | Interfaz de usuario & Liveness |
| **`orchestrator`** | Tier 1 | Gemini Pro (Alto) | Claude 3.7 Sonnet (16k) | o3-mini (High) | DeepSeek-R1 | Coordinación & Gates |
| **`worker_core`** | Tier 2 | Gemini Flash (Medio) | Claude 3.7 Sonnet | GPT-4o | Qwen 2.5 Coder 32B | `daido-cloud-api/**` |
| **`worker_web`** | Tier 2 (VLM) | Gemini Flash (Medio) | Claude 3.7 Sonnet | GPT-4o | Qwen 2.5 VL 7B / Coder | `daido-cloud-web/**` |
| **`worker_multimedia`**| Tier 2 | Gemini Flash (Medio) | Claude 3.7 Sonnet | GPT-4o | Qwen 2.5 Coder 32B | `daido-multimedia-api/**`|
| **`worker_scraper`** | Tier 2 | Gemini Flash (Medio) | Claude 3.7 Sonnet | GPT-4o | Qwen 2.5 Coder 32B | `daido-scrapper-api/**` |
| **`worker_mailer`** | Tier 2 | Gemini Flash (Medio) | Claude 3.7 Sonnet | GPT-4o | Qwen 2.5 Coder 32B | `mailer-backend/**` |
| **`contract_integrator`**| Tier 1 | Gemini Pro (Alto) | Claude 3.7 Sonnet (16k) | o3-mini (High) | DeepSeek-R1 | Validación DTOs cruzados |
| **`dba`** | Tier 1 | Gemini Pro (Alto) | Claude 3.7 Sonnet (16k) | o3-mini (High) | DeepSeek-R1 | Prisma & Alembic migrations |
| **`devops`** | Tier 2 | Gemini Flash (Medio) | Claude 3.7 Sonnet | GPT-4o | Qwen 2.5 Coder 32B | Docker & Coolify |
| **`forensic_auditor`** | Tier 1 | Gemini Pro (Alto) | Claude 3.7 Sonnet (16k) | o3-mini (High) | DeepSeek-R1 | Git diff anti-mocks |
| **`victory_auditor`** | Tier 1 | Gemini Pro (Alto) | Claude 3.7 Sonnet (16k) | o3-mini (High) | DeepSeek-R1 | Compilación 0 errores en todos |

## 2. Reglas Específicas
1. **Despacho selectivo:** Si una tarea no afecta un microservicio, su worker permanece inactivo.
2. **Contract Integrator obligatorio:** Ningún endpoint nuevo se une a la web sin la aprobación del integrador.
3. **Compilación políglota:** Deben compilar con éxito TypeScript (`pnpm run build`) y pasar los checks de Python (`pytest`, `ruff`).
