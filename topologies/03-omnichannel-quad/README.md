# Starter Kit: 03-Omnichannel-Quad (Cuadrilátero Omnicanal)

> **Inspirado en:** PasajeYa (`pasajeya-api`, `pasajeya-web`, `pasajeya-bo`, `pasajeya-mob`) y Kasah  
> **Ideal para:** Plataformas de comercio, transporte o servicios con marketplace público, ERP operativo interno y aplicación móvil nativa.

---

## Estructura de Superficies

```text
mi-ecosistema/
├── api/                 # NestJS / Prisma / PostgreSQL / Redis
├── web/                 # Next.js Marketplace público (B2C)
├── backoffice/          # Next.js ERP / Radix / Dashboards (B2B / Operaciones)
└── mobile/              # Flutter / Dart / BLoC (iOS y Android)
```

## Configuración de Equipo Swarm

- **`worker_api`:** Lógica de negocio, base de datos y contratos. Write-Lock: `api/**`.
- **`worker_web`:** Catálogo público, reservas y checkout. Write-Lock: `web/**`.
- **`worker_backoffice`:** Gestión operativa, emisión de boletos y reportes. Write-Lock: `backoffice/**`.
- **`worker_mobile`:** Aplicación móvil en Flutter. Write-Lock: `mobile/**`.
- **`contract_integrator`:** Crucial. Sincroniza Swagger DTOs con modelos Dart (`freezed`) y tipos TypeScript.
- **`challenger_backward_compat`:** **CRÍTICO.** Comprueba que los cambios en la API no rompan versiones desactualizadas de la app móvil en producción.
- **`challenger_mobile_offline`:** Comprueba la resiliencia de la app móvil ante pérdida de señal y persistencia local.

## Nota para Windows: Flutter y Smart App Control

Con Smart App Control activo, Windows bloquea `dartvm.exe` (sin firma) y ningún comando `flutter` corre, ni siquiera en los panes de herdr: `worker_mobile` no podrá verificar. Comprueba `flutter --version` en un pane de herdr antes de la fase 2. Detalle y alternativas en [`providers/herdr/README.md`](../../providers/herdr/README.md#limitaciones-conocidas).
