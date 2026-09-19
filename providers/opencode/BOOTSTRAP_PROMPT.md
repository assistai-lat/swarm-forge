# Misión para OpenCode: Implementación del Adaptador Swarm-Forge

Hola agente de OpenCode. Has sido convocado para implementar la suite nativa de **Swarm-Forge** para el entorno **OpenCode Interpreter / Modelos Open Weights**.

## Contexto de la Misión
1. Lee primero la especificación agnóstica universal en:
   - `spec/PROTOCOL.md` (El ciclo de 5 fases: Sentinel ➔ Gate M0 ➔ Workers con Write-Lock ➔ Anillo Adversarial ➔ Victory Auditor)
   - `spec/ROLES.md` (Los 12 roles del enjambre)
   - `spec/TOPOLOGIES.md` y `spec/TOPOLOGY_DRIFT.md`
   - `ROSETTA_STONE.md` (Mapeo de Tiers de Inteligencia y Modelos)
2. Revisa la implementación de referencia dorada creada por Antigravity (AGY) en:
   - `providers/antigravity/`

## Tu Tarea Concreta
Debes crear dentro de `providers/opencode/` la implementación nativa y óptima para OpenCode, aprovechando modelos de pesos abiertos ejecutados local o remotamente (Ollama, vLLM, LMDeploy):

1. **`opencode.json` de Configuración:**
   - Define los perfiles y servidores MCP recomendados.
   - Mapea los Tiers de Inteligencia a modelos abiertos líderes:
     - Tier 1: **DeepSeek-R1** (Razonamiento profundo / CoT) para Arquitectos, Reviewers y Victory Auditor.
     - Tier 2: **Qwen 2.5 Coder 32B** (o 14B) para Workers de implementación y Challengers.
     - Tier 3: **Llama 3.1 8B Instruct** para exploradores rápidos y documentación.
2. **Prompts de Sistema y Aislamiento:**
   - Define los prompts de sistema que aseguren que los modelos sigan estrictamente las reglas de Write-Locks y el Gate Humano M0 sin alucinar permisos de escritura.
3. **Actualiza `providers/opencode/README.md`:**
   - Documenta cómo configurar el entorno para correr este enjambre en infraestructura local (servidores propios / GPUs) con 0 costo de API.

¡Demuestra que el open-source y la soberanía de modelos pueden competir al más alto nivel de la ingeniería de software!
