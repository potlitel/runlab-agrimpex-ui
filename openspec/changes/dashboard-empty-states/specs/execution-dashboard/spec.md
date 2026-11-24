# Spec Delta

## Purpose

Define la presentación de los paneles del dashboard de ejecución cuando no hay corrida activa, de modo que cada panel comunique su propósito, el dato que mostrará y la acción disponible sin alterar la monitorización en vivo.

## ADDED Requirements

### Requirement: Estados vacíos accionables en los paneles del dashboard

Cada panel del dashboard SHALL distinguir su estado vacío del estado de carga o de error mediante un icono representativo, un texto secundario que explique qué información aparecerá y una acción de navegación hacia la pantalla que permite completar esa información. Los paneles cubiertos SHALL ser contexto de ejecución, última corrida, consola de ejecución y resultados por test.

#### Scenario: Perfil sin proyecto configurado

- **WHEN** el perfil activo no tiene ruta de proyecto y la consulta de configuración no está en error
- **THEN** el panel de contexto muestra el estado sin configurar con icono de carpeta, texto orientativo y una acción para ir a Ajustes

#### Scenario: Dashboard sin corrida previa

- **WHEN** no existe reporte de una corrida finalizada ni resultados para el perfil activo
- **THEN** los paneles de última corrida y resultados muestran cada uno su propio estado vacío con icono, texto y una acción para ir a Tests

#### Scenario: Consola sin actividad

- **WHEN** no hay logs y no hay una corrida en curso
- **THEN** la consola muestra un mensaje de espera dentro del área de salida sin ocultar el progreso ni el estado «En espera»

### Requirement: Señalización visual del contexto de ejecución

El dashboard SHALL presentar los valores disponibles del contexto (proyecto, entorno, Docker, workers, grep y comando) como unidades visuales compactas con indicador de estado, de forma que un valor presente se distinga de uno «No registrado» sin leer la etiqueta completa. La ausencia de un valor SHALL conservar el texto «No registrado» o el marcador equivalente.

#### Scenario: Contexto resuelto

- **WHEN** la configuración del proyecto y las opciones de la última corrida proporcionan todos los valores
- **THEN** cada valor aparece en una insignia o tarjeta con su icono y confirmación visual, manteniendo legible la ruta del proyecto y el comando

#### Scenario: Valores parciales

- **WHEN** algunas opciones de la corrida no están registradas
- **THEN** esos campos aparecen con estilo neutro y texto «No registrado», sin presentar cifras falsas ni valores vacíos como si estuvieran configurados

#### Scenario: Error de consulta de configuración

- **WHEN** la consulta de configuración falla
- **THEN** el panel conserva el mensaje de error, las acciones de reintento y navegación a Ajustes, y los demás paneles siguen disponibles

### Requirement: Consola en espera con apariencia de terminal y accesibilidad preservada

El área de salida de la consola SHALL mantener una apariencia de terminal con fondo contrastado y tipografía monoespaciada tanto con logs como sin ellos, y SHALL conservar la semántica de región de log anunciable, el progreso con valor accesible y los mensajes diferenciados de espera, ejecución y error.

#### Scenario: Consola vacía

- **WHEN** la lista de logs está vacía y no hay corrida en curso
- **THEN** se muestra el fondo de terminal con el mensaje de espera legible y la región de log sigue siendo anunciable por tecnología de asistencia

#### Scenario: Llegada de eventos

- **WHEN** llegan nuevos eventos de log o de progreso
- **THEN** la salida se actualiza manteniendo el contraste del texto, la barra de progreso accesible y el estado «En ejecución»

#### Scenario: Error de carga del catálogo

- **WHEN** existe un error de carga
- **THEN** el error se muestra con su acción de reintento sobre el fondo de terminal sin borrar los resultados ya disponibles

### Requirement: Previsualización del estado de la última corrida

Cuando no hay reporte de una corrida finalizada, el panel «Última corrida» SHALL mostrar una previsualización esqueleto que indique la forma de la información que aparecerá —fecha, duración y tasa de éxito— junto con el texto explicativo y la acción para ir a Tests. Cuando exista reporte, SHALL mostrar los datos reales sin el esqueleto.

#### Scenario: Sin corrida finalizada

- **WHEN** no hay identificador de reporte para el perfil activo
- **THEN** el panel muestra el esqueleto con la silueta de fecha, duración y tasa de éxito, el texto «Todavía no hay una corrida finalizada en esta sesión» y la acción hacia Tests

#### Scenario: Corrida finalizada disponible

- **WHEN** hay identificador de reporte
- **THEN** el panel sustituye el esqueleto por fecha, totales, duración, tasa de éxito y las acciones de reporte disponibles según los módulos habilitados

### Requirement: Barra de herramientas consistente en resultados por test

La tabla de resultados SHALL ofrecer búsqueda, filtro por estado, ordenación y agrupación en una barra de herramientas con controles de ancho suficiente y estilo coherente con el resto de la interfaz. Las opciones existentes, el conteo de coincidencias y la acción de limpiar filtros SHALL conservar su comportamiento.

#### Scenario: Filtrar resultados

- **WHEN** el usuario introduce un texto de búsqueda o selecciona un estado y una ordenación
- **THEN** los selectores muestran la opción elegida sin recortes, la tabla aplica los filtros y el contador refleja las filas visibles

#### Scenario: Sin coincidencias con los filtros

- **WHEN** existen resultados pero ninguno coincide con los filtros activos
- **THEN** la tabla muestra el mensaje «Sin coincidencias con los filtros actuales» y el botón «Limpiar filtros» restablece búsqueda y estado

#### Scenario: Sin resultados todavía

- **WHEN** no hay resultados para la corrida actual
- **THEN** la tabla muestra el estado vacío con icono de búsqueda, texto orientativo y distingue claramente entre carga y ausencia de resultados
