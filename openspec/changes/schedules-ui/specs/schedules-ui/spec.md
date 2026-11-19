## Purpose

Permitir definir, administrar y supervisar ejecuciones programadas de la suite de pruebas desde la UI, aprovechando las capacidades de calendarización del backend.

## ADDED Requirements

### Requirement: Gestión de programaciones
La UI SHALL permitir listar, crear, actualizar, habilitar/deshabilitar y eliminar programaciones.

#### Scenario: Crear o actualizar una programación
- **WHEN** el usuario guarda una programación con parámetros válidos (horario, días, tests y opciones)
- **THEN** la UI persiste la programación vía API y la muestra en el listado con su configuración

#### Scenario: Cambiar estado o eliminar
- **WHEN** el usuario alterna la habilitación o elimina una programación
- **THEN** la UI aplica el cambio solicitado y actualiza el listado, informando errores si ocurren

### Requirement: Ejecución manual y visibilidad de actividad
La UI SHALL permitir ejecutar una programación bajo demanda y SHALL mostrar la actividad asociada.

#### Scenario: Ejecutar ahora
- **WHEN** el usuario solicita ejecutar una programación inmediatamente
- **THEN** la UI invoca la ejecución y refleja el resultado o el motivo de rechazo (p. ej. conflicto en curso)

#### Scenario: Eventos de programación
- **WHEN** se reciben eventos `schedule:run` o `schedule:log`
- **THEN** la UI actualiza el estado/registro de actividad de la programación correspondiente

### Requirement: Selección de tests y parámetros
La UI SHALL permitir asociar tests y parámetros de ejecución a una programación utilizando la información disponible del proyecto.

#### Scenario: Configurar tests de la programación
- **WHEN** el usuario edita una programación
- **THEN** la UI ofrece selección de tests (según el catálogo disponible) y persiste los parámetros definidos

### Requirement: Disponibilidad condicionada por feature
La UI SHALL respetar la habilitación del módulo de calendarización.

#### Scenario: Módulo deshabilitado
- **WHEN** el acceso a programaciones es rechazado por feature deshabilitada
- **THEN** la UI informa que la funcionalidad no está disponible
