# Design

## Context

La vista de reportes (`src/features/reports/`) ya consume `reportsApi.list/get/analytics/delete` y ofrece descargas JSON/HTML por corrida mediante URLs directas al backend. No existe generación PDF ni dependencias PDF en el frontend. Los datos actuales incluyen resúmenes, detalle por test, adjuntos/assets y analítica con `timeline`/`byFile` tipados como registros genéricos. Ver `proposal.md` para motivación y alcance.

Restricciones relevantes:
- Este repo es frontend; el render final PDF se decide en frontend (C3a), pero el payload normalizado es una dependencia de backend.
- La UI ya maneja disponibilidad por feature `reports` y errores de API.
- Los gráficos de analítica se renderizan con Recharts; las evidencias se sirven por `reportsApi.assetUrl`.

## Goals / Non-Goals

**Goals:**
- Habilitar exportación PDF integral por corrida y analítica agregada con UX U3 (descarga directa + personalizar secciones).
- Consumir un contrato de exportación normalizado y generar el PDF en frontend.
- Cubrir contenido integral confirmado: metadata, resumen/KPIs, detalle/tendencia, desglose, evidencias aplicables y pie.
- Mantener comportamiento degradado ante errores, datos vacíos o módulo no disponible.

**Non-Goals:**
- Implementar el backend de exportación en este repo; solo definir el contrato esperado y la integración UI.
- Editor avanzado de plantillas PDF, branding configurable por usuario o programación/envío automático de PDFs.
- Cambiar el significado de métricas existentes de reportes/analítica.

## Decisions

### D1: Arquitectura C3a con payload normalizado
- **Decisión:** El frontend solicita un payload normalizado de exportación al backend y genera el PDF localmente.
- **Rationale:** Separa datos/autorización (backend) de composición visual (frontend), evita raspar DOM y permite control de secciones en UI.
- **Alternativas:** C3b (vista imprimible) descartada por dependencia del navegador y menor control; C3c (backend renderiza) descartada por mover el render final fuera de este repo.

### D2: Contrato de exportación esperado
- **Decisión:** Definir endpoints esperados `GET /api/reports/:id/export` y `GET /api/reports/analytics/export`, retornando JSON normalizado para render.
- **Rationale:** Mantiene el namespace `/reports` existente y da una forma estable para ambos PDFs.
- **Alternativas:** Reusar solo endpoints actuales; descartado porque `byFile/timeline` son genéricos y la composición integral requiere forma explícita para exportación.
- **Contrato mínimo esperado:**
  - **Común:** `type`, `generatedAt`, `profile` (id/nombre si disponible), `sections` disponibles/aplicadas, `source`.
  - **Por corrida:** `report` (id, timestamp), `summary`, `tests[]` (id, status, duration, errorMsg, output, attachments normalizados), `assets`/referencias resolubles.
  - **Analítico:** `summary`/KPIs, `timeline[]` normalizado, `byFile[]` normalizado, `recentRuns[]` opcional.
- **Tipos frontend:** `src/types/contract.ts` define `ReportRunExportPayload`, `ReportAnalyticsExportPayload`, secciones y filas normalizadas como contrato esperado C3a; `src/lib/api.ts` expone `reportsApi.exportRun(id)` y `reportsApi.exportAnalytics()`.
- **Nota:** La forma final debe acordarse con backend; el frontend debe encapsular el mapeo en tipos/cliente API.

### D3: UX U3 de exportación
- **Decisión:** Botón principal “Exportar PDF” (integral por defecto) y acción secundaria “Personalizar PDF…” con diálogo de secciones.
- **Rationale:** Cubre el caso común en un clic y conserva flexibilidad C3.
- **Alternativas:** U1 descartada por poca flexibilidad; U2 descartada por agregar fricción al caso común.
- **Ubicación:** detalle de corrida y acciones de historial para PDF por corrida; bloque/header de analítica para PDF analítico.

### D4: Renderizado PDF en frontend
- **Decisión:** Usar `jspdf` + `jspdf-autotable` para la generación C3a en frontend.
- **Rationale:** Permite composición programática, tablas con paginación, inserción de imágenes/base64, control de páginas/pies y descarga directa del binario; encaja bien con payloads normalizados y no depende de capturar el DOM existente.
- **Alternativas:** `@react-pdf/renderer` (declarativo, pero integra peor con el flujo imperativo actual y requiere adaptar gráficos), `pdfmake` (tablas simples, menos control fino para evidencias/layout mixto), captura HTML/canvas completa (frágil para paginación y fidelidad). La tendencia/analytics se re-renderiza como gráfico simple dentro del PDF en lugar de capturar Recharts desde el DOM.

### D5: Gráficos y evidencias
- **Decisión:** Tratar gráficos y evidencias como recursos de render con degradación controlada.
- **Rationale:** Son parte del valor integral, pero son la principal fuente de fragilidad.
- **Enfoque:** convertir gráfico/timeline a representación compatible con la librería elegida; cargar evidencias imagen como datos renderizables cuando sea posible; adjuntos no imagen se listan como referencias. Si un asset falla, el PDF se genera con placeholder/aviso de asset no disponible.

## Risks / Trade-offs

- [Contrato backend inexistente] → Encapsular cliente/tipos de exportación y mostrar estado claro “exportación no disponible” hasta que el endpoint exista; coordinar contrato antes de cerrar implementación.
- [Fidelidad de gráficos Recharts] → Hacer spike de render (SVG/canvas/re-render) antes de fijar librería; aceptar representación equivalente si conserva valores.
- [Evidencias pesadas o CORS] → Limitar/optimizar tamaño de imagen, manejar fallos por asset, considerar compresión; no bloquear todo el PDF por una imagen fallida.
- [PDF grande/lento en navegador] → Generar con indicador de progreso, ejecutar composición fuera del hilo principal si la librería lo permite, y mantener secciones opcionales.
- [Forma inconsistente de `byFile/timeline`] → Normalizar en payload backend; en frontend validar defensivamente y omitir sección con aviso si la forma es inválida.

## Migration Plan

1. Acordar contrato de exportación con backend (payload y errores).
2. Agregar tipos/cliente API de exportación y feature gating.
3. Implementar generador PDF por corrida y analítico con UX U3.
4. Validar con reportes reales, evidencias y analítica vacía/poblada.
5. Rollback: deshabilitar acciones de exportación PDF por feature flag/configuración de UI sin afectar descargas JSON/HTML existentes.

## Open Questions

- Nombre final y forma exacta de los endpoints de exportación backend: ¿`/export` dedicado o query parameter sobre recursos existentes?
- Política de adjuntos no imagen en PDF: ¿solo listar, o incluir enlace descargable cuando el visor lo soporte?
- ¿El PDF analítico debe respetar filtros/rango de fechas si la UI los incorpora en el futuro? (por ahora no existen filtros explícitos en la vista actual).
