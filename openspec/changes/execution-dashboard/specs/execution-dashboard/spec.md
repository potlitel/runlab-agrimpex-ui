## Purpose

Permitir explorar, configurar y ejecutar la suite de tests Playwright desde la UI, mostrando progreso y resultados en vivo en el contexto del perfil activo.

## ADDED Requirements

### Requirement: Descubrimiento y visualización del árbol de tests
La UI SHALL obtener y presentar el catálogo de tests del proyecto usando los endpoints de colección (`collect`/`cached`), incluyendo archivos, totales y proyectos disponibles.

#### Scenario: Cargar árbol desde caché o colección
- **WHEN** el usuario accede a la vista de ejecución
- **THEN** la UI carga los tests disponibles (cached y/o collect) y renderiza la estructura por archivo/proyecto con conteos

#### Scenario: Proyecto no configurado o error de colección
- **WHEN** el backend indica que el proyecto no está configurado o la colección falla
- **THEN** la UI muestra un estado informativo con el error y una acción para configurar o reintentar

### Requirement: Configuración y lanzamiento de ejecuciones
La UI SHALL permitir seleccionar tests y parámetros de corrida y SHALL iniciar ejecuciones mediante la API de tests.

#### Scenario: Lanzar ejecución válida
- **WHEN** el usuario selecciona uno o más tests y confirma la ejecución
- **THEN** la UI envía `POST /tests/run` con los parámetros configurados y refleja el acuse/estado de inicio

#### Scenario: Ejecución en curso
- **WHEN** ya existe una ejecución en progreso para el perfil
- **THEN** la UI impide iniciar una nueva corrida conflictiva y muestra el estado en curso

### Requirement: Monitoreo en vivo y control de ejecución
La UI SHALL reflejar en tiempo real los eventos de ejecución y SHALL permitir abortar una corrida en curso.

#### Scenario: Progreso y resultados de tests
- **WHEN** se reciben eventos `execution:*`, `test:*` o `progress` para el perfil activo
- **THEN** la UI actualiza indicadores de progreso, estado por test y salida disponible sin recargar la vista

#### Scenario: Abortar ejecución
- **WHEN** el usuario solicita abortar una ejecución en curso
- **THEN** la UI invoca `/tests/abort` y actualiza el estado cuando se recibe confirmación o evento de aborto/finalización

### Requirement: Consulta de archivos de test
La UI SHALL permitir consultar el contenido de archivos de test del proyecto cuando el backend lo provee.

#### Scenario: Visualizar archivo de test
- **WHEN** el usuario solicita ver un archivo de test válido
- **THEN** la UI obtiene su contenido vía `/tests/file` y lo muestra de forma legible

#### Scenario: Acceso denegado o archivo inexistente
- **WHEN** el backend rechaza o no encuentra el archivo solicitado
- **THEN** la UI muestra un mensaje de error acorde sin bloquear el resto de la vista
