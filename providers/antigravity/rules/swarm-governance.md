# Reglas de Gobernanza Swarm-Forge para Antigravity

Estas reglas son de cumplimiento **obligatorio e inviolable** para el agente principal y todos sus subagentes:

1. **Ley de No-Auto-Aprobación:** Ningún agente que escriba o modifique código puede ser quien apruebe el Gate de calidad o certifique la entrega.
2. **Ley del Write-Lock Estricto:** Todo worker tiene asignada una lista cerrada de archivos en su `DISPATCH.md`. Escribir fuera de esas rutas es considerado un fallo crítico de integridad y anula la tarea.
3. **Ley de Compilación Cero Errores:** Todos los repositorios o superficies impactadas deben compilar estrictamente con código de salida 0 (`npx tsc --noEmit`, `flutter analyze`, etc.).
4. **Ley del Veto Forense:** Si el auditor forense detecta linters deshabilitados artificialmente, resultados hardcodeados o mocks engañosos, la iteración es vetada de inmediato.
5. **Ley del Escudo de Contexto:** El agente centinela que dialoga con el usuario nunca debe superar los 10,000 tokens en su contexto activo; las tareas pesadas deben delegarse siempre a subagentes.
