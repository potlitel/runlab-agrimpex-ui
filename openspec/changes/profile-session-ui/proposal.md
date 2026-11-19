## Why

La UI cuenta con la capa de contrato (`contract-client`: cliente REST/Socket tipado y `profileStore`) pero carece de una sesión de perfil activa en interfaz: sin seleccionar/hidratar un perfil, las peticiones no envían `X-Profile-Id` útil y el socket no se une a `profile:<id>`, bloqueando el uso real de las vistas que dependen del backend multi-perfil.

## What Changes

- Incorporar UI para listar, crear, duplicar, renombrar, activar y eliminar perfiles del dashboard consumiendo `/api/profile-admin`.
- Hidratar y sincronizar el perfil activo con `profileStore` (`activeProfileId`, `profiles`) al iniciar y tras operaciones de gestión.
- Conectar/reconectar el socket y gestionar `join/leave` de sala según el perfil activo; mostrar estado de ejecución por perfil a partir de `profiles:status`.
- Exponer el selector/estado de perfil en el shell (layout/sidebar/header) como contexto global para el resto de vistas.
- Manejar estados vacíos, errores y confirmaciones básicas de acciones destructivas.

## Capabilities

### New Capabilities
- `profile-session-ui`: gestión visual del perfil activo y de la sesión de conexión (REST/Socket) que contextualiza todas las operaciones multi-perfil.

### Modified Capabilities
_(ninguna — no existen specs previas; no hay cambios de requisitos a nivel de spec existente)_

## Impact

- **Código UI:** `src/components/layout/*` (selector/indicadores), nuevas vistas/componentes de gestión de perfiles (p. ej. sección en Ajustes o panel dedicado), integración con `src/stores/profileStore.ts`, `src/lib/api.ts` (`profileAdminApi`) y `src/lib/socket.ts` / `src/hooks/use-socket.ts`.
- **APIs:** `/api/profile-admin` (`GET`, `POST`, `PATCH /:id/rename`, `POST /:id/duplicate`, `PATCH /:id/activate`, `DELETE /:id`).
- **Socket:** sala `profile:<id>` (`profile:join/leave`) y evento global `profiles:status`.
- **Dependencias:** `contract-client` (implementado). Habilita el funcionamiento correcto de vistas de ejecución, entornos, docker, schedules, datos y configuración por perfil.
