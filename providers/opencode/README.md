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

---

## ⚠️ Requisito Crítico: Modelos VLM (Visión Multimodal)

A diferencia de las nubes comerciales que integran visión por defecto en casi todos sus modelos, en entornos de código abierto los modelos más conocidos de programación y razonamiento (DeepSeek-R1, Qwen 2.5 Coder) son **100% texto**.

Bajo el estándar Swarm-Forge:
- **El Sentinel (interfaz con el usuario):** **DEBE ser multimodal**. Debe configurarse con un modelo Vision-Language (VLM) como **Qwen 2.5 VL (7B / 72B)** o **Llama 3.2 11B Vision** para poder procesar capturas de pantalla, errores gráficos de interfaz y diagramas enviados por el usuario.
- **Workers de Frontend / UI:** Deben disponer de capacidades VLM para contrastar capturas de bugs y maquetas visuales.
- **Backend, DB y Auditorías Lógicas:** Deben aprovechar la potencia de texto puro de **DeepSeek-R1** y **Qwen 2.5 Coder 32B**.
