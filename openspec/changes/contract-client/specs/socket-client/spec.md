## Purpose

Mantener la conexión Socket.io con el backend, aislada por sala de perfil, para pintar en vivo el progreso de ejecuciones y eventos de módulos.

## ADDED Requirements

### Requirement: Conexión y salas por perfil
El cliente SHALL conectar al mismo origin del backend y SHALL unirse a la sala `profile:<id>` mediante `profile:join`, saliendo con `profile:leave`.

#### Scenario: Cambio de perfil activo
- **WHEN** el perfil activo cambia
- **THEN** se sale de la sala anterior y se entra a la nueva

### Requirement: Eventos de ejecución
El cliente SHALL exponer suscripciones tipadas a `execution:*`, `test:*` y `progress`.

#### Scenario: Progreso de corrida
- **WHEN** el backend emite `progress`
- **THEN** el hook entrega current, total y percentage a la vista

### Requirement: Eventos de módulos
El cliente SHALL tipar y exponer los eventos `docker:*`, `automation:*`, `env:*`, `schedule:*`, `profiles:status` y `system:*`.

#### Scenario: Log de docker
- **WHEN** el backend emite `docker:log`
- **THEN** la vista de Docker recibe la línea con su tipo

### Requirement: Reconexión
El cliente SHALL reconectar automáticamente y, tras reconectar, SHALL re-unirse a la sala del perfil activo.

#### Scenario: Caída del backend
- **WHEN** se pierde la conexión y vuelve
- **THEN** la sala del perfil activo queda restablecida sin acción del usuario