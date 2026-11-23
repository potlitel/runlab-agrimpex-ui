# Spec Delta

## Purpose

Permitir la generación, descarga y compartición de reportes PDF integrales, tanto por corrida individual como analíticos agregados, para distribuir y archivar resultados de QA con un contenido completo y consistente.

## ADDED Requirements

### Requirement: Exportación de PDF integral por corrida
La UI SHALL permitir generar y descargar un PDF integral para una corrida de reporte seleccionada, usando el payload normalizado de exportación provisto por el backend.

#### Scenario: Descarga directa desde el detalle de reporte
- **WHEN** el usuario solicita "Exportar PDF" desde el detalle de una corrida disponible
- **THEN** la UI obtiene el payload de exportación de la corrida, genera el PDF y descarga un archivo que incluye portada/metadata, resumen ejecutivo, resultados por test, evidencias y pie de generación

#### Scenario: Descarga directa desde el historial
- **WHEN** el usuario solicita "Exportar PDF" desde una corrida en el historial de reportes
- **THEN** la UI genera y descarga el PDF integral correspondiente a esa corrida sin requerir abrir previamente el detalle

#### Scenario: Corrida sin evidencias o con adjuntos no imagen
- **WHEN** la corrida no tiene evidencias imagen o incluye adjuntos no imagen
- **THEN** el PDF incluye la sección de evidencias con las imágenes disponibles y lista los adjuntos no imagen como referencias, sin fallar la exportación

### Requirement: Exportación de PDF analítico agregado
La UI SHALL permitir generar y descargar un PDF integral con la analítica agregada del módulo de reportes.

#### Scenario: Descarga directa de analítica
- **WHEN** el usuario solicita "Exportar PDF" desde la vista de analítica de reportes
- **THEN** la UI obtiene el payload normalizado de analítica, genera el PDF y descarga un archivo que incluye portada/alcance, KPIs, tendencia, desglose por archivo y corridas recientes

#### Scenario: Analítica sin datos suficientes
- **WHEN** no hay datos de analítica disponibles para exportar
- **THEN** la UI impide la exportación vacía o informa un estado vacío claro, sin generar un PDF inconsistente

### Requirement: Personalización de secciones de exportación
La UI SHALL ofrecer una opción secundaria de personalización para elegir las secciones incluidas en cada tipo de PDF antes de generar.

#### Scenario: Personalizar PDF por corrida
- **WHEN** el usuario abre "Personalizar PDF…" para una corrida
- **THEN** la UI permite seleccionar secciones del contenido integral confirmado y genera el PDF solo con las secciones elegidas

#### Scenario: Personalizar PDF analítico
- **WHEN** el usuario abre "Personalizar PDF…" para la analítica
- **THEN** la UI permite seleccionar secciones del contenido analítico confirmado y genera el PDF solo con las secciones elegidas

#### Scenario: Exportación directa usa configuración integral
- **WHEN** el usuario usa la acción principal de exportación sin personalizar
- **THEN** la UI genera el PDF con todas las secciones integrales aplicables por defecto

### Requirement: Manejo de disponibilidad y errores de exportación
La UI SHALL manejar errores de obtención de payload, generación de PDF y disponibilidad del módulo sin dejar la vista en un estado inconsistente.

#### Scenario: Error al obtener payload o generar PDF
- **WHEN** falla la obtención del payload de exportación o la generación del PDF
- **THEN** la UI muestra un error comprensible, mantiene visible el contexto actual y permite reintentar la acción

#### Scenario: Módulo de reportes no disponible
- **WHEN** el módulo de reportes no está habilitado o la API rechaza el acceso
- **THEN** la UI no ofrece acciones de exportación PDF activas y mantiene el comportamiento degradado existente del módulo

### Requirement: Compartición de reportes PDF
La UI SHALL permitir compartir un reporte PDF generado por corrida o analítico mediante WhatsApp y correo electrónico, usando capacidades del navegador cuando estén disponibles y alternativas compatibles cuando no lo estén.

#### Scenario: Compartir por WhatsApp con soporte de archivo
- **WHEN** el usuario solicita compartir por WhatsApp y el navegador soporta compartir archivos
- **THEN** la UI genera el PDF y abre el flujo de compartición con el archivo y un mensaje descriptivo

#### Scenario: Compartir por WhatsApp sin soporte de archivo
- **WHEN** el usuario solicita compartir por WhatsApp y el navegador no soporta compartir archivos
- **THEN** la UI genera/descarga el PDF según corresponda y abre una alternativa compatible con mensaje prellenado, informando que el adjunto debe agregarse manualmente si aplica

#### Scenario: Compartir por correo electrónico con soporte de archivo
- **WHEN** el usuario solicita compartir por correo electrónico y el navegador soporta compartir archivos
- **THEN** la UI genera el PDF y abre el flujo de compartición con el archivo, asunto y cuerpo descriptivo

#### Scenario: Compartir por correo electrónico sin soporte de archivo
- **WHEN** el usuario solicita compartir por correo electrónico y el navegador no soporta compartir archivos
- **THEN** la UI abre un `mailto:` con asunto y cuerpo prellenado y genera/descarga el PDF para adjuntarlo manualmente, informando claramente la acción requerida

#### Scenario: Error o cancelación en compartición
- **WHEN** falla la generación del PDF o el usuario cancela el flujo de compartición
- **THEN** la UI muestra un estado comprensible, no pierde el contexto actual y no deja la exportación en estado inconsistente
