## Purpose

Facilitar la inspección de evidencias gráficas de fallos generadas por las pruebas, consumiendo el listado y los archivos de imagen expuestos por el backend.

## ADDED Requirements

### Requirement: Listado de evidencias de fallos
La UI SHALL obtener y mostrar las imágenes de error disponibles junto con sus metadatos y el estado de configuración de la carpeta de evidencias.

#### Scenario: Evidencias disponibles
- **WHEN** el usuario accede a la vista de evidencias y la carpeta está configurada y accesible
- **THEN** la UI muestra el listado/galería de imágenes con nombre, fecha y tamaño

#### Scenario: Carpeta no configurada o inexistente
- **WHEN** el backend indica que la evidencia no está configurada o la carpeta no existe
- **THEN** la UI muestra un estado informativo que explique la condición sin fallar

### Requirement: Visualización de imágenes
La UI SHALL permitir abrir y visualizar una imagen de evidencia servida por el backend.

#### Scenario: Abrir imagen
- **WHEN** el usuario selecciona una imagen del listado
- **THEN** la UI carga y muestra la imagen desde el endpoint de servicio de evidencias

#### Scenario: Imagen no disponible
- **WHEN** la imagen solicitada no puede cargarse o ya no existe
- **THEN** la UI muestra un mensaje de error y mantiene utilizable el resto de la galería

### Requirement: Respeto de disponibilidad del módulo
La UI SHALL respetar la disponibilidad del módulo de evidencias condicionada por features o permisos del backend.

#### Scenario: Módulo deshabilitado
- **WHEN** el acceso al módulo de evidencias es rechazado por estar deshabilitado
- **THEN** la UI comunica que la funcionalidad no está disponible para el contexto actual
