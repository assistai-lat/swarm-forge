# Starter Kit: 04-Mobile-First-Triad (Tríada Móvil)

> **Ideal para:** Startups o productos B2C donde la aplicación móvil es el canal principal de valor, y la web es únicamente una landing page, portal de autenticación o blog.

---

## Estructura de Superficies

```text
mi-app/
├── api/                 # NestJS, Express o Go
├── web-landing/         # Next.js, Astro o HTML estático
└── mobile-app/          # Flutter, React Native o Capacitor
```

## Configuración de Equipo Swarm

- **`worker_api`:** Backend, autenticación móvil (JWT/OAuth), push tokens (FCM/APNS). Write-Lock: `api/**`.
- **`worker_web`:** Landing page, términos y soporte. Write-Lock: `web-landing/**`.
- **`worker_mobile`:** Flujos nativos, almacenamiento seguro (KeyStore/Keychain) y pantallas. Write-Lock: `mobile-app/**`.
- **`challenger_push_notifications`:** Prueba la recepción y deserialización de notificaciones push en background y foreground.
- **`challenger_backward_compat`:** Comprueba la compatibilidad con versiones anteriores de la app.

## Nota para Windows: Flutter y Smart App Control

Con Smart App Control activo, Windows bloquea `dartvm.exe` (sin firma) y ningún comando `flutter` corre, ni siquiera en los panes de herdr: `worker_mobile` no podrá verificar. Comprueba `flutter --version` en un pane de herdr antes de la fase 2. Detalle y alternativas en [`providers/herdr/README.md`](../../providers/herdr/README.md#limitaciones-conocidas).
