## Purpose

Proporcionar una sesión de perfil activa en la UI que sincronice la selección de perfil con las llamadas REST y las salas Socket.io, permitiendo operar el dashboard en contextos multi-perfil.

## ADDED Requirements

### Requirement: Catálogo y gestión de perfiles
La UI SHALL permitir consultar, crear, duplicar, renombrar y eliminar perfiles del dashboard utilizando los endpoints de `profile-admin`, reflejando los cambios en el estado local.

#### Scenario: Listado e hidratación inicial
- **WHEN** la aplicación carga o el usuario accede a la gestión de perfiles
- **THEN** la UI obtiene la lista de perfiles y el `activeProfileId` desde `/api/profile-admin` y actualiza `profiles` y `activeProfileId` en el store

#### Scenario: Crear o duplicar perfil
- **WHEN** el usuario crea o duplica un perfil con un nombre válido
- **THEN** la UI invoca la operación correspondiente y actualiza el catálogo local con el perfil resultante

#### Scenario: Renombrar perfil
- **WHEN** el usuario renombra un perfil existente
- **THEN** la UI persiste el cambio vía API y refleja el nuevo nombre en el catálogo y en el selector

#### Scenario: Eliminar perfil
- **WHEN** el usuario confirma la eliminación de un perfil permitido por el backend
- **THEN** la UI elimina el perfil, sincroniza el `activeProfileId` vigente y muestra retroalimentación ante errores (p. ej. último perfil o perfil en ejecución)

### Requirement: Selección y contexto de perfil activo
La UI SHALL exponer un selector de perfil activo y SHALL mantener el `activeProfileId` como contexto global para las operaciones dependientes de perfil.

#### Scenario: Activar un perfil
- **WHEN** el usuario selecciona un perfil distinto
- **THEN** la UI activa el perfil mediante `/api/profile-admin/:id/activate` (o equivalente), actualiza `profileStore.activeProfileId` y propaga el nuevo contexto a las vistas

#### Scenario: Sin perfil disponible
- **WHEN** no existen perfiles o no hay un perfil activo resoluble
- **THEN** la UI muestra un estado vacío/guía para crear o activar un perfil y evita operaciones que requieran contexto de perfil

### Requirement: Sincronización de conexión Socket por perfil
La UI SHALL conectar el cliente Socket.io y SHALL unirse a la sala `profile:<id>` del perfil activo, abandonando la sala anterior al cambiar de perfil.

#### Scenario: Unión a sala del perfil activo
- **WHEN** existe un perfil activo y la sesión de socket se establece
- **THEN** la UI emite `profile:join` con el identificador del perfil activo y mantiene la suscripción activa

#### Scenario: Cambio de perfil activo
- **WHEN** el usuario cambia el perfil activo durante una sesión conectada
- **THEN** la UI emite `profile:leave` para el perfil anterior y `profile:join` para el nuevo perfil

#### Scenario: Reconexión
- **WHEN** la conexión socket se restablece tras una interrupción
- **THEN** la UI vuelve a unirse automáticamente a la sala del perfil activo sin intervención del usuario

### Requirement: Visibilidad de estado de ejecución por perfil
La UI SHALL mostrar el estado de ejecución de perfiles recibido por el evento global `profiles:status`.

#### Scenario: Actualización de estado
- **WHEN** el backend emite `profiles:status`
- **THEN** la UI actualiza los indicadores de perfiles en ejecución y sus tipos de actividad visibles en la interfaz
