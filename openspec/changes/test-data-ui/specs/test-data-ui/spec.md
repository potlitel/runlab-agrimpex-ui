## Purpose

Facilitar la consulta y administración de datos de prueba en formatos TXT y JSON, incluyendo la gestión de snapshots, para soportar la configuración de escenarios de prueba.

## ADDED Requirements

### Requirement: Visualización de datos TXT
La UI SHALL consultar y presentar los datos TXT parseados provistos por el backend.

#### Scenario: Mostrar tabla de datos TXT
- **WHEN** el usuario accede a la sección de datos TXT y la fuente está configurada
- **THEN** la UI muestra las columnas y filas parseadas devueltas por la API

#### Scenario: Fuente no configurada o error de lectura
- **WHEN** la fuente TXT no está configurada o la API reporta un error
- **THEN** la UI muestra un estado informativo con el detalle disponible

### Requirement: Exploración y edición de datos JSON
La UI SHALL permitir explorar la estructura de archivos JSON y leer/guardar su contenido.

#### Scenario: Navegar y editar un archivo JSON
- **WHEN** el usuario selecciona un archivo del árbol JSON
- **THEN** la UI carga su contenido, permite modificarlo y guarda los cambios vía API

#### Scenario: Error de acceso o contenido inválido
- **WHEN** la lectura o guardado falla (archivo inexistente, ruta inválida o error de validación)
- **THEN** la UI muestra el error devuelto y preserva el estado editable cuando sea posible

### Requirement: Gestión de snapshots de datos JSON
La UI SHALL permitir listar, crear/guardar y eliminar snapshots asociados a un archivo JSON.

#### Scenario: Guardar y restaurar/consultar snapshots
- **WHEN** el usuario crea o selecciona un snapshot para un archivo
- **THEN** la UI persiste o recupera el contenido del snapshot mediante la API

#### Scenario: Eliminar snapshot
- **WHEN** el usuario elimina un snapshot
- **THEN** la UI solicita la eliminación y actualiza el listado de snapshots

### Requirement: Disponibilidad condicionada por features
La UI SHALL respetar la habilitación independiente de las fuentes de datos TXT y JSON.

#### Scenario: Fuente deshabilitada
- **WHEN** el acceso a una fuente de datos es rechazado por feature deshabilitada
- **THEN** la UI oculta o deshabilita la sección correspondiente e informa su indisponibilidad
