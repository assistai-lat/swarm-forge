# 📜 Especificación Universal: Protocolo Swarm-Forge (v1.0)

> Este documento define el **protocolo agnóstico de ejecución** que cualquier motor o proveedor de IA debe cumplir estrictamente al operar un enjambre bajo el estándar Swarm-Forge.

---

## 1. El Ciclo de Vida en 5 Fases

```text
  [ USUARIO ]
       │
       ▼
 ┌───────────┐      Fase 0: Exploración 360° Concurrente (Tier 3)
 │ SENTINEL  │ ──►  3 Exploradores mapean Backend, Frontend/Clientes y Contratos.
 └─────┬─────┘      Producen ANALYSIS_REPORT.md y PROJECT.md.
       │
       ▼
 ┌───────────┐      Fase 1: Gate Humano Obligatorio (M0)
 │ GATE M0   │ ──►  El sistema se detiene. El humano aprueba el diagnóstico y plan.
 └─────┬─────┘      (INVIOLABLE: No se escribe código sin Visto Bueno explícito).
       │
       ▼
 ┌───────────┐      Fase 2: Implementación con Write-Locks (Tier 2)
 │ WORKERS   │ ──►  Workers independientes codifican en paralelo sobre rutas disjuntas.
 └─────┬─────┘      Cada worker emite su handoff.md con pruebas locales de build.
       │
       ▼
 ┌───────────┐      Fase 3: Anillo de Validación Adversarial (Tier 1 & 2)
 │ ADVERSAR. │ ──►  Reviewers revisan stack/seguridad. Challengers ejecutan fuzzing,
 └─────┬─────┘      concurrencia y retrocompatibilidad. Forensic Auditor audita diff.
       │
       ▼
 ┌───────────┐      Fase 4: Certificación en Frío y Victoria (Tier 1)
 │ VICTORY   │ ──►  Auditor con contexto fresco e independiente verifica el 100%
 └───────────┘      de los criterios de aceptación en frío. Cierre de tarea.
```

---

## 2. Detalle de las Fases

### Fase 0: Exploración 360° Concurrente (*Zero-Code Survey*)
- **Objetivo:** Radiografiar el repositorio sin modificar una sola línea de código.
- **Roles:** `Orchestrator` (Tier 1) + 3 `Explorers` concurrentes (Tier 3).
- **Alcance:**
  - *Explorer 1 (Backend/Datos):* Modelos Prisma/SQL, esquemas de tablas, controladores y servicios externos.
  - *Explorer 2 (Frontend/Clientes):* Rutas de enrutador, componentes de interfaz, stores globales y listeners de eventos.
  - *Explorer 3 (Contratos/Routing):* DTOs compartidos, rutas dinámicas, WebSocket payloads y coherencia front-to-back.
- **Entregables:** Generación de `PROJECT.md` y `ANALYSIS_REPORT.md`.

### Fase 1: Gate de Control Humano Obligatorio (*Human-in-the-Loop M0*)
- **Objetivo:** Evitar refactorizaciones costosas no autorizadas y alinear expectativas de arquitectura y UX.
- **Regla Inviolable:** La sesión **DEBE pausar** y requerir la confirmación explícita del usuario humano.
- **Contenido del Checkpoint:**
  1. Causa raíz del problema o alcance exacto del feature.
  2. Alternativas técnicas analizadas (con pros y contras explícitos).
  3. Recomendación del equipo de agentes.
  4. Lista cerrada de archivos a modificar y crear.

### Fase 2: Implementación Paralela Desacoplada (*Write-Lock Execution*)
- **Objetivo:** Desarrollar los requerimientos aprobados con máxima velocidad y cero conflictos de integración.
- **Roles:** `Domain Workers` (Tier 2) orquestados por `Orchestrator 2` (Tier 1).
- **Regla de Aislamiento (*Write-Lock*):** Cada worker recibe en su `DISPATCH.md` una lista exclusiva de archivos o directorios. Si un worker necesita modificar un archivo fuera de su frontera, **debe solicitarlo al orquestador en su handoff**; jamás editarlo directamente.
- **Autoverificación Local:** Todo worker debe ejecutar compilación en local (`tsc`, `pnpm build`, `cargo test`, `flutter analyze`) y lograr código de salida 0 antes de declarar su tarea completa.

### Fase 3: Anillo de Validación Adversarial Dual
- **Objetivo:** Intentar romper activamente la solución y verificar la pureza técnica.
- **Sub-anillo A: Revisión de Stack y Seguridad:**
  - *Code Reviewer:* Patrones de diseño, legibilidad, cero deuda técnica y contratos limpios.
  - *Security Auditor:* Validación de inputs, IDOR, inyecciones, hashing de contraseñas y multi-inquilino.
- **Sub-anillo B: Ataque Adversarial por Vectores de Riesgo:**
  - *Challenger Routing & Deep-links:* Fuzzing masivo de parámetros nulos, links truncados y rutas legacy.
  - *Challenger Real-Time & Concurrency:* Desconexiones de socket, eventos fuera de orden y carreras de condición.
  - *Challenger Backward-Compatibility:* Crucial para ecosistemas con apps móviles o clientes nativos. Verifica que el backend siga respondiendo correctamente a versiones anteriores de la app.
- **Sub-anillo C: Auditor Forense (Anti-Cheat):**
  - Inspecciona el `git diff` completo. Veta inmediatamente la entrega si encuentra tests sorteados, mocks hardcodeados o linters silenciados deliberadamente.

### Fase 4: Certificación en Frío y Cierre (*Victory Audit*)
- **Objetivo:** Evaluación objetiva de aceptación sin sesgo de confirmación.
- **Mecanismo:**
  1. El `Sentinel` recibe el `GATE_STATUS: PASS` del orquestador.
  2. El `Sentinel` convoca a un `Victory Auditor` (Tier 1) en un **hilo independiente y con contexto totalmente limpio**.
  3. El `Victory Auditor` lee únicamente los criterios de aceptación originales de la tarea y ejecuta pruebas automatizadas en frío.
  4. Si se cumple el 100% de los criterios, emite el veredicto: `VICTORY CONFIRMED`.
  5. Se informa al usuario, se genera el commit convencional y se cierra el ciclo.

---

## 3. Las 6 Leyes Inviolables de Swarm-Forge

1. **Ley de No-Auto-Aprobación:** Ningún agente que escriba código puede firmar su propia aprobación de calidad.
2. **Ley del Write-Lock Estricto:** Modificar un archivo no asignado en el `DISPATCH.md` constituye una violación de integridad que anula la iteración.
3. **Ley del Gate Humano M0:** Prohibido escribir código de negocio antes del visto bueno humano a `ANALYSIS_REPORT.md`.
4. **Ley de Compilación Cero Errores:** Todos los repositorios impactados deben pasar su verificación de tipos o compilación estricta con código de salida 0.
5. **Ley de Cero Mocks (Veto Forense):** Los resultados de las pruebas deben ser auténticos; la presencia de simulaciones artificiales para engañar al gate conlleva el rechazo inmediato del código.
6. **Ley de Diversidad Adversarial:** Siempre que el enjambre tenga acceso a más de una familia de modelos, los jueces (Reviewers, Security, Contract Integrator, Challengers, Forensic y Victory Auditor) deben usar una familia **distinta** a la de los workers cuyo código evalúan. Un modelo de la misma familia comparte los puntos ciegos de quien escribió el código. Aplica en ambos modos de ejecución (ver [`SWARM_MODES.md`](../SWARM_MODES.md)); si no hay alternativa, se declara como advertencia en el Gate M0.
