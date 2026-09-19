# ⚡ Swarm-Forge

> **Universal Multi-Agent Engineering Protocol & Topology Catalog**  
> *Una arquitectura unificada para orquestar equipos de agentes autónomos con disciplina adversarial, optimización radical de tokens y adaptabilidad a cualquier topología de software.*

---

## 🌟 Visión y Manifiesto

En la era del desarrollo asistido por IA, los agentes autónomos suelen cometer dos errores comunes:
1. **El Enfoque Monolítico:** Un único agente con una ventana de contexto enorme intenta hacer todo: investigar, diseñar, picar código, probar y auto-aprobarse, sufriendo alucinaciones, ceguera por fatiga de contexto y costes desorbitados de tokens.
2. **La Camisa de Fuerza:** Frameworks multi-agente rígidos que obligan a todos los proyectos a tener la misma estructura fija, rompiéndose cuando un proyecto introduce Flutter, microservicios en Python o colas de mensajería.

**Swarm-Forge** nace de la fusión empírica de dos casos de éxito en producción (**Chronus** y **Daido Cloud**) para establecer un **Estándar Universal de Ingeniería Multi-Agente**:

* **Disciplina Adversarial (de Chronus):** Separación estricta de poderes. El que escribe el código nunca es quien lo aprueba. Existen agentes diseñados específicamente para estresar el sistema (*Challengers*) y auditar la victoria en frío (*Victory Auditor*).
* **Eficiencia Radical de Tokens (de Daido Cloud):** Estratificación de inteligencia en 3 Tiers (Deep Reasoning, Fast Precision, Bulk Utility) para recortar más de un 70% del gasto en tokens delegando tareas mecánicas a modelos ultraligeros.
* **Aislamiento de Escritura (*Write-Locks*):** Los workers operan en paralelo sobre archivos disjuntos, eliminando colisiones y conflictos de Git.
* **Un Living Blueprint, NO una Camisa de Fuerza:** Un modelo abierto que instruye al agente adoptante a vigilar la evolución del proyecto y auto-mutar el equipo cuando entran nuevos repos o tecnologías.

---

## 🏛️ Arquitectura del Repositorio

El repositorio está organizado en tres capas desacopladas:

```text
swarm-forge/
├── spec/               # 🌐 ESPECIFICACIÓN PURA (100% Agnóstica a la IA y al Proveedor)
│   ├── PROTOCOL.md     # El ciclo de vida universal en 5 fases
│   ├── ROLES.md        # Definición de los 12 roles del enjambre
│   ├── TOPOLOGIES.md   # Principios de modelado de superficies y repositorios
│   ├── ARTIFACTS.md    # Esquema de DISPATCH.md, BRIEFING.md, handoff.md, etc.
│   └── TOPOLOGY_DRIFT.md # Algoritmo de vigilancia y evolución continua
│
├── ROSETTA_STONE.md    # 🗿 Mapeo universal de modelos, thinking y herramientas (AGY, Claude, Codex, OpenCode)
│
├── topologies/         # 🎯 STARTER KITS DE TOPOLOGÍAS (Listos para copiar a cualquier proyecto)
│   ├── 01-dual-surface/        # Chronus style: Backend API + Web SPA
│   ├── 02-multi-microservice/  # Daido Cloud style: 5 APIs, Python, S3, BullMQ
│   ├── 03-omnichannel-quad/    # PasajeYa / Kasah style: API + Web + Backoffice + Mobile Flutter
│   ├── 04-mobile-first-triad/  # Mobile First: API + Landing Web + App Móvil
│   └── 05-data-ai-pipeline/    # Data Mesh: API + Colas de Workers + LLM / Scraper
│
└── providers/          # 🔌 ADAPTADORES POR PROVEEDOR DE IA
    ├── antigravity/    # 🏆 REFERENCIA DE ORO: Implementación completa para Antigravity (AGY)
    ├── claude-code/    # 🏗️ Cascarón + Prompt de desafío para Claude Code
    ├── codex/          # 🏗️ Cascarón + Prompt de desafío para OpenAI Codex / Operator
    └── opencode/       # 🏗️ Cascarón + Prompt de desafío para OpenCode (Modelos abiertos)
```

---

## 🚀 El Ciclo de Vida Universal Swarm-Forge (5 Fases)

```mermaid
flowchart TD
    User([👤 Desarrollador Humano]) <--> Sentinel["🛡️ Sentinel (Context Shield < 10k tokens)\nInterfaz humana & guardián de ciclo"]
    
    subgraph F0 ["Fase 0: Exploración 360° Concurrente"]
        Sentinel --> Orch1["📋 Orchestrator 1 (Tier 1: Deep Reasoning)"]
        Orch1 --> E1["🔍 Explorer Backend (Tier 3)"]
        Orch1 --> E2["🔍 Explorer Frontend/App (Tier 3)"]
        Orch1 --> E3["🔍 Explorer Contratos (Tier 3)"]
        E1 & E2 & E3 --> Analysis["📄 ANALYSIS_REPORT.md & PROJECT.md"]
    end
    
    Analysis --> GateM0{"🛑 GATE HUMANO M0\n¿Usuario aprueba diagnóstico y plan?"}
    GateM0 -- Rechazado / Ajustes --> Reajuste["Reajustar propuesta con el usuario"] --> GateM0
    
    subgraph F2 ["Fase 2: Implementación Desacoplada"]
        GateM0 -- Aprobado --> Orch2["📋 Orchestrator 2 (Tier 1)"]
        Orch2 --> W1["🛠️ Worker Repo A (Tier 2)\nWrite-Lock: repo-a/**"]
        Orch2 --> W2["🛠️ Worker Repo B (Tier 2)\nWrite-Lock: repo-b/**"]
    end
    
    subgraph F3 ["Fase 3: Anillo Adversarial Dual"]
        W1 & W2 --> Rev["🔬 Stack & Security Reviewers (Tier 1/2)"]
        W1 & W2 --> Chall["⚡ Adversarial Challengers (Tier 2)\n(Fuzzing, Concurrencia, Retrocompatibilidad Móvil)"]
        W1 & W2 --> Forens["⚖️ Forensic Auditor (Tier 1)\n(0 Mocks / Diff Limpio / Anti-Cheat)"]
    end
    
    subgraph F4 ["Fase 4: Certificación de Victoria"]
        Rev & Chall & Forens --> SentinelCheck["Sentinel convoca auditor en frío"]
        SentinelCheck --> VA["🏆 Victory Auditor (Tier 1)\n(Contexto Limpio, 0 Errores de Build & Tests E2E)"]
        VA -- "VICTORY CONFIRMED" --> Delivery["🚀 Entrega Verificada al Usuario"]
    end
```

---

## 💡 Principio Rector: "Living Blueprint, NO una Camisa de Fuerza"

Cuando un agente de IA adopta **Swarm-Forge** en un repositorio nuevo:

1. **NO asume una plantilla fija ciega.** Lee [`spec/TOPOLOGY_DRIFT.md`](./spec/TOPOLOGY_DRIFT.md) y ejecuta un escaneo de la verdad del código en disco.
2. **Selecciona el Starter Kit más cercano** del catálogo de [`topologies/`](./topologies/) y **lo customiza**.
3. **Mantiene vigilancia activa:**
   - Si el proyecto suma una app en Flutter, el agente incorpora al `Worker Mobile` y al crucial `Challenger Backward-Compatibility`.
   - Si se añade un microservicio en Python, incorpora linters de Python y el respectivo worker políglota.
   - Si una tarea es menor, apaga los roles innecesarios para no malgastar recursos.

---

## 🗿 Mapeo Multi-Proveedor (Rosetta Stone)

Swarm-Forge no favorece a un proveedor cerrado. Define **Tiers Abstractos de Inteligencia**:

| Tier Abstracto | Rol en el Swarm | Antigravity (AGY) | Claude Code | OpenAI / Codex | OpenCode (Open Weights) |
|---|---|---|---|---|---|
| **Tier 1 (Deep Reasoning)** | Orchestrator, Forensic, Victory Auditor | **Gemini Pro** (High Thinking) | **Claude 3.7 Sonnet** (Thinking: 16k) | **o3-mini** (High) / **o1** | **DeepSeek-R1** |
| **Tier 2 (Fast Precision)** | Workers, Challengers, Code Reviewers | **Gemini Flash** (Med Thinking) | **Claude 3.7 Sonnet** (Standard) | **GPT-4o** | **Qwen 2.5 Coder 32B** |
| **Tier 3 (Bulk Utility)** | Explorers, Búsqueda, Documentación | **Gemini Flash-Lite** (Min Thinking) | **Claude 3.5 Haiku** | **GPT-4o-mini** | **Llama 3.1 8B** |

Revisa la tabla completa y parámetros en [`ROSETTA_STONE.md`](./ROSETTA_STONE.md).

---

## 🛠️ Cómo Adoptar Swarm-Forge en tu Proyecto

### Paso 1: Identifica tu Topología
Revisa las carpetas en [`topologies/`](./topologies/):
- ¿Solo backend y frontend web? Usa [`01-dual-surface`](./topologies/01-dual-surface/).
- ¿Múltiples APIs y microservicios? Usa [`02-multi-microservice`](./topologies/02-multi-microservice/).
- ¿API, web pública, backoffice y app móvil? Usa [`03-omnichannel-quad`](./topologies/03-omnichannel-quad/).

### Paso 2: Copia el Manifiesto Base
Copia el archivo `AGENTS.template.md` (o equivalente de tu proveedor) a la raíz de tu proyecto como `AGENTS.md` (para AGY/Codex) o `CLAUDE.md` (para Claude Code).

### Paso 3: Adapta los Write-Locks y Comandos de Build
Ajusta las rutas relativas de tus carpetas y los comandos de compilación estricta (`tsc --noEmit`, `flutter analyze`, `pytest`, `cargo test`).

---

## 🤝 Contribuciones y Ecosistema

Este repositorio es una iniciativa abierta. Los adaptadores para cada proveedor se desarrollan desafiando a sus respectivas IAs utilizando los `BOOTSTRAP_PROMPT.md` en [`providers/`](./providers/).
