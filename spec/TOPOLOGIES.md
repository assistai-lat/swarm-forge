# 🗺️ Especificación Universal: Modelado de Topologías y Superficies

Este documento explica cómo Swarm-Forge modela arquitecturas de software reales —desde monolitos web simples hasta ecosistemas omnicanal con múltiples repositorios— y cómo se asignan los equipos dinámicamente.

---

## 1. El Concepto de "Superficie de Ejecución" (*Execution Surface*)

En Swarm-Forge, un proyecto no se define por un "backend y un frontend" genéricos, sino por un conjunto discreto de **Superficies de Ejecución**:

Una **Superficie** es una unidad de software con:
1. **Un repositorio o directorio raíz independiente.**
2. **Un stack tecnológico y lenguaje específico.**
3. **Un comando de verificación estricta propio** (`tsc`, `flutter analyze`, `pytest`, `cargo test`).
4. **Una frontera de archivos delimitada** (para aplicar Write-Locks).

```mermaid
flowchart LR
    subgraph Ecosystem ["Ecosistema del Proyecto (ej. PasajeYa)"]
        S1["Superficie API\n• NestJS / Prisma\n• tsc --noEmit"]
        S2["Superficie Web Pública\n• Next.js 16 App Router\n• next build"]
        S3["Superficie Backoffice\n• Next.js ERP / Radix\n• tsc --noEmit"]
        S4["Superficie Mobile\n• Flutter 3.24 / Dart\n• flutter analyze"]
    end
```

---

## 2. El Manifiesto de Topología (`topology.json`)

Cada proyecto que adopta Swarm-Forge define en su raíz un archivo `topology.json` (o la sección equivalente en `AGENTS.md` / `CLAUDE.md`).

### Esquema Estándar:

```json
{
  "$schema": "https://swarm-forge.org/schemas/topology.v1.json",
  "name": "NombreDelEcosistema",
  "version": "1.0.0",
  "surfaces": {
    "api": {
      "path": "servicios/api-core",
      "stack": "node-nestjs-prisma",
      "language": "typescript",
      "verifyCommand": "pnpm --filter api-core run build",
      "workerRole": "worker_backend"
    },
    "web": {
      "path": "apps/portal-web",
      "stack": "nextjs-tailwind",
      "language": "typescript",
      "verifyCommand": "pnpm --filter portal-web run build",
      "workerRole": "worker_frontend"
    },
    "mobile": {
      "path": "apps/mobile-flutter",
      "stack": "flutter-bloc",
      "language": "dart",
      "verifyCommand": "flutter analyze",
      "workerRole": "worker_mobile"
    }
  },
  "sharedContracts": [
    {
      "source": "api",
      "destinations": ["web", "mobile"],
      "contractPath": "packages/api-contracts"
    }
  ],
  "requiredChallengers": [
    "challenger_routing",
    "challenger_backward_compat"
  ]
}
```

### Superficies que comparten repositorio (`paths` + `exclude`)

Cuando dos superficies viven **dentro del mismo repositorio** (p. ej. un monolito Next.js donde la API vive en `src/app/api/**` y la UI en el resto de `src/app/**`), una sola `path` no alcanza. En ese caso la superficie declara su frontera con globs:

```json
"frontend": {
  "paths": ["src/app/**", "src/components/**", "public/**"],
  "exclude": ["src/app/api/**"],
  "stack": "nextjs-app-router-tailwind",
  "language": "typescript",
  "verifyCommand": "pnpm lint && npx tsc --noEmit",
  "workerRole": "worker_frontend"
}
```

| Campo | Significado |
|---|---|
| `path` | Forma corta: equivale a `paths: ["<path>/**"]`. Sigue siendo válida. |
| `paths` | Globs que el worker **puede** escribir. |
| `exclude` | Globs que el worker **no puede** escribir aunque coincidan con `paths`. Siempre ganan sobre `paths`. |

**Regla de disjunción:** una vez aplicados los `exclude`, ningún archivo puede quedar dentro de la frontera de dos workers. Los archivos que no pertenecen a ninguna superficie (p. ej. `package.json`) solo se tocan si el orchestrator los asigna explícitamente en el `DISPATCH.md` (normalmente a `devops`).

### Superficies en repositorios independientes (`repo`)

Un ecosistema puede vivir en varios repositorios git **sin una raíz común versionada** (p. ej. `crm/crm-backend/` y `crm/crm-frontend/`, cada uno con su propio `.git`, bajo una carpeta `crm/` que no lo es). Cada superficie declara entonces de qué repo es:

```json
"backend": {
  "repo": "crm-backend",
  "path": "crm-backend",
  "stack": "node-express-prisma",
  "language": "typescript",
  "verifyCommand": "npx prisma generate && pnpm test",
  "workerRole": "worker_backend"
}
```

| Campo | Significado |
|---|---|
| `repo` | Carpeta, relativa a la raíz de la topología, que es **su propio repositorio git**. Si se omite, la superficie vive en el repo de la raíz (comportamiento de siempre; retrocompatible). |

Efectos de declarar `repo`:
- **[`tools/check-write-locks.mjs`](../tools/check-write-locks.mjs)** lista los cambios con `git -C <raíz>/<repo>` en vez de asumir que la raíz es el repo, y antepone `<repo>/` a cada ruta antes de compararla con `paths`/`exclude` (que siguen siendo relativos a la raíz de la topología, como en cualquier otra superficie). Ejecútalo desde la raíz de la topología o pásale `--root <raíz>`. Si el worker trabaja en un worktree (`swarm-up --worktree`), herdr lo crea **fuera** del clon (`~/.herdr/worktrees/...`): por eso, cuando existe la rama `swarm/<agente>`, se revisa esa rama contra la `baseBranch` de la superficie (o `--base`) más lo no commiteado de su worktree, en vez del directorio del clon.
- **[`providers/herdr/swarm-up.mjs`](../providers/herdr/swarm-up.mjs)** abre la pestaña del worker en `<raíz>/<repo>`, y con `--worktree` crea el worktree desde ese repo (con `--base <ref>` parte de esa rama, p. ej. `origin/main`). El worker queda en un checkout aislado de **ese** repo: el Write-Lock pasa a ser físico por partida doble (no puede escribir en el otro repo porque ni siquiera está en su checkout). Si un writer sin `repo` pide worktree y la raíz no es un repo git, el lanzador lo rechaza antes de crear nada.
- **`verifyCommand` se ejecuta desde la raíz de su repo**, no desde la raíz de la topología: escribe `pnpm test`, no `pnpm --filter backend test`. El brief del worker se lo indica, junto con su Write-Lock ya expresado en rutas relativas a su repo.
- Si **ninguna** superficie declara `repo`, nada cambia: es el mismo comportamiento mono-repo de siempre.

#### Worktrees por superficie (`baseBranch`, `copyEnv`)

| Campo | Significado |
|---|---|
| `baseBranch` | Rama de la que parte el worktree de esa superficie (p. ej. `develop` en tres repos y `dev` en otro). Gana sobre `--base`, que queda como valor por defecto para las superficies que no la declaran. |
| `copyEnv` | `true` para copiar al worktree los `.env*` de la raíz del repo que le falten. No están versionados, así que sin esto el worktree nace sin ellos y el build o los tests fallan. `swarm-up` imprime los nombres copiados, nunca su contenido. Es opt-in: úsalo solo si esos `.env` no tienen secretos que el agente no deba ver (ver [`AUTONOMY.md`](AUTONOMY.md), salvaguarda 5). |

**Dependencias:** cada worktree instala las suyas (`pnpm install --frozen-lockfile --prefer-offline`: con el store de pnpm es rápido). **No enlaces el `node_modules` del clon** (`mklink /J`, symlink): `prisma generate` escribe el cliente en `node_modules/.prisma`, y un cambio de schema en un worktree pisaría el cliente de Prisma de las demás sesiones. El brief de cada writer con worktree se lo recuerda.

### Verificación independiente de la shell (`env` + `steps`)

En Windows, los agentes de AGY y OpenCode ejecutan comandos en PowerShell y los de Claude Code en Git Bash. Un `verifyCommand` como `TZ=UTC NODE_ENV=development pnpm test` funciona en bash y falla en PowerShell: el mismo gate da resultados distintos según quién lo corra, y un juez no puede reproducir lo que verificó un worker. Para eso, la superficie declara el entorno y los pasos por separado:

```json
"api": {
  "repo": "kasah-api",
  "path": "kasah-api",
  "env": { "TZ": "UTC", "NODE_ENV": "development" },
  "steps": ["npx prisma generate", "pnpm run typecheck", "pnpm run build", "pnpm run test:cov:ci"],
  "workerRole": "worker_api"
}
```

- **[`tools/verify.mjs`](../tools/verify.mjs)** los ejecuta en orden con ese `env`, siempre con la shell del sistema (cmd en Windows, sh en el resto) y no con la del agente, y se detiene en el primer paso que falla: `node tools/verify.mjs --topology topology.json --surface api`, desde la raíz del repo o del worktree.
- Si la superficie declara `env` o `steps`, `recommend-roster.mjs` pone ese comando (con rutas absolutas) como `verifyCommand` del agente en `roster.json`, así que el brief ya le pide al worker el gate neutral.
- Sin `env` ni `steps`, `verifyCommand` sigue funcionando como siempre. `steps` reemplaza a los comandos encadenados con `&&`, como `npx prisma generate && pnpm build`.
- Los roles de `infraRoles` declarados como objeto aceptan los mismos campos.

### Roles de infraestructura (`infraRoles`)

Los roles `dba` y `devops` ([`ROLES.md`](ROLES.md) #11-12) no pertenecen a una superficie: la topología los pide explícitamente y el recomendador los asigna en la fase 2, como writers.

```json
"infraRoles": [
  "devops",
  {
    "role": "dba",
    "repo": "crm-backend",
    "paths": ["crm-backend/prisma/**"],
    "verifyCommand": "npx prisma validate"
  }
]
```

- **Forma corta** (`"devops"`): el rol no tiene Write-Lock propio; cada `DISPATCH.md` le asigna qué archivos puede tocar (típicamente los huérfanos: `package.json`, `Dockerfile`, CI). `check-write-locks --role devops` no puede verificarlo y lo dice.
- **Forma objeto**: acepta los mismos campos que una superficie (`repo`, `path`/`paths`, `exclude`, `verifyCommand`, `env`/`steps`, `baseBranch`, `copyEnv`). Su frontera entra en la **regla de disjunción**: si el `dba` es dueño de `crm-backend/prisma/**`, la superficie backend debe excluirlo (`"exclude": ["crm-backend/prisma/**"]`).
- **Polyrepo + `--worktree`:** un rol de infraestructura sin `repo` se lanzaría en la raíz, que no es un repo git; declárale `repo` o lánzalo sin `--worktree` (`--roles devops`).
- Cuándo pedirlos: `dba` si el proyecto tiene migraciones o esquema (`prisma/`, `alembic/`, `migrations/`); `devops` si hay `Dockerfile`, CI o despliegue (Coolify, compose) que vayan a cambiar.

---

## 3. Principio de Despacho Topológico (*Topology-Aware Dispatch*)

Cuando el `Orchestrator` recibe un requerimiento:
1. **Evalúa qué superficies están impactadas:**
   - Si la tarea solo toca el formulario de perfil web, **solo despacha a `worker_frontend`**.
   - Si la tarea cambia la autenticación y afecta la API y la app móvil, **despacha en paralelo a `worker_backend` y `worker_mobile`**, activando además al `contract-integrator` y al `challenger_backward_compat`.
2. **Cero Desperdicio de Tokens:**
   - Las superficies no involucradas permanecen dormidas. No se crean agentes pasivos que consuman ventana de contexto.

---

## 4. El Catálogo de Topologías de Referencia

Swarm-Forge incluye 6 plantillas pre-construidas en el directorio `topologies/`:

| Plantilla | Estructura | Repositorios Típicos | Caso de Uso |
|---|---|---|---|
| **`01-dual-surface`** | 2 Superficies | `backend`, `frontend` | SaaS web estándar (estilo Chronus). |
| **`02-multi-microservice`** | 4-6 Superficies | `api`, `web`, `multimedia`, `scrapper` (Python), `mailer` | Plataformas cloud desacopladas (estilo Daido Cloud). |
| **`03-omnichannel-quad`** | 4 Superficies | `api`, `web-portal`, `backoffice-erp`, `mobile-app` | Marketplaces, venta de pasajes o ERP con apps (estilo PasajeYa / Kasah). |
| **`04-mobile-first-triad`** | 3 Superficies | `api`, `landing-web`, `mobile-app` | Apps B2C centradas en dispositivos móviles. |
| **`05-data-ai-pipeline`** | 3 Superficies | `api-gateway`, `task-workers`, `ai-service` (LLM/Python) | Procesamiento masivo de datos, colas y pipelines de IA. |
| **`06-single-repo-monolith`** | 2 Superficies en 1 repo | `src/app/api/**` + resto de `src/` (con `paths` / `exclude`) | Monolitos Next.js App Router (estilo funycheck). |
