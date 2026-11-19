## Purpose

Centralizar en la UI la configuración del proyecto, módulos, automatización y operaciones administrativas del dashboard, integrando las capacidades expuestas por el backend.

## ADDED Requirements

### Requirement: Configuración del proyecto
La UI SHALL permitir consultar, editar, validar y guardar la configuración del proyecto y sus rutas/comandos asociados.

#### Scenario: Cargar y guardar configuración
- **WHEN** el usuario accede a la configuración y guarda cambios válidos
- **THEN** la UI persiste la configuración vía `/config` y refleja los valores actualizados

#### Scenario: Validar o detectar entorno
- **WHEN** el usuario solicita validar la configuración o detectar el archivo de entorno
- **THEN** la UI invoca las operaciones de validación/detección y muestra el resultado

### Requirement: Gestión de feature flags
La UI SHALL permitir consultar y modificar los feature flags del módulo.

#### Scenario: Actualizar flags
- **WHEN** el usuario cambia el estado de uno o más flags y guarda
- **THEN** la UI persiste los cambios y actualiza el comportamiento/visibilidad de los módulos afectados

### Requirement: Automatización y entorno de pruebas
La UI SHALL exponer las operaciones de automatización (configuración, chequeos, instalación/actualización, ramas, setup de entorno/dependencias y aplicación) y SHALL mostrar su progreso.

#### Scenario: Ejecutar operación de automatización
- **WHEN** el usuario inicia una operación de automatización o entorno
- **THEN** la UI invoca el endpoint correspondiente y presenta logs/progreso y estado final según eventos y respuestas

#### Scenario: Operación rechazada o en conflicto
- **WHEN** el backend rechaza la operación por estado en curso o parámetros inválidos
- **THEN** la UI muestra el motivo del rechazo sin corromper el estado local

### Requirement: Administración de perfiles y actualizaciones del sistema
La UI SHALL permitir administrar perfiles del dashboard y SHALL exponer el estado/ejecución de actualizaciones del sistema según las restricciones del backend.

#### Scenario: Gestionar perfiles desde ajustes
- **WHEN** el usuario realiza operaciones de gestión de perfiles en ajustes
- **THEN** la UI aplica los cambios vía `profile-admin` y mantiene consistente el perfil activo

#### Scenario: Consultar o ejecutar actualización del sistema
- **WHEN** el usuario consulta el estado de actualizaciones o solicita una actualización autorizada
- **THEN** la UI muestra el estado devuelto y el resultado/eventos de la operación, informando si la funcionalidad está deshabilitada o requiere token
