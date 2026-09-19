# Starter Kit: 02-Multi-Microservice (Malla de Microservicios Cloud)

> **Inspirado en:** Daido Cloud (`daido-cloud-api`, `daido-cloud-web`, `daido-multimedia-api`, `daido-scrapper-api`, `mailer-backend`)  
> **Ideal para:** Plataformas cloud compuestas por microservicios desacoplados, políglotas (TypeScript/Python) y orientadas a eventos.

---

## Estructura de Superficies

```text
mi-plataforma/
├── api-core/            # NestJS / Prisma / PostgreSQL
├── web/                 # Next.js 16 App Router
├── multimedia-api/      # NestJS / S3 Presigned URLs
├── scraper-api/         # Python 3.12 / FastAPI / SQLAlchemy / Alembic
└── mailer-backend/      # NestJS / BullMQ / SMTP
```

## Configuración de Equipo Swarm

- **`worker_core`:** API principal y autenticación. Write-Lock: `api-core/**`.
- **`worker_web`:** Interfaz unificada de usuario. Write-Lock: `web/**`.
- **`worker_multimedia`:** Gestión de almacenamiento y cuotas. Write-Lock: `multimedia-api/**`.
- **`worker_scraper`:** Extracción web y LLM. Write-Lock: `scraper-api/**`.
- **`worker_mailer`:** Colas de envío transaccional. Write-Lock: `mailer-backend/**`.
- **`contract_integrator`:** Garantiza que los DTOs de todas las APIs coincidan con el cliente web (`lib/api.ts`).
- **`dba`:** Gestiona esquemas en Prisma y migraciones en Alembic sin conflictos.
- **`devops`:** Mantiene Dockerfiles, Coolify y configuraciones de pnpm workspaces.
