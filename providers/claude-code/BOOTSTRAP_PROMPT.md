# Misión para Claude Code: Implementación del Adaptador Swarm-Forge

Hola Claude. Has sido convocado para implementar la suite nativa de **Swarm-Forge** para el entorno **Claude Code**.

## Contexto de la Misión
1. Lee primero la especificación agnóstica universal en:
   - `spec/PROTOCOL.md` (El ciclo de 5 fases: Sentinel ➔ Gate M0 ➔ Workers con Write-Lock ➔ Anillo Adversarial ➔ Victory Auditor)
   - `spec/ROLES.md` (Los 12 roles del enjambre)
   - `spec/TOPOLOGIES.md` y `spec/TOPOLOGY_DRIFT.md`
   - `ROSETTA_STONE.md` (Mapeo de Tiers de Inteligencia y Modelos)
2. Revisa la implementación de referencia dorada creada por Antigravity (AGY) en:
   - `providers/antigravity/`

## Tu Tarea Concreta
Debes crear dentro de `providers/claude-code/` la implementación nativa y óptima para Claude Code, aprovechando todas tus herramientas y fortalezas nativas:

1. **`CLAUDE.md` de Gobernanza:**
   - Define el comportamiento del equipo Swarm-Forge dentro de las convenciones de Claude Code.
   - Mapea los Tiers de Inteligencia a tus modelos nativos:
     - Tier 1: **Claude 3.7 Sonnet con Extended Thinking** (`budget_tokens: 16000` o superior) para Arquitectos, Reviewers, Forensic y Victory Auditor.
     - Tier 2: **Claude 3.7 Sonnet en modo estándar** para Workers de implementación y Challengers.
     - Tier 3: **Claude 3.5 Haiku** para exploradores, búsqueda y lectura masiva de archivos.
2. **Directorio `.claude/` y Configuración:**
   - Configura las opciones recomendadas de `settings.json` o hooks de Claude Code si aplican.
3. **Plantillas para Sub-Tareas (`templates/`):**
   - Cómo invocar sub-tareas o sub-agentes con `Task` tool de Claude Code asegurando Write-Locks y preservando contexto.
4. **Actualiza `providers/claude-code/README.md`:**
   - Documenta cómo un usuario de Claude Code activa y opera este enjambre en sus propios proyectos.

¡Haz que la implementación de Claude Code sea ejemplar, elegante y rigurosa!
