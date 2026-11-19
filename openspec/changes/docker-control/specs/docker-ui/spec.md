## Purpose

Brindar control y visibilidad sobre la infraestructura Docker utilizada por las pruebas, integrando estado, acciones y logs en tiempo real en la UI.

## ADDED Requirements

### Requirement: Diagnóstico y estado de Docker
La UI SHALL consultar y mostrar el estado de disponibilidad y ejecución de Docker y sus contenedores/proyectos asociados.

#### Scenario: Visualizar estado actual
- **WHEN** el usuario accede a la vista de Docker
- **THEN** la UI presenta la información de verificación, estado y contenedores obtenida de la API

#### Scenario: Docker no disponible
- **WHEN** la verificación indica que Docker no está instalado o no está listo
- **THEN** la UI muestra el estado y, cuando aplique, ofrece la acción de inicio disponible

### Requirement: Ejecución de acciones de control
La UI SHALL permitir ejecutar acciones de inicio/ejecución y detención soportadas por el backend.

#### Scenario: Ejecutar una acción
- **WHEN** el usuario solicita una acción de Docker soportada
- **THEN** la UI invoca el endpoint correspondiente y refleja el inicio o resultado de la operación

#### Scenario: Detener operación en curso
- **WHEN** el usuario solicita detener la operación activa
- **THEN** la UI invoca la detención y refleja el estado resultante

### Requirement: Monitoreo de logs y eventos
La UI SHALL mostrar en tiempo real los eventos y logs de Docker emitidos por el backend.

#### Scenario: Recepción de eventos de Docker
- **WHEN** se reciben eventos `docker:started`, `docker:log` o `docker:exit`
- **THEN** la UI actualiza la consola/estado de la operación con la información recibida

### Requirement: Acceso a reporte de Docker y disponibilidad por feature
La UI SHALL permitir acceder al reporte cuando exista y SHALL respetar la habilitación del módulo.

#### Scenario: Reporte disponible
- **WHEN** el estado indica que existe un reporte generado
- **THEN** la UI ofrece acceso al reporte provisto por el backend

#### Scenario: Módulo deshabilitado
- **WHEN** el acceso al módulo Docker es rechazado por feature deshabilitada
- **THEN** la UI comunica la indisponibilidad del módulo
