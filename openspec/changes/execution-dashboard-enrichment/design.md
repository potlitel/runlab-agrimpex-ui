# Design

## Context

La ruta `/` monta `ExecutionDashboard`, que remonta su vista al cambiar de perfil y alimenta `ExecutionConsole` y `ResultsTable` desde `useExecution`. Ese hook ya recibe `reportId` en `execution:completed`/`execution:aborted`, pero no lo expone; `applyReport` reconstruye el resumen solo con contadores y descarta campos del reporte como `duration` y `previewImage`. La tabla ignora los `attachments` que llegan con cada resultado, y la tarjeta de configuración/MCP existe únicamente en `/tests`. No hay specs maestras en `openspec list --specs`: el capability `execution-dashboard` solo existe como delta del change completado anteriormente.

## Goals / Non-Goals

**Goals:**

- Mantener una única fuente de verdad para el estado de la corrida en un store compartido y con clave por perfil, de modo que sobreviva la navegación entre `/tests` y `/` sin mezclar corridas de perfiles distintos.
- Hacer explícita la procedencia de cada cifra: datos del evento en vivo versus datos del reporte final.
- Reutilizar capacidades ya implementadas para PDF, evidencias, configuración y feature gating, evitando variantes específicas del dashboard.
- Mantener la separación entre Dashboard y Tests definida en el change anterior.

**Non-Goals:**

- No persistir logs, selección ni resultados entre navegaciones ni recargas.
- No modificar la capa de socket, los tipos del contrato ni el change `contract-client`, actualmente en progreso.
- No reimplementar analítica histórica, exportación analítica ni hallazgos globales del shell de la aplicación.

## Decisions

- **D1: El `reportId` se trata como estado de la corrida, no como respuesta HTTP.** Se conserva al recibir `execution:completed` o `execution:aborted` y se devuelve junto al resumen. También se conserva el `timestamp` del reporte para identificar la última corrida en el bloque correspondiente. El estado vive en un store compartido con clave `profileId`, porque `/` y `/tests` montan instancias distintas de `useExecution` y cualquier estado local se perdería al navegar (la tarea 6.1 exige iniciar en Tests y ver el resultado en el dashboard). Alternativa rechazada: leerlo de `POST /tests/run`, cuyo payload no lo incluye. Alternativa rechazada: un store global sin clave de perfil, que mezclaría corridas de perfiles distintos.

- **D2: Resumen fusionado con precedencia de campos presentes.** Se combinan el resumen recibido por socket y el del reporte: prevalecen los valores no nulos del reporte (incluidos `duration` y `previewImage`); si el reporte no está disponible, se conservan los del evento y se marca el estado como parcial. La tasa de éxito se deriva de pasados sobre resultados efectivamente ejecutados, excluyendo omitidos. Alternativa rechazada: reemplazar siempre con `report.summary`, que pierde información cuando el reporte está incompleto; también se rechaza reconstruir solo con contadores, que es el comportamiento actual y el origen del problema.

- **D3: Reutilizar el pipeline de PDF y el visor de evidencias.** La acción de exportar llama al generador existente de reportes con el `reportId` de la corrida y el resumen ya cargado como fallback. Las miniaturas usan las URLs de assets existentes y delegan la apertura al visor de evidencias. Alternativa rechazada: crear un generador de PDF o un lightbox propio en `execution`, que duplicaría código y se desincronizaría con `integral-pdf-reports`.

- **D4: Extraer el contexto de ejecución a un componente compartido de solo lectura.** La tarjeta de proyecto/MCP de `/tests` se refactoriza en un componente reutilizable con una variante compacta para `/`. Alternativa rechazada: copiar el markup en el dashboard, que ya produce dos fuentes de verdad para el mismo dato de configuración.

- **D5: Filtrado y orden local de resultados.** Los resultados ya viven en memoria en el hook, así que búsqueda, filtro, orden y agrupación se resuelven en el componente sin nuevos endpoints ni estado global. Alternativa rechazada: paginación server-side, inexistente para resultados en vivo. Si el volumen crece, se añadirá paginación local como extensión del mismo componente.

- **D6: Feature gating explícito para acciones de reporte.** Las acciones de ver reporte, PDF y descargas se habilitan solo cuando el módulo `reports` está disponible para el perfil, siguiendo el patrón de `use-reports`. Alternativa rechazada: mostrar las acciones siempre y dejar que falle la API, que es el comportamiento que ya se evita en otras features.

- **D7: Accesibilidad como parte del stream, no como capa posterior.** La consola se expone como región de registro anunciable, el progreso incluye su valor accesible y se añade una acción para limpiar logs. Alternativa rechazada: agrupar estos cambios en un change separado, porque obligaría a reeditar los mismos componentes dos veces.

- **D8: El contexto de la última corrida se guarda al lanzarla, no se reconstruye después.** Las opciones efectivamente enviadas en `run()` (entorno, Docker, workers, grep y cantidad de parámetros) se conservan en el mismo store por perfil, junto al `reportId`; la configuración del perfil aporta proyecto y detección de MCP. Así sobreviven al desmontaje de `RunControls` al navegar desde `/tests` a `/`. Si la corrida es anterior al change o se inició en otra sesión, se muestran solo los datos de configuración disponibles y el resto se omite.

## Risks / Trade-offs

- [El evento de finalización se pierde durante una desconexión y no llega `reportId`] → La acción de reporte no aparece; se muestra un estado explícito de «reporte no disponible» y se invita a consultar el historial en `/reports`. No se infiere un reporte por timestamp para evitar asociaciones erróneas.
- [`integral-pdf-reports` todavía está en progreso y su contrato puede cambiar] → El generador frontend ya contempla un fallback cuando falta el contrato de exportación; este change consume esa capa sin duplicarla y debe revalidarse cuando el change se cierre.
- [Resultados muy numerosos degradan el filtrado local] → El filtrado opera sobre la colección ya existente y no añade suscripciones; si se supera un volumen problemático, se incorpora paginación local sin cambiar el spec.
- [El módulo `reports` está deshabilitado en algunos perfiles] → Las acciones se ocultan o deshabilitan con una explicación, sin afectar consola ni resultados, según D6.
- [La extracción del componente de contexto toca `/tests`] → Se mantiene el comportamiento existente de esa pantalla y se cubre con verificación manual de regresión visual.
- [Las opciones de una corrida iniciada antes del change no están disponibles] → Según D8 se muestran solo los datos de configuración y se omite el resto, sin inventar valores.
- [El store compartido conserva datos al cambiar de perfil] → El store tiene una única entrada por `profileId` y se reinicia al cambiar de perfil activo, sin exponer corridas de otros perfiles.

## Migration Plan

No hay migración de datos ni cambios de contrato. El orden de implementación reduce dependencias:

1. Exponer `reportId`, `timestamp` y opciones de corrida, y fusionar resumen (D1, D2, D8).
2. Bloque de última corrida con gating y acciones (D3, D6).
3. Resultados explorables y evidencias (D5).
4. Franja de contexto compartida (D4, D8).
5. Estados y accesibilidad del stream (D7).

La reversión consiste en revertir los commits del change; no hay estado persistente que limpiar ni esquemas que migrar.
