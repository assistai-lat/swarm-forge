# 🏗️ Claude Code (Anthropic) — Adaptador Swarm-Forge

> **Estado:** Cascarón preparado para desafío y generación autónoma.

Este directorio está reservado para la implementación nativa del estándar Swarm-Forge adaptado a la arquitectura de **Claude Code** (Anthropic).

---

## Cómo Ejecutar el Desafío

Cuando inicies una sesión con **Claude Code** en este repositorio, indícale la siguiente instrucción:

```text
Claude, lee el archivo providers/claude-code/BOOTSTRAP_PROMPT.md y ejecuta tu misión para implementar el adaptador nativo de Swarm-Forge para Claude Code.
```

Claude Code leerá la especificación universal en `/spec`, estudiará el adaptador de referencia dorada de Antigravity en `/providers/antigravity`, y generará los archivos nativos correspondientes (`CLAUDE.md`, `.claude/settings.json`, prompts de thinking tokens y comandos slash).

## Modo autónomo

Para operar el enjambre sin diálogos de aprobación en cada comando, lanza Claude Code con `claude --permission-mode auto` (o `"permissions": { "defaultMode": "auto" }` en `settings.json`). `--dangerously-skip-permissions` desactiva todos los controles: resérvalo para sandboxes. Ver [`spec/AUTONOMY.md`](../../spec/AUTONOMY.md).
