## Why

Las corridas pueden requerir infraestructura auxiliar (p. ej. Selenium Grid/Docker) y el backend ya ofrece control y observabilidad de Docker, pero la vista **Docker** es un placeholder; la UI debe permitir operar y monitorear este entorno.

## What Changes

- Mostrar diagnóstico y estado de Docker (`/docker/check`, `/docker/status`, `/docker/containers`) y permitir iniciar Docker Desktop cuando aplique (`/docker/start-desktop`).
- Ejecutar acciones y detener procesos/proyectos (`/docker/run`, `/docker/stop`) y exponer acceso al reporte asociado (`/docker/report`) cuando exista.
- Presentar logs y eventos en tiempo real vía socket (`docker:started|log|exit`) en el contexto del perfil activo.
- Respetar el feature flag `docker` y reflejar estados de disponibilidad/error.

## Capabilities

### New Capabilities
- `docker-ui`: control y monitoreo de la infraestructura Docker asociada a la ejecución de pruebas.

### Modified Capabilities
_(ninguna — no existen specs previas; no hay cambios de requisitos a nivel de spec existente)_

## Impact

- **Código UI:** `src/routes/docker.tsx` y componentes de panel de estado, acciones y consola de logs.
- **APIs:** `/api/docker/check`, `/api/docker/start-desktop`, `/api/docker/status`, `/api/docker/containers`, `/api/docker/run`, `/api/docker/stop`, `/api/docker/report`.
- **Socket:** `docker:started`, `docker:log`, `docker:exit`.
- **Dependencias:** `profile-session-ui`, `contract-client`; se relaciona con opciones de ejecución (`useDocker`).
