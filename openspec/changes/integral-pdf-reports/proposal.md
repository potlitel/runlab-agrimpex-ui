# Proposal

## Why

La vista de reportes ya permite consultar historial, analítica y descargar JSON/HTML por corrida, pero no ofrece un entregable PDF integral para compartir o archivar resultados. Se necesitan dos exportaciones PDF: una por corrida con detalle completo y otra analítica agregada, con generación en frontend a partir de un payload normalizado provisto por backend (C3a).

## What Changes

- Agregar exportación **PDF por corrida** desde el detalle/historial de reportes, con contenido integral: portada/metadata, resumen ejecutivo, resultados por test, evidencias (imágenes incluidas; otros adjuntos listados) y pie de generación.
- Agregar exportación **PDF analítico agregado** desde la vista de reportes, con contenido integral: portada/alcance, KPIs, tendencia, desglose por archivo y corridas recientes.
- Implementar UX **U3**: acción principal de descarga integral en un clic y acción secundaria “Personalizar PDF…” para elegir secciones antes de generar.
- Definir y consumir un contrato de exportación normalizado en backend (dependencia externa a este repo) para que el frontend renderice el PDF final sin raspar el DOM.
- Agregar la capacidad de renderizado PDF en frontend (nueva dependencia de librería PDF) y el manejo de gráficos/evidencias para composición del documento.

## Capabilities

### New Capabilities
- `reports-pdf-export`: exportación de reportes PDF integrales por corrida y analíticos agregados, con payload normalizado backend y renderizado/composición en frontend.

### Modified Capabilities
- _(ninguna — no se modifican requisitos de specs existentes; no existen specs principales en `openspec/specs/`)_

## Impact

- **Código UI:** `src/features/reports/` (acciones de exportación en listado/detalle/analítica, diálogo de personalización, estado de generación), `src/lib/api.ts`/tipos de contrato para endpoints de exportación.
- **APIs esperadas (backend, dependencia):** endpoints de exportación normalizada, propuestos como `GET /api/reports/:id/export` y `GET /api/reports/analytics/export`; deben normalizar `timeline`, `byFile` y adjuntos para render.
- **Dependencias:** nueva librería de generación PDF en frontend; manejo de imágenes remotas/assets y representación de gráficos Recharts en PDF.
- **Riesgos:** fidelidad de gráficos/evidencias, tamaño de PDFs con imágenes, CORS/acceso a assets, disponibilidad mientras el contrato backend no exista.
