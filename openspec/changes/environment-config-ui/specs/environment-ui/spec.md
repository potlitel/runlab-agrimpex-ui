## Purpose

Permitir gestionar variables de entorno y perfiles de variables por contexto, proporcionando a la UI la configuración necesaria para parametrizar ejecuciones de pruebas.

## ADDED Requirements

### Requirement: Gestión de archivos .env del proyecto
La UI SHALL listar y editar archivos `.env` disponibles en el proyecto a través de la API de entorno.

#### Scenario: Listar y cargar un archivo .env
- **WHEN** el usuario accede a la vista de entornos
- **THEN** la UI obtiene los archivos disponibles y permite cargar las variables del archivo seleccionado

#### Scenario: Guardar cambios en variables
- **WHEN** el usuario modifica y guarda variables de un archivo `.env`
- **THEN** la UI persiste los cambios vía API y confirma el resultado o muestra el error devuelto

### Requirement: Gestión de entornos guardados por perfil
La UI SHALL permitir crear, actualizar, renombrar y eliminar entornos (conjuntos de variables) asociados al perfil activo.

#### Scenario: Crear o actualizar un entorno
- **WHEN** el usuario guarda un conjunto de variables con un nombre de entorno
- **THEN** la UI persiste el entorno en el perfil activo y lo refleja en el listado

#### Scenario: Renombrar o eliminar un entorno
- **WHEN** el usuario renombra o elimina un entorno existente
- **THEN** la UI aplica la operación solicitada y actualiza el listado, mostrando errores si la operación falla

### Requirement: Uso de entornos en el flujo de ejecución
La UI SHALL permitir seleccionar un archivo/env o entorno guardado como fuente de variables para una ejecución cuando esta capacidad sea requerida.

#### Scenario: Selección de fuente de variables
- **WHEN** el usuario prepara una ejecución desde la interfaz
- **THEN** la UI ofrece las fuentes de variables disponibles y las incluye en los parámetros de ejecución según corresponda

### Requirement: Disponibilidad condicionada por feature
La UI SHALL respetar la habilitación del módulo de variables/entornos.

#### Scenario: Módulo deshabilitado
- **WHEN** el acceso a variables/entornos es rechazado por feature deshabilitada
- **THEN** la UI informa la indisponibilidad del módulo sin impedir el uso de otras secciones habilitadas
