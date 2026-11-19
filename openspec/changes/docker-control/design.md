## Context

El backend controla Docker (`/api/docker/*`) y emite `docker:started|log|exit` por perfil; módulo gateado por `docker`. Ruta `/docker` es placeholder. Ver `proposal.md` y specs.

## Goals / Non-Goals

**Goals:**
- Panel de estado/diagnóstico, acciones soportadas, consola de logs en vivo y acceso a reporte.
- Reflejar disponibilidad (instalado/listo) y errores operativos.

**Non-Goals:**
- Gestión genérica de contenedores fuera de las acciones expuestas por la API.
- Orquestación no soportada por el backend.

## Decisions

- **Estado y acciones:** TanStack Query para `check/status/containers` y mutaciones para `start-desktop/run/stop`; refresco tras eventos y acciones.
- **Logs:** suscripción `onDocker` del `useSocket` con buffer acotado y autoscroll controlado.
- **UX:** controles habilitados/deshabilitados según estado (`running`, disponibilidad) y feedback de acciones en curso.

## Risks / Trade-offs

- [Operaciones largas/bloqueantes] → feedback inmediato vía socket y estados intermedios.
- [Acceso a reporte] → mostrar enlace/visor solo cuando `hasReport` o endpoint disponible.
