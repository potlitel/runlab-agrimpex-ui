# Spec Delta

## Purpose

Permite que la ruta `/` monitorice una corrida en vivo y su cierre, ofreciendo un resumen confiable, resultados explorables, contexto del perfil y acceso al reporte y las evidencias generadas, sin convertirse en una segunda pantalla de configuración o analítica histórica.

## ADDED Requirements

### Requirement: Resumen fidedigno de la corrida

La vista SHALL presentar el estado de la corrida activa o, en su defecto, el de la última finalizada, incluyendo totales, pasados, fallidos, errores, omitidos, duración y tasa de éxito. Cuando el detalle del reporte esté disponible, sus valores SHALL prevalecer sobre los cálculos derivados de los eventos parciales.

#### Scenario: Corrida finalizada con detalle de reporte disponible
- **WHEN** la UI recibe la confirmación de finalización con un identificador de reporte y el detalle se obtiene correctamente
- **THEN** el resumen muestra los campos del reporte, incluidos errores, omitidos y duración, y la tasa de éxito se calcula a partir de los resultados efectivamente ejecutados

#### Scenario: Detalle de reporte no disponible
- **WHEN** la UI recibe el resumen por evento pero la consulta del detalle falla
- **THEN** se conserva el resumen recibido por evento, se marca como parcial y no se descartan los resultados ya acumulados

#### Scenario: Corrida en curso sin resumen final
- **WHEN** la corrida está en curso y todavía no existe un resumen final
- **THEN** la vista muestra progreso y resultados incrementales sin presentar cifras de éxito definitivas

### Requirement: Acceso a la corrida finalizada

La UI SHALL conservar el identificador del reporte asociado a la corrida finalizada o abortada y SHALL ofrecer acciones para consultarlo, exportarlo en PDF y descargar sus artefactos JSON y HTML, siempre que el módulo de reportes esté habilitado para el perfil activo.

#### Scenario: Corrida completada con reportes habilitados
- **WHEN** se recibe el evento de finalización con identificador de reporte y el módulo de reportes está habilitado
- **THEN** la vista ofrece acciones para ver el reporte, exportar el PDF de esa corrida y descargar JSON y HTML

#### Scenario: Corrida abortada
- **WHEN** se recibe el evento de aborto con identificador de reporte
- **THEN** la vista ofrece las mismas acciones sobre el reporte parcial y conserva el progreso alcanzado antes del aborto

#### Scenario: Módulo de reportes deshabilitado
- **WHEN** el perfil activo tiene deshabilitado el módulo de reportes
- **THEN** la vista oculta o deshabilita las acciones dependientes del módulo y muestra una explicación acorde sin bloquear la consola ni la tabla de resultados

### Requirement: Resultados explorables y evidencias

La tabla de resultados SHALL permitir buscar por identificador, filtrar por estado, ordenar por fallos o duración, agrupar por archivo y expandir la salida completa de cada test. Los archivos adjuntos presentes en el resultado SHALL ser accesibles desde su fila sin navegar a otra pantalla.

#### Scenario: Localizar fallos en una corrida extensa
- **WHEN** el usuario filtra por estado fallido o error y ordena por duración
- **THEN** la tabla muestra solo los resultados coincidentes, agrupados por archivo cuando se solicite, con su duración y estado legibles

#### Scenario: Revisar evidencia de un resultado
- **WHEN** un resultado contiene uno o más archivos adjuntos y el usuario los solicita desde la fila
- **THEN** la UI abre la evidencia correspondiente y mantiene el resto de la tabla sin cambios

#### Scenario: Resultado sin salida ni adjuntos
- **WHEN** un resultado no registra salida ni archivos adjuntos
- **THEN** la fila lo indica explícitamente sin mostrar acciones vacías

### Requirement: Contexto de ejecución del perfil activo

La vista SHALL mostrar, en modo solo lectura, el contexto disponible del perfil activo: proyecto configurado, entorno resuelto, uso de Docker, workers, filtro grep y detección de MCP. Cuando falte un prerrequisito, SHALL ofrecer una acción de navegación hacia la pantalla correspondiente sin exponer controles de configuración en el dashboard.

#### Scenario: Perfil correctamente configurado
- **WHEN** la configuración del proyecto y del entorno está disponible para el perfil activo
- **THEN** la vista muestra el contexto resuelto y un enlace hacia la pantalla de tests para iniciar una corrida

#### Scenario: Prerrequisito faltante
- **WHEN** el proyecto no está configurado o la configuración no puede consultarse
- **THEN** la vista muestra el estado faltante y un enlace hacia Ajustes o Entornos, sin deshabilitar el resto del monitor

### Requirement: Estados y accesibilidad del monitor en vivo

La consola y la tabla SHALL distinguir entre espera, carga, sin resultados y error. La salida en vivo SHALL ser anunciable por tecnología de asistencia, el progreso SHALL exponer su valor accesible y el usuario SHALL poder limpiar el buffer de logs sin afectar los resultados.

#### Scenario: Sin actividad reciente
- **WHEN** no existe una corrida en curso ni resultados previos para el perfil activo
- **THEN** la vista muestra un estado vacío que indica cómo iniciar una corrida desde Tests

#### Scenario: Error al cargar el catálogo o el contexto
- **WHEN** una consulta de catálogo o configuración falla
- **THEN** la vista muestra el error y una acción de reintento sin ocultar los resultados ya disponibles

#### Scenario: Seguimiento con lector de pantalla
- **WHEN** llegan nuevos eventos de log o progreso
- **THEN** la tecnología de asistencia puede anunciar la salida reciente y consultar el valor actual de progreso
