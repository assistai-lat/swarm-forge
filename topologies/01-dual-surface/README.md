# Starter Kit: 01-Dual-Surface (Bifronte Clásico)

> **Inspirado en:** Chronus (`chronus-backend` + `chronus-frontend`)  
> **Ideal para:** Aplicaciones web SaaS típicas con una API backend y una aplicación web interactiva (SPA/SSR).

---

## Estructura de Superficies

```text
mi-proyecto/
├── backend/            # Express, NestJS, FastAPI o Go
└── frontend/           # Next.js, React SPA, Vue o Svelte
```

## Configuración de Equipo Swarm

- **`worker_backend`:** Endpoints, servicios, modelos de base de datos y WebSockets. Write-Lock: `backend/**`.
- **`worker_frontend`:** Componentes de interfaz, stores y consumo de API. Write-Lock: `frontend/**`.
- **`challenger_routing`:** Pruebas de rutas, query parameters y links 404.
- **`challenger_realtime`:** Pruebas de eventos en tiempo real, reconexión de sockets y concurrencia.
- **`forensic-auditor` & `victory-auditor`:** Verificación en frío y compilación (`tsc --noEmit` con 0 errores en ambas carpetas).

## Cómo Usar
Copia `topology.json` y `AGENTS.template.md` a la raíz de tu proyecto renombrando este último como `AGENTS.md` (o `CLAUDE.md`).
