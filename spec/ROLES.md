# 👥 Especificación Universal: Catálogo de Roles Swarm-Forge

Este documento define formalmente los **12 Roles Especializados** que conforman el ecosistema Swarm-Forge.

---

## Matriz General de Roles

| # | Rol | Identificador | Tier | Capacidad Multimodal | Herramientas Típicas | Responsabilidad Principal |
|---|:---|:---|:---|:---|:---|:---|
| 1 | **Sentinel** | `sentinel` | Tier 2 / 3 | **Obligatoria (Visión)** | Mensajería & Liveness | Protege la ventana de contexto del usuario. Procesa prompts y capturas de pantalla, reporta avances y convoca la auditoría final. |
| 2 | **Orchestrator** | `orchestrator` | Tier 1 | Opcional (Texto) | Subagentes & Tareas | Descompone tareas complejas, asigna Write-Locks en `DISPATCH.md` y evalúa compuertas. |
| 3 | **Explorer / Survey** | `explorer` | Tier 3 | Opcional (Texto) | Solo Lectura | Mapeo rápido de repositorios, lectura masiva de archivos y búsqueda de contratos. |
| 4 | **Domain Worker** | `worker_<dominio>` | Tier 2 | **Requerida en UI / Front** | Lectura, Escritura y Shell | Implementación de lógica, endpoints y UI dentro de su frontera exclusiva de archivos. |
| 5 | **Code Reviewer** | `code-reviewer` | Tier 2 / 1 | Opcional (Texto) | Solo Lectura | Revisa diffs, coherencia de patrones, deuda técnica y legibilidad de código. |
| 6 | **Security Auditor** | `security-auditor` | Tier 1 | Opcional (Texto) | Solo Lectura | Audita validaciones, IDOR, hashing, fugas de secretos y multi-inquilino. |
| 7 | **Adversarial Challenger** | `challenger_<riesgo>` | Tier 2 | Opcional (Texto) | Shell, Scripts y Tests | Ataca el sistema con fuzzing masivo, concurrencia de WebSockets y casos extremos. |
| 8 | **Contract Integrator** | `contract-integrator` | Tier 1 | Opcional (Texto) | Solo Lectura | Garantiza la alineación estricta entre APIs, clientes web y modelos móviles (Dart/Swift). |
| 9 | **Forensic Auditor** | `forensic-auditor` | Tier 1 | Opcional (Texto) | Git diff, Logs | Inspecciona diffs buscando mocks simulados, linters silenciados o intentos de engaño. |
| 10 | **Victory Auditor** | `victory-auditor` | Tier 1 | Opcional (Texto) | Tests, Shell | Auditor independiente en frío que certifica el 100% de los criterios de aceptación. |
| 11 | **Database Architect** | `dba` | Tier 1 | Opcional (Texto) | Prisma, Alembic, SQL | Diseña esquemas relacionales, índices, planes de ejecución y migraciones sin pérdida. |
| 12 | **DevOps & Infra** | `devops` | Tier 2 | Opcional (Texto) | Docker, Coolify, CI/CD | Mantiene Dockerfiles, configuraciones de despliegue, variables de entorno y builds. |

---

## Especificación Detallada de Roles Clave

### 1. `sentinel` (El Centinela)
- **Propósito:** Actuar como el escudo protector del usuario humano. Mantiene un contexto ligero (<10k tokens) para evitar que la ventana de chat se vuelva lenta o pierda instrucciones previas.
- **Requisito Crítico de Capacidad (Visión Multimodal VLM):** **OBLIGATORIO**. El Sentinel es la única superficie de contacto directo con el usuario. En desarrollo de software real, los humanos reportan bugs enviando capturas de pantalla de la consola, errores visuales de la UI, imágenes de Figma o diagramas. Un modelo estrictamente de texto en el rol de Sentinel generará errores de procesamiento de medios, alucinaciones o ceguera total ante el contexto gráfico aportado por el humano. Si el proveedor usa modelos locales/abiertos (ej. OpenCode), el Sentinel **no puede** ser un LLM text-only como DeepSeek-R1 o Qwen-Coder texto puro; debe ser un VLM como **Qwen 2.5 VL** o **Llama 3.2 Vision**.
- **Restricción Inviolable:** **JAMÁS escribe código de producto** ni toma decisiones técnicas profundas.
- **Acciones:**
  - Recibe los requerimientos, capturas de pantalla y feedback del usuario y despacha a `orchestrator_1`.
  - Presenta el `ANALYSIS_REPORT.md` para la aprobación humana (Gate M0).
  - Al recibir el pase del orquestador, convoca al `victory-auditor` con contexto fresco.

### 2. `orchestrator` (El Orquestador de Proyecto)
- **Propósito:** Cerebro estratégico del proyecto. Modela la descomposición en hitos y supervisa la ejecución.
- **Restricción Inviolable:** **JAMÁS escribe código de negocio**. Su función es puramente de coordinación (`DISPATCH.md`), desbloqueo y evaluación de estados (`GATE_STATUS.md`).
- **Sucesión Automática:** Si una iteración se alarga (más de 16 despachos de subagentes), el orquestador actual transfiere su estado a un sucesor fresco (`orchestrator_2`) para preservar nitidez de razonamiento.

### 3. `worker_<dominio>` (Los Workers Especializados)
- **Propósito:** Picar código y resolver los hitos asignados en su `DISPATCH.md`.
- **Especializaciones comunes:**
  - `worker_backend`: APIs, controladores, servicios y bases de datos. (Modelo texto-puro de alta precisión lógica).
  - `worker_frontend`: Interfaces web, vistas, formularios y accesibilidad. (**Capacidad de visión requerida/recomendada** para contrastar capturas de bugs y maquetas).
  - `worker_mobile`: Aplicaciones móviles (Flutter, React Native, Capacitor). (**Capacidad de visión requerida/recomendada** para layouts y assets de pantalla).
  - `worker_backoffice`: Paneles de administración internos y dashboards ERP.
- **Restricción Inviolable:** **Write-Lock estricto**. Solo puede editar los archivos explícitamente autorizados en su despacho.

### 4. `challenger_<vector>` (Los Retadores Adversariales)
- **Propósito:** Agentes deliberadamente hostiles diseñados para romper la solución antes de que llegue a producción.
- **Vectores típicos:**
  - `challenger_routing`: Inyecta 10,000 combinaciones de query params nulos, IDs inválidos y links antiguos.
  - `challenger_realtime`: Simula caídas abruptas de conexión, reconexiones desordenadas y carreras de actualización de estado.
  - `challenger_backward_compat`: Simula peticiones enviadas por versiones antiguas de la aplicación móvil para garantizar que el nuevo backend no rompa clientes desactualizados.

### 5. `victory-auditor` (El Auditor de Victoria)
- **Propósito:** Certificar objetivamente que la tarea está 100% terminada.
- **Regla de Contexto Limpio:** Debe ejecutarse en un hilo nuevo, sin haber participado en la discusión de desarrollo.
- **Comprobación:**
  1. Lee los criterios de aceptación originales.
  2. Ejecuta la compilación en frío de todos los proyectos (`tsc --noEmit`, `pytest`, `flutter analyze`).
  3. Ejecuta la suite de pruebas automatizadas.
  4. Emite el veredicto final: `VICTORY CONFIRMED` o `VICTORY REJECTED` (con informe de fallos).
