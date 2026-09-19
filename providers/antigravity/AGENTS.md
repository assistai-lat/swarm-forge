# Swarm-Forge: Matriz de Gobernanza para Antigravity (AGY)

Este documento rige la topología de subagentes en entornos Antigravity. AGY y sus subagentes deben consultar y respetar esta matriz al planificar, ejecutar y certificar cualquier tarea.

---

## 1. Matriz de Roles y Modelos Gemini

| # | Rol | Identificador | Modelo Gemini | Nivel de Thinking | Herramientas | Responsabilidad Principal |
|---|:---|:---|:---|:---|:---|:---|
| 1 | **Sentinel** | `sentinel` | **Gemini Flash-Lite** | Mínimo | Mensajería (`send_message`) | Mantiene el contexto del usuario ultra-ligero (<10k). Convoca al Victory Auditor. |
| 2 | **Orquestador** | `orchestrator` | **Gemini Pro** | Alto | Coordinación (`subagents`, `manage_task`) | Descompone tareas, emite `DISPATCH.md` con Write-Locks y evalúa compuertas. |
| 3 | **Arquitecto / Plan** | `architect` | **Gemini Pro** | Alto | Solo Lectura | Diseña la arquitectura global y contratos de interfaces sin tocar código. |
| 4 | **Explorador** | `explorer` | **Gemini Flash-Lite** | Mínimo / Cero | Solo Lectura | Mapeo rápido de repositorios, lectura masiva de archivos a costo casi nulo. |
| 5 | **Domain Workers** | `worker_<superficie>` | **Gemini Flash** | Medio | Lectura, Escritura y Shell | Implementación de lógica, componentes y controladores con Write-Lock estricto. |
| 6 | **Code Reviewer** | `code-reviewer` | **Gemini Pro** | Alto (Adversarial) | Solo Lectura | Revisa diffs buscando malas prácticas, regresiones y deuda técnica. |
| 7 | **Security Auditor** | `security-auditor` | **Gemini Pro** | Alto (Crítico) | Solo Lectura | Audita autenticación JWT, IDOR, inyecciones y fugas de datos multi-inquilino. |
| 8 | **Challengers** | `challenger_<vector>` | **Gemini Flash** | Medio | Comandos y Tests | Ataca el sistema con fuzzing de rutas, estrés de WebSockets y retrocompatibilidad. |
| 9 | **Contract Integrator**| `contract-integrator`| **Gemini Pro** | Alto | Solo Lectura de Contratos | Alineación estricta entre APIs backend, llamadas cliente y modelos Dart/móviles. |
| 10 | **Forensic Auditor** | `forensic-auditor` | **Gemini Pro** | Alto (Inviolable) | Git Diff y Logs | Inspecciona el diff completo. Veta de inmediato si detecta mocks o salidas falsas. |
| 11 | **Victory Auditor** | `victory-auditor` | **Gemini Pro** | Alto | Tests & Verificación E2E | Subagente en hilo fresco que certifica el 100% de los criterios antes del cierre. |
| 12 | **DevOps & Infra** | `devops` | **Gemini Flash** | Medio | Docker, Builds y Configs | Mantiene Dockerfiles, pnpm-workspaces y despliegues Coolify. |

---

## 2. Protocolo de Ejecución de 5 Fases

1. **Fase 0 (Exploración Concurrente):** El `orchestrator` despacha a 3 `explorers` concurrentes en Flash-Lite para mapear backend, frontend y contratos sin tocar código. Generan `ANALYSIS_REPORT.md`.
2. **Fase 1 (Gate Humano M0):** La sesión se detiene. El usuario revisa y aprueba explícitamente el diagnóstico y alcance.
3. **Fase 2 (Implementación con Write-Locks):** Se despacha a los `Domain Workers` asignados. Cada worker opera únicamente dentro de su frontera autorizada en `DISPATCH.md`.
4. **Fase 3 (Anillo Adversarial Dual):** Los Reviewers, Challengers y el Forensic Auditor evalúan la solución. Se genera `GATE_STATUS.md`.
5. **Fase 4 (Certificación de Victoria):** El `sentinel` convoca a un `victory-auditor` con contexto fresco. Al obtener `VICTORY CONFIRMED`, se entrega al usuario y se comitea.
