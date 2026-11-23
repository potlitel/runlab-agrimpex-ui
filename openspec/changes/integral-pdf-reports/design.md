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
- Habilitar compartición de PDFs por WhatsApp y correo electrónico desde corrida y analítica, con Web Share API cuando haya soporte y fallbacks compatibles cuando no.
- Consumir un contrato de exportación normalizado y generar el PDF en frontend.
- Cubrir contenido integral confirmado: metadata, resumen/KPIs, detalle/tendencia, desglose, evidencias aplicables y pie.
- Mantener comportamiento degradado ante errores, datos vacíos, cancelaciones o módulo no disponible.

**Non-Goals:**
- Implementar el backend de exportación en este repo; solo definir el contrato esperado y la integración UI.
- Editor avanzado de plantillas PDF, branding configurable por usuario o envío automático por backend SMTP/WhatsApp Business.
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

### D6: Compartición con Web Share API + fallback
- **Decisión:** Usar `navigator.share`/`navigator.canShare` con archivo PDF cuando el navegador lo soporte; si no, usar fallbacks compatibles: `https://wa.me/?text=...` para WhatsApp y `mailto:?subject=...&body=...` para correo.
- **Rationale:** `wa.me` y `mailto:` no adjuntan archivos de forma confiable entre navegadores/plataformas; Web Share API permite compartir el archivo generado en dispositivos compatibles. El fallback mantiene la acción disponible con expectativa clara.
- **Alternativas:** envío por backend SMTP/WhatsApp Business (mayor alcance y control, pero agrega infraestructura, credenciales, privacidad y alcance fuera de este cambio); solo enlaces sin PDF (no cumple la necesidad de compartir el reporte).
- **UX:** acciones “Compartir por WhatsApp” y “Compartir por correo” en corrida y analítica. El mensaje/asunto incluye tipo de reporte, perfil, fecha y resumen breve; no incluye datos sensibles innecesarios.
- **Compatibilidad:** si no hay soporte de archivo, la UI genera/descarga el PDF y abre el fallback con aviso explícito de adjunto manual. Las cancelaciones del usuario se tratan como flujo no exitoso sin error bloqueante.

## Risks / Trade-offs

- [Contrato backend inexistente] → Encapsular cliente/tipos de exportación y mostrar estado claro “exportación no disponible” hasta que el endpoint exista; coordinar contrato antes de cerrar implementación.
- [Fidelidad de gráficos Recharts] → Hacer spike de render (SVG/canvas/re-render) antes de fijar librería; aceptar representación equivalente si conserva valores.
- [Evidencias pesadas o CORS] → Limitar/optimizar tamaño de imagen, manejar fallos por asset, considerar compresión; no bloquear todo el PDF por una imagen fallida.
- [PDF grande/lento en navegador] → Generar con indicador de progreso, ejecutar composición fuera del hilo principal si la librería lo permite, y mantener secciones opcionales.
- [Forma inconsistente de `byFile/timeline`] → Normalizar en payload backend; en frontend validar defensivamente y omitir sección con aviso si la forma es inválida.
- [Soporte desigual de Web Share API] → Detectar `navigator.share/canShare`; usar fallback `wa.me`/`mailto` con aviso claro.
- [Adjunto manual en fallback] → Informar explícitamente que el PDF se descargó o debe adjuntarse manualmente cuando el canal no soporte archivos.
- [Privacidad en mensajes prellenados] → Incluir solo resumen mínimo (tipo, perfil, fecha, totales) y evitar datos sensibles innecesarios.

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
- ¿El correo debe limitarse a `mailto:`/Web Share en esta fase, o se espera envío por backend SMTP más adelante?
- ¿WhatsApp debe ofrecer siempre opción directa `wa.me` además de Web Share cuando ambos estén disponibles?
