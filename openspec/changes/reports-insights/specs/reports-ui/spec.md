## Purpose

Ofrecer visibilidad del historial y analítica de ejecuciones mediante el consumo de reportes generados por el backend, facilitando el análisis de resultados y tendencias.

## ADDED Requirements

### Requirement: Listado e inspección de reportes
La UI SHALL listar los reportes disponibles y SHALL permitir consultar el detalle de una corrida seleccionada.

#### Scenario: Ver historial de reportes
- **WHEN** el usuario accede a la vista de reportes
- **THEN** la UI muestra el listado de reportes con información resumida (identificador, fecha y resumen)

#### Scenario: Ver detalle de reporte
- **WHEN** el usuario selecciona un reporte del historial
- **THEN** la UI obtiene y presenta el detalle con resumen y resultados por test

### Requirement: Analítica de ejecuciones
La UI SHALL presentar métricas agregadas y tendencias provistas por el endpoint de analítica.

#### Scenario: Mostrar indicadores y tendencias
- **WHEN** existen datos de analítica disponibles
- **THEN** la UI muestra KPIs, tasas y desgloses/timeline según la información entregada por `/reports/analytics`

#### Scenario: Sin datos suficientes
- **WHEN** no hay ejecuciones o métricas disponibles
- **THEN** la UI muestra un estado vacío informativo sin errores bloqueantes

### Requirement: Acceso a artefactos y gestión de reportes
La UI SHALL facilitar el acceso a descargas/assets de un reporte y SHALL permitir su eliminación con confirmación.

#### Scenario: Descargar o abrir artefactos
- **WHEN** el usuario solicita descargar o visualizar artefactos de un reporte
- **THEN** la UI utiliza las URLs/endpoints de descarga y assets provistos para completar la acción

#### Scenario: Eliminar reporte
- **WHEN** el usuario confirma la eliminación de un reporte
- **THEN** la UI invoca la eliminación y actualiza el listado y el detalle mostrado

### Requirement: Respeto de disponibilidad del módulo
La UI SHALL comportarse adecuadamente cuando el módulo de reportes no está habilitado o accesible.

#### Scenario: Módulo deshabilitado o acceso denegado
- **WHEN** la API rechaza el acceso por feature deshabilitada u otra condición
- **THEN** la UI informa que la funcionalidad no está disponible y evita estados inconsistentes
