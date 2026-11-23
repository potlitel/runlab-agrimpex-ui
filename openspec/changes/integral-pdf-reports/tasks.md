# Tasks

## 1. Contrato y base de exportación

- [x] 1.1 Definir tipos TypeScript para los payloads de exportación por corrida y analítico (metadata, secciones, summary, tests, attachments normalizados, timeline/byFile/recentRuns) y verificar que `npm run build` compila sin errores de tipos.
- [x] 1.2 Agregar en `src/lib/api.ts` los métodos/URLs del contrato esperado (`reportsApi.exportRun`/`exportAnalytics` o equivalente) encapsulando los endpoints `GET /api/reports/:id/export` y `GET /api/reports/analytics/export`; verificar con pruebas unitarias o mocks que la URL y el manejo de errores `ApiError` son correctos.
- [x] 1.3 Documentar en el diseño o README técnico del cambio la dependencia de backend y la forma mínima del payload esperado; verificar que la documentación coincide con los tipos definidos.

## 2. Fundación de generación PDF

- [x] 2.1 Evaluar e instalar la librería PDF frontend elegida para C3a (soporte de tablas, imágenes, paginación y composición programática) y registrar la justificación en `design.md` o nota del cambio; verificar que la dependencia instala y el proyecto compila.
- [x] 2.2 Implementar un servicio/utilidad de generación PDF con entrada por payload normalizado y opciones de secciones, incluyendo portada, pie y manejo de progreso/estado; verificar con una prueba unitaria o smoke test que genera un archivo PDF válido para un payload mínimo.
- [x] 2.3 Implementar la estrategia de render para gráficos/tendencia compatible con la librería elegida (SVG/canvas/re-render equivalente) y verificar con una prueba/render de ejemplo que la sección de tendencia aparece con valores representativos.

## 3. Exportación PDF por corrida

- [x] 3.1 Implementar la generación del PDF por corrida con secciones confirmadas: portada/metadata, resumen ejecutivo, resultados por test, evidencias imagen, adjuntos no imagen listados y pie; verificar con prueba de integración/unitaria que un payload de corrida produce las secciones esperadas.
- [x] 3.2 Integrar acción principal “Exportar PDF” en `ReportDetailSheet` y acción de exportación en el historial (`ReportsList`) con estado de carga y manejo de errores; verificar manualmente o con test UI que ambas acciones disparan la descarga y muestran error comprensible ante fallo.
- [x] 3.3 Manejar evidencias remotas/ausentes (CORS, asset no disponible, adjunto no imagen) con degradación controlada; verificar con casos de prueba que un asset fallido no bloquea la generación del PDF completo.

## 4. Exportación PDF analítico agregado

- [x] 4.1 Implementar la generación del PDF analítico con secciones confirmadas: portada/alcance, KPIs, tendencia, desglose por archivo y corridas recientes; verificar con prueba de integración/unitaria que un payload analítico produce las secciones esperadas.
- [x] 4.2 Integrar acción principal “Exportar PDF” en la vista de analítica/reportes con estado vacío claro cuando no hay datos; verificar manualmente o con test UI que la exportación se deshabilita/informa cuando no hay analítica y funciona cuando hay datos.
- [x] 4.3 Normalizar defensivamente `timeline`/`byFile` en el consumidor frontend antes del render; verificar con pruebas que formas inesperadas no rompen la exportación y la sección afectada se omite con aviso.

## 5. Personalización U3 y disponibilidad

- [x] 5.1 Implementar el diálogo “Personalizar PDF…” para corrida y analítica, permitiendo elegir secciones aplicables y manteniendo la acción principal como exportación integral por defecto; verificar con test UI que la selección de secciones afecta el PDF generado.
- [x] 5.2 Aplicar gating de disponibilidad: ocultar/deshabilitar acciones PDF cuando el módulo `reports` no está disponible o el acceso es rechazado, reutilizando el comportamiento degradado existente; verificar con test UI/caso simulado de 403/feature deshabilitada.
- [x] 5.3 Agregar cobertura de pruebas para los flujos críticos de exportación (éxito, error de payload, módulo no disponible, personalización) y verificar que la suite relevante pasa.

## 6. Verificación e integración

- [x] 6.1 Ejecutar `npm run lint`, pruebas relevantes y `npm run build`; verificar que finalizan sin errores.
- [x] 6.2 Validar manualmente con backend/contrato disponible: exportación PDF por corrida desde detalle e historial, exportación analítica, personalización U3, evidencias y estados de error; verificar que los archivos descargados corresponden al contenido confirmado.

## Workflow follow-up

- Confirmar con backend el nombre final de endpoints y la forma exacta del payload de exportación antes de cerrar implementación.
- Archivar el cambio cuando la implementación y validación estén completas.
