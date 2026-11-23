# Proposal

## Why

La ruta `/` expone hoy solo la consola y la tabla de resultados, mientras que la selección, los parámetros y el lanzamiento viven en `/tests`. El motor en vivo construido en `execution-dashboard` funciona, pero el monitor no ofrece el reporte generado, descarta el `reportId` que llega por socket, recalcula el resumen perdiendo campos disponibles e ignora las evidencias que ya se descargan con cada resultado. El usuario ve el mensaje «Inicia una corrida para ver el progreso» sin una acción local contextuada ni una forma de cerrar el ciclo hasta el reporte.

## What Changes

- Mostrar un resumen fidedigno de la corrida activa o de la última finalizada, incorporando errores, omitidos, duración y tasa de éxito, y conservando los datos del reporte cuando estén disponibles.
- Exponer el `reportId` recibido en `execution:completed` y `execution:aborted` y ofrecer acciones de «última corrida»: ver reporte, exportar PDF reutilizando el generador existente y descargar JSON/HTML, respetando el feature flag del módulo `reports`.
- Volver accionable la tabla de resultados: búsqueda por test, filtro por estado, orden por fallos o duración, agrupación por archivo, expansión de la salida completa y acceso a las evidencias adjuntas.
- Añadir una franja compacta de contexto y prerrequisitos del perfil activo (proyecto, entorno resuelto, Docker, workers/grep, MCP) reutilizando la tarjeta de configuración de Tests, en modo solo lectura.
- Mantener la separación Dashboard/Tests: `/` no inicia ni aborta corridas; el enlace a `/tests` continúa siendo la acción de ejecución.
- Completar los estados vacíos, de carga y de error del monitor y mejorar la accesibilidad del flujo de logs y progreso en vivo.

## Capabilities

### New Capabilities

- `execution-dashboard`: comportamiento de monitoreo en vivo y post-ejecución de la ruta `/`, cubriendo resumen fidedigno, resultados accionables, contexto de corrida y acceso al reporte y las evidencias generadas. El spec maestro todavía no existe porque los changes previos no fueron archivados ni sincronizados; este change agrega requirements nuevas bajo la misma capability, sin reutilizar los nombres de requirements del change `execution-dashboard`.

### Modified Capabilities

- Ninguna. No hay specs maestras registradas en `openspec list --specs`.

## Impact

- **Código:** `src/features/execution/dashboard.tsx`, `src/features/execution/use-execution.ts`, `src/features/execution/components/execution-console.tsx`, `src/features/execution/components/results-table.tsx` y la extracción reutilizable de la tarjeta de configuración en `src/features/execution/tests-page.tsx`.
- **APIs y socket:** sin endpoints ni eventos nuevos. Se aprovechan `reportsApi.get/list`, `reportsApi.assetUrl`, `reportsApi.exportRun` y los links de descarga ya definidos en `src/lib/api.ts`, además del `reportId` de los eventos `execution:completed` y `execution:aborted`.
- **Dependencias:** reutilización del generador PDF de `src/features/reports/pdf/export-reports.ts` (change `integral-pdf-reports` aún en progreso), del visor de evidencias de `src/features/errors` y del feature gating de `src/features/reports/use-reports.ts`. No se modifica `contract-client` ni la capa de socket.
- **Fuera de alcance:** ejecutar o abortar desde `/`, reimplementar analítica histórica, automatizar la correlación avanzada de evidencias y persistir configuraciones de corrida.
