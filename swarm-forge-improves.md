# Mejoras recomendadas a swarm-forge

> **Estado (2026-09-21): ✅ las tres mejoras están aplicadas.**
> 1. `providers/opencode/` implementado a partir de funycheck, con modelos ajustados a la 6ª Ley y el comodín de los Write-Locks corregido (`"*": deny` en vez de `"**/*": deny`).
> 2. `ROSETTA_STONE.md` actualizada a septiembre de 2026 (incluida la columna de Codex), con nota de vigencia.
> 3. `topologies/06-single-repo-monolith/` creada; `topology.json` ahora admite `paths` y `exclude`.
>
> Además: `providers/codex/` implementado, los Modos A y B redefinidos como un solo CLI vs. varios CLIs, y la 6ª Ley pasó a ser universal.

> Detectadas el 2026-09-21 al adoptar Swarm-Forge en un proyecto real con OpenCode
> (`funycheck`: monolito Next.js 14 + MongoDB/Mongoose, clonado en `C:\Users\tukas\www\funycheck`).
> La adopción ya está hecha y funcionando; esto es lo que el proceso de adopción reveló
> que le falta al estándar/catálogo.

## 1. Implementar `providers/opencode/` (hoy es solo cascarón)

**Estado actual**: `README.md` + `BOOTSTRAP_PROMPT.md` + `templates/` vacío. No existe la
implementación nativa de referencia (la dorada es `providers/antigravity/`).

**Propuesta**: completar el desafío del BOOTSTRAP_PROMPT con una implementación de
referencia que incluya:

- `templates/opencode.json` — modelo default, `small_model`, `instructions` apuntando a un
  protocolo en `.opencode/AGENTS.md` (clave: **no** crear `AGENTS.md` en la raíz del proyecto
  adoptante, porque esa ruta la usan AGY/Codex; opencode permite mantener todo bajo `.opencode/`).
- `templates/agents/*.md` — los 12 roles como agentes de opencode:
  - Sentinel con `mode: all` (usable como primario y como subagente), `edit: deny` forzando
    el "jamás escribe código".
  - Orchestrator con `edit` restringido a los artefactos (p. ej. `.opencode/swarm/**`).
  - Workers con write-locks reales vía `permission.edit` (deny `**/*` primero, allow de la
    superficie después — en opencode gana la ÚLTIMA regla que matchea, orden importante).
  - Challenger con edición solo de tests; Forensic/Victory con `edit: deny`.
- `templates/AGENTS.protocol.md` — el protocolo de 5 fases + roster + locks + comandos de
  verificación, para copiar como `.opencode/AGENTS.md` del proyecto adoptante.
- Documentar en el README del provider: agentes en `.opencode/agents/*.md`, `instructions`
  en `opencode.json`, y que NO se requiere `--profile` ni CLI runner externo (los subagentes
  se invocan con la tool `task` del agente primario).

**Nota de experiencia**: el mapeo "CLI runner con bandera `--profile`" que sugiere el
ROSETTA_STONE no es necesario; la mecánica nativa de agentes/subagentes de opencode cubre
el enjambre completo.

## 2. Actualizar el ROSETTA_STONE.md (modelos desactualizados)

**Estado actual**: las 4 columnas recomiendan modelos de la era 2024/2025:
Claude 3.7 Sonnet, GPT-4o / o3-mini, DeepSeek-R1, Qwen 2.5 Coder 32B, Llama 3.1 8B,
Qwen 2.5 VL, Llama 3.2 11B Vision. Hoy (sept 2026) esas recomendaciones no existen en los
catálogos vigentes o ya no son la elección óptima de su tier.

**Propuesta**:

- Refrescar las 4 columnas con los modelos líderes actuales de cada proveedor.
- Columna OpenCode, ejemplo real verificado en producción (catálogo `opencode-go`, sept 2026):
  - **Tier 1 (Deep Reasoning)**: `glm-5.3` — orquestador, forensic, victory auditor.
  - **Tier 2 (Fast Precision)**: `kimi-k2.7-code` (backend), `glm-5.3` con visión
    (frontend/UI), `grok-4.6` (review/seguridad), `kimi-k2.6` (challenger).
  - **Tier 3 (Bulk Utility)**: `glm-5.3-flash` (exploración), `deepseek-v4-flash` (debug),
    `minimax-m3` (docs).
- Mantener el mandato VLM para Sentinel/Worker Frontend (sigue siendo correcto), pero con
  ejemplos vigentes; glm-5.3 cubre hoy texto+visión en un solo modelo, lo que simplifica
  el "Vision Bridge" de respaldo.
- Agregar una nota de mantenimiento: "las tablas de modelos son ejemplos de época; el tier
  abstracto es el contrato" — así el doc no vuelve a caducar.

## 3. Starter kit para monolito Next.js de repo único

**Estado actual**: `topologies/01-dual-surface` asume dos carpetas/repos separados
(`backend/` + `frontend/`, estilo Chronus). No hay kit para el caso más común en Next.js
App Router: **un solo repo** donde API routes (`app/api/**`), modelos y UI conviven.

**Propuesta**: agregar `topologies/06-single-repo-monolith/` (o `01b-`) con:

- `topology.json` y `AGENTS.template.md` adaptados a locks por subcarpetas:
  - worker_backend: `src/app/api/**`, `src/models/**`, `src/lib/**`, `src/middleware.ts`, `scripts/**`
  - worker_frontend: rutas de UI de `src/app` (todo menos `api/`), `src/components/**`,
    `src/contexts/**`, `src/styles/**`, `src/utils/**`, `public/**`
- La regla de desempate que el caso real obligó a definir: `src/lib` (servidor) vs
  `src/utils` (cliente) — y `src/app/layout.tsx` compartido asignado a frontend.
- Challenger con vectores típicos de este stack: ObjectIds inválidos, flujos de auth
  (reset/verify tokens), doble submit, uploads hostiles.
- Caso real de referencia: funycheck (adopción completa funcionando).

---

*Prioridad sugerida: 1 → 2 → 3. La 1 desbloquea adopciones opencode sin leer la espec
completa; la 2 evita decisiones de modelo erróneas; la 3 es el kit más pedido que falta.*
