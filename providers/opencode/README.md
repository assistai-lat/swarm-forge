# 🏗️ OpenCode Interpreter — Adaptador Swarm-Forge

> **Estado:** Cascarón preparado para desafío y generación autónoma.

Este directorio está reservado para la implementación nativa del estándar Swarm-Forge adaptado a **OpenCode Interpreter** y entornos de ejecución basados en **modelos de código abierto (Open Weights)** como DeepSeek-R1, Qwen 2.5 Coder y Llama 3.

---

## Cómo Ejecutar el Desafío

Cuando inicies una sesión con **OpenCode** en este repositorio, indícale la siguiente instrucción:

```text
Lee el archivo providers/opencode/BOOTSTRAP_PROMPT.md y ejecuta tu misión para implementar el adaptador nativo de Swarm-Forge para OpenCode Interpreter.
```

OpenCode leerá la especificación universal en `/spec`, estudiará el adaptador de referencia dorada de Antigravity en `/providers/antigravity`, y generará los archivos nativos correspondientes (`opencode.json`, configuración de endpoints Ollama/vLLM y perfiles de sistema para modelos abiertos).
