# 📄 Especificación Universal: Esquemas de Artefactos de Intercambio

Los agentes que operan bajo el estándar Swarm-Forge se comunican a través de **Artefactos Estructurados en Markdown**. Esto garantiza que cualquier proveedor de IA (AGY, Claude, Codex, OpenCode) pueda leer, auditar e interactuar con el estado del proyecto sin acoplamiento binario.

---

## 1. `PROJECT.md` (El Manifiesto de Proyecto)
Generado en la Fase 0 por el `Orchestrator 1` y mantenido hasta el cierre. Define la verdad arquitectónica del requerimiento actual.

### Secciones Obligatorias:
```markdown
# Project: [Nombre del Requerimiento / Feature]

## Architecture & Impacted Surfaces
- Lista de superficies afectadas (ej. `api`, `web`, `mobile`).
- Flujo de datos y canales de comunicación (REST, WebSocket, Push, BLoC).

## Feature Inventory
| # | Feature | Descripción | Superficie | Milestones |
|---|---|---|---|---|
| 1 | Clonación de Sender | Endpoint POST /senders/:id/clone | api | M1 |
| 2 | Botón y Diálogo UI | Modal en vista ajustes | web | M2 |

## Milestones & Gates
| # | Nombre | Dependencias | Estado (PLANNED / IN_PROGRESS / DONE) |
|---|---|---|---|
| M0 | Diagnóstico & Gate Humano | Ninguna | DONE |
| M1 | Implementación Backend | M0 | IN_PROGRESS |
| M2 | Implementación Frontend | M0 | PLANNED |
| M3 | Anillo Adversarial & Victoria | M1, M2 | PLANNED |

## Interface Contracts (Frozen)
[Definición estricta de interfaces TypeScript / Dart / esquemas SQL congelados para los workers]
```

---

## 2. `ANALYSIS_REPORT.md` (Reporte de Auditoría y Gate M0)
Presentado al usuario humano al final de la Fase 0. La sesión **se detiene** hasta que el usuario apruebe este informe.

### Secciones Obligatorias:
```markdown
# Reporte de Diagnóstico Técnico y Alternativas de Arquitectura
**Proyecto:** [Nombre]  
**Estado:** PENDIENTE DE APROBACIÓN HUMANA (Gate M0)

## 1. Causa Raíz / Justificación Técnica
[Diagnóstico forense del problema o necesidad del feature]

## 2. Alternativas Evaluadas
### Alternativa A: [Nombre]
- Descripción técnica.
- Pros y Contras.
### Alternativa B: [Nombre]
- Descripción técnica.
- Pros y Contras.

👉 **Recomendación del Equipo Swarm:** [Alternativa elegida y por qué].

## 3. Presupuesto de Cambios y Write-Locks Propuestos
- `worker_backend`: [Archivos a modificar/crear]
- `worker_frontend`: [Archivos a modificar/crear]

## 4. Criterios de Aceptación Inviolables
- [ ] Criterio 1
- [ ] Criterio 2
- [ ] Compilación con 0 errores en todos los repos
```

---

## 3. `DISPATCH.md` (Orden de Trabajo y Write-Lock)
Generado por el `Orchestrator 2` para cada `Domain Worker`.

### Secciones Obligatorias:
```markdown
# DISPATCH: [worker_dominio] — [Timestamp ISO]

## Context Documents to Read First:
- PROJECT.md
- ANALYSIS_REPORT.md

## Exclusive Write-Lock Permission (INVIOLABLE):
Tienes permiso EXCLUSIVO para modificar y crear únicamente en:
1. `ruta/al/archivo/1.ts`
2. `carpeta/modulo/**`

⚠️ CUALQUIER ESCRITURA FUERA DE ESTAS RUTAS ANULARÁ TU ENTREGA.

## Specific Missions & Acceptance Tasks:
1. [Misión 1]
2. [Misión 2]

## Local Verification Commands:
- Ejecuta `npx tsc --noEmit` en tu directorio. Código de salida debe ser 0.
- Ejecuta pruebas unitarias de tu módulo.

## Handoff Instructions:
Al finalizar, escribe tu informe de entrega en `handoff.md` con las pruebas de compilación y diff.
```

---

## 4. `GATE_STATUS.md` (Evaluación de Compuertas de Calidad)
Mantenido por el `Orchestrator 2` para consolidar los veredictos del Anillo Adversarial en Fase 3.

```markdown
# GATE STATUS: [Hito M3]

## Evaluaciones del Anillo:
| Evaluador | Rol | Veredicto (PASS / FAIL) | Observaciones |
|---|---|---|---|
| Reviewer 1 | Code & Contracts | PASS | Tipado limpio, cero deuda técnica |
| Reviewer 2 | Security | PASS | Validaciones DTO y multi-inquilino OK |
| Challenger 1 | Routing Fuzzing | PASS | Probadas 5,000 combinaciones sin 404 |
| Challenger 2 | Backward-Compat | PASS | Clientes móviles v1.2 compatibles |
| Forensic Auditor | Anti-Cheat | PASS | Diff inspeccionado, 0 mocks simulados |

## Estado Global del Gate:
**STATUS: [PASS / BLOCKED]**
```

---

## 5. `handoff.md` (Informe de Entrega del Worker)
Escrito por cada worker al culminar su misión.

```markdown
# Handoff Report: [Nombre del Worker]
**Fecha:** [Timestamp]  
**Estado:** COMPLETADO PARA REVISIÓN

## Archivos Modificados / Creados:
- `ruta/archivo1.ts` (+45 / -12)
- `ruta/archivo2.tsx` (+80 / -0)

## Pruebas Locales y Evidencia de Compilación:
- Comando: `pnpm run build`
- Código de salida: 0
- Salida del linter: 0 warnings, 0 errors

## Solicitudes de Cambio a Otras Superficies (si aplica):
[Si el worker necesitó un campo extra en el backend o contrato, lo reporta aquí para el orquestador]
```
