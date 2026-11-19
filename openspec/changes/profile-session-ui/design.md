## Context

La capa de datos (`src/lib/api.ts`, `src/lib/socket.ts`, `src/hooks/use-socket.ts`, `src/stores/profileStore.ts`, `src/types/contract.ts`) ya implementa el contrato multi-perfil, pero no existe UI que hidrate el perfil activo ni gestione la sesión. El backend expone `/api/profile-admin` y el evento global `profiles:status`. Ver `proposal.md` para motivación y alcance.

## Goals / Non-Goals

**Goals:**
- Hidratar y persistir en memoria el catálogo de perfiles y el perfil activo al iniciar la app.
- Proveer UI de selección y gestión básica de perfiles integrada al shell.
- Asegurar conexión socket y pertenencia a la sala del perfil activo, reaccionando a cambios y reconexiones.
- Mostrar estado de ejecución por perfil (`profiles:status`).

**Non-Goals:**
- Autenticación de usuarios o control de acceso.
- Cambios en el contrato backend o en la semántica de aislamiento por perfil.
- Implementación de vistas de dominio (ejecución, reportes, etc.) más allá de exponer el contexto.

## Decisions

- **Fuente de verdad del perfil activo:** usar `profileStore` (Zustand) como estado global; hidratar desde `profileAdminApi.list()` y sincronizar tras mutaciones. Alternativa: estado local por vista — descartada por necesidad de contexto transversal (header `X-Profile-Id` y sala socket).
- **Ubicación UI:** selector compacto en el shell (header/sidebar/team-switcher adaptado) y acciones de gestión accesibles desde Ajustes o panel dedicado; reutilizar componentes shadcn existentes (Select, Dialog, Dropdown). Alternativa: solo página en Ajustes — descartada porque el perfil activo debe ser visible/global.
- **Ciclo de vida socket:** conectar al disponer de perfil activo y delegar `join/leave` en `socketClient/useSocket` ante cambios de `activeProfileId`; suscribirse a `profiles:status` a nivel global. Alternativa: conexión por vista — descartada por duplicación y pérdida de eventos.
- **Manejo de errores:** notificaciones (sonner) y estados de carga/vacío; confirmación antes de eliminar perfiles.

## Risks / Trade-offs

- [Perfil activo inexistente tras borrado] → seleccionar un perfil restante devuelto por API/estado o forzar flujo de creación.
- [Condición de carrera al cambiar perfil durante requests] → las vistas reaccionan a `activeProfileId` y refetch; el interceptor lee el estado actual del store.
- [Eventos `profiles:status` globales] → filtrar/mapear en UI sin asumir sala por perfil para este evento.
