# 🏆 Antigravity (AGY) — Adaptador de Referencia Dorada (*Golden Reference*)

> Este directorio contiene la **implementación oficial de referencia** de Swarm-Forge para **Antigravity (AGY)** de Google DeepMind.  
> Sirve como modelo canónico para que los demás proveedores (Claude Code, OpenAI Codex y OpenCode) implementen sus respectivos adaptadores.

---

## Componentes del Adaptador AGY

1. **`AGENTS.md`:** Manifiesto central de gobernanza con la matriz de 12 roles mapeados a modelos Gemini (**Gemini Pro**, **Gemini Flash**, **Gemini Flash-Lite**) y niveles de esfuerzo de razonamiento (*Thinking: Alto, Medio, Mínimo*).
2. **`skills/swarm-forge/SKILL.md`:** Skill modular reutilizable que puede instalarse en `~/.gemini/antigravity-cli/skills/swarm-forge/` para activar la orquestación Swarm-Forge mediante comandos slash como `/teamwork-preview` o el skill `@swarm-forge`.
3. **`rules/swarm-governance.md`:** Reglas inviolables del sistema (Write-Locks, Gate Humano M0, Prohibición de auto-aprobación y verificación en frío).

---

## Cómo Probar o Instalar en tu Entorno AGY

Para habilitar este skill globalmente en tu máquina local:
```bash
# Copiar el skill a la carpeta de personalizaciones de Antigravity
cp -r providers/antigravity/skills/swarm-forge ~/.gemini/antigravity-cli/skills/
```

Una vez copiado, en cualquier repositorio donde abras `agy`, el motor reconocerá automáticamente los protocolos de Swarm-Forge.

## Modo autónomo

Para operar el enjambre sin diálogos de aprobación en cada comando, lanza AGY con `agy --dangerously-skip-permissions`. Hazlo solo en repositorios confiables y con git limpio; ver [`spec/AUTONOMY.md`](../../spec/AUTONOMY.md).
