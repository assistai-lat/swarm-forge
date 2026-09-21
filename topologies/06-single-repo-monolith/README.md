# Starter Kit: 06-Single-Repo-Monolith (Monolito Next.js en un solo repo)

> **Inspirado en:** funycheck (Next.js 14 App Router + MongoDB/Mongoose, adopción real con OpenCode)  
> **Ideal para:** Proyectos Next.js (o similares: Nuxt, SvelteKit, Remix) donde la API, los modelos y la UI conviven en **un solo repositorio y un solo `package.json`**.

A diferencia de [`01-dual-surface`](../01-dual-surface/), aquí no hay carpetas `backend/` y `frontend/` separadas: las dos superficies se reparten **subcarpetas del mismo repo**. Por eso los Write-Locks usan `paths` y `exclude` (ver [`spec/TOPOLOGIES.md`](../../spec/TOPOLOGIES.md#superficies-que-comparten-repositorio-paths--exclude)).

---

## Estructura de Superficies

```text
mi-proyecto/
├── src/
│   ├── app/
│   │   ├── api/**          → worker_backend   (route handlers)
│   │   ├── layout.tsx      → worker_frontend  (compartido: se asigna a la UI)
│   │   └── (rutas)/**      → worker_frontend  (páginas)
│   ├── models/**           → worker_backend   (Mongoose / Prisma / Drizzle)
│   ├── lib/**              → worker_backend   (código de servidor: auth, db, mailer)
│   ├── types/**            → worker_backend   (contrato compartido API ↔ UI)
│   ├── middleware.ts       → worker_backend
│   ├── components/**       → worker_frontend
│   ├── contexts/**, hooks/**, styles/**, utils/** → worker_frontend
├── public/**               → worker_frontend
├── scripts/**              → worker_backend   (migraciones, seeds)
└── package.json, Dockerfile, next.config.* → devops (solo si el DISPATCH lo asigna)
```

## Reglas de desempate

Un monolito tiene archivos ambiguos. Estas reglas salieron de la adopción real y evitan que dos workers reclamen el mismo archivo:

1. **`src/lib/**` es del servidor y `src/utils/**` es del cliente.** Si tu proyecto mezcla ambos, sepáralos antes de adoptar o declara la carpeta en una sola superficie.
2. **`src/app/layout.tsx` y las páginas son de la UI**, aunque vivan junto a `src/app/api/**`. El `exclude` garantiza que el frontend nunca toque la API.
3. **Los tipos compartidos (`src/types/**`) son del backend.** El frontend los consume; si necesita un campo nuevo, lo pide en su `handoff.md`. El `contract-integrator` verifica la coherencia.
4. **Los archivos de raíz** (`package.json`, `next.config.*`, `Dockerfile`, `.env.example`) no pertenecen a ninguna superficie: solo los toca quien el orchestrator designe en el `DISPATCH.md` (normalmente `devops`).
5. **Los tests** (`**/*.test.*`, `**/__tests__/**`) los escriben los challengers; los workers solo corren los existentes.

## Configuración de Equipo Swarm

- **`worker_backend`:** Route handlers, modelos, lógica de servidor, middleware y scripts.
- **`worker_frontend`:** Páginas, componentes y estado de cliente. **Requiere visión** (capturas y maquetas).
- **`challenger_routing`:** IDs inválidos (p. ej. ObjectIds mal formados → deben dar 400/404, no 500), params nulos o duplicados, métodos HTTP inesperados en los route handlers.
- **`challenger_auth_flows`:** Tokens de reset y verificación expirados, reusados o manipulados; enumeración de usuarios; carreras entre verificación y login.
- **`challenger_double_submit`:** Doble envío de formularios, operaciones que deberían ser idempotentes, requests concurrentes.
- **`challenger_hostile_uploads`:** Archivos gigantes, MIME falsificado, nombres hostiles, path traversal.
- **`forensic-auditor` & `victory-auditor`:** `pnpm lint`, `npx tsc --noEmit` y la suite de tests con 0 errores.

## Cómo Usar

- **Modo A (un solo CLI):** copia `AGENTS.template.md` a tu proyecto (como `AGENTS.md`, `CLAUDE.md` o `.opencode/AGENTS.md`, según tu CLI). En OpenCode, los Write-Locks de este kit se traducen 1:1 a `permission.edit` (ver [`providers/opencode/`](../../providers/opencode/)).
- **Modo B (varios CLIs):** copia `topology.json` y genera tu roster con `tools/recommend-roster.mjs`.

Ajusta los globs a tu estructura real antes de usarlo: si tu proyecto no tiene `src/`, quita ese prefijo.
