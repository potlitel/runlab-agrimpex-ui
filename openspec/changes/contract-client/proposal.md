## Why

El shell React (shadcn-admin + TanStack) quedó limpio de dominio DAM y Clerk, pero no existe capa de datos: antes de construir cualquier vista (dashboard, reportes, ajustes) hay que definir **cómo la UI habla con el API REST y el Socket.io** del backend `runlab-agrimpex-api`, cuyo contrato ya está fijado por la referencia QADash.

## What Changes

- Cliente HTTP tipado sobre el `axios` existente: un método por endpoint del contrato (`/config`, `/tests`, `/reports`, `/env`, `/profiles`, `/docker`, `/schedules`, `/errors`, `/automation`, `/features`, `/profile-admin`, `/system`, `/txtdata`, `/jsondata`), inyectando el header `X-Profile-Id`.
- Hook `useSocket` (`socket.io-client`): conexión al backend, join/leave a la sala `profile:<id>`, tipado de todos los eventos (`execution:*`, `test:*`, `progress`, `docker:*`, `automation:*`, `env:*`, `schedule:*`, `profiles:status`, `system:*`).
- Tipos TypeScript del contrato (respuestas REST + payloads de eventos) en un módulo único.
- Store zustand de sesión: perfil activo + lista de perfiles, consumido por api-client y socket para viajar en `X-Profile-Id` / `profile:join`.

## Capabilities

### New Capabilities
- `api-client`: acceso tipado al API REST del backend, con inyección de `X-Profile-Id` y manejo neutro de errores.
- `socket-client`: conexión Socket.io con aislamiento por sala de perfil y tipado de eventos de ejecución en vivo.

### Modified Capabilities
_(ninguna — repo sin specs previas)_

## Impact

- Archivos: `src/lib/api.ts` (expande), nuevos `src/lib/socket.ts`, `src/types/contract.ts`, `src/stores/profile-store.ts`.
- Dependencia `socket.io-client` ya instalada en el scaffold.
- Sin cambios a componentes de UI en este change (las vistas vienen en U2+).
- El contrato espeja al backend QADash-adaptado: ninguna vista depende de forma de respuesta nueva.
