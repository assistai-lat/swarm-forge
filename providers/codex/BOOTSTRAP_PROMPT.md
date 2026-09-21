# Misión para OpenAI Codex / Operator: Implementación del Adaptador Swarm-Forge

> ✅ **Misión cumplida.** El adaptador ya está implementado en [`templates/`](./templates/); ver el [README](./README.md). Este prompt se conserva como registro histórico del desafío original.

Hola agente de OpenAI. Has sido convocado para implementar la suite nativa de **Swarm-Forge** para el entorno **OpenAI Codex / OpenAI Operator / OpenAI CLI**.

## Contexto de la Misión
1. Lee primero la especificación agnóstica universal en:
   - `spec/PROTOCOL.md` (El ciclo de 5 fases: Sentinel ➔ Gate M0 ➔ Workers con Write-Lock ➔ Anillo Adversarial ➔ Victory Auditor)
   - `spec/ROLES.md` (Los 12 roles del enjambre)
   - `spec/TOPOLOGIES.md` y `spec/TOPOLOGY_DRIFT.md`
   - `ROSETTA_STONE.md` (Mapeo de Tiers de Inteligencia y Modelos)
2. Revisa la implementación de referencia dorada creada por Antigravity (AGY) en:
   - `providers/antigravity/`

## Tu Tarea Concreta
Debes crear dentro de `providers/codex/` la implementación nativa y óptima para el ecosistema OpenAI:

1. **`AGENTS.md` o `codex.json` de Gobernanza:**
   - Define el comportamiento del equipo Swarm-Forge dentro de las convenciones de OpenAI.
   - Mapea los Tiers de Inteligencia a tus modelos nativos:
     - Tier 1: **o3-mini** (Reasoning effort: `high`) o **o1** para Arquitectos, Reviewers, Forensic y Victory Auditor.
     - Tier 2: **GPT-4o** (Temperature: `0.1`) para Workers de implementación y Challengers.
     - Tier 3: **GPT-4o-mini** para exploradores, búsqueda y lectura masiva de archivos.
2. **Estructura de Orquestación:**
   - Si utilizas OpenAI Swarm SDK o Function Calling, diseña las rutinas de transferencia (*handoffs*) entre agentes respetando los Write-Locks y el Gate Humano M0.
3. **Actualiza `providers/codex/README.md`:**
   - Documenta cómo un desarrollador en el stack de OpenAI inicializa y opera este enjambre.

¡Demuestra el poder del razonamiento de OpenAI y su precisión en código!
