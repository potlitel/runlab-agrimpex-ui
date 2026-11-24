# Proposal

## Why

Las capturas generadas durante la ejecución de los tests no son fiables: muchas capturas declaradas (p. ej. `screenshot-pg1-heatmap-tooltip`, `I2-01-record-created`, `F1-02-after-save`) no aparecen en RunLab y, cuando se ven, no siempre muestran el estado que el test afirma. La causa es de extremo a extremo: los helpers del kit de Playwright adjuntan el PNG solo en memoria (`body`, sin `path`), el runner de la API solo publica adjuntos con `path` como `assetPath`, los puntos de captura usan `fullPage: true` sin esperas de estabilidad ni asserts del estado visible, y la UI recorta o deforma las imágenes al mostrarlas (miniaturas `object-cover`, PDF a 90×50 mm fijos). Es necesario cerciorarse de que cada captura indicada por un test se toma, se persiste y se muestra con fidelidad.

## What Changes

- Unificar la captura de evidencia en el kit de Playwright en un único helper que espere al estado validado, estabilice la página (animaciones, caret, fuentes/recursos), aplique opciones explícitas de formato/calidad/escala y adjunte el PNG con `path` en disco además de `body`, con un nombre determinista y trazable (test + paso + estado).
- Corregir los puntos de captura sospechosos detectados (`desaduanes-edit`, `desaduanes-create-flow`, `desaduanes-integration`, `profile-readonly-states`, tooltips de `profile-activity-heatmap`, `row-actions-parity`) para que la imagen se tome después de asserts visibles del estado descrito y no solo tras `waitForTimeout` o `toHaveURL`.
- Extender el runner de la API para persistir los adjuntos de imagen recibidos como `body` sin `path`: escribir el buffer en el directorio de assets del run, asignar `assetPath`, `contentType` y nombre trazable, y publicarlos en el reporte y en la galería de evidencias también cuando el test pasa.
- Mejorar la fidelidad de visualización en la UI: miniaturas sin recorte engañoso, visor con zoom y acceso a la imagen original, metadatos útiles de la captura (test/paso, estado, dimensiones) y preservación de la relación de aspecto y del formato en la sección de evidencias del PDF.
- Alinear la configuración de evidencia (`config.evidence`: modo, `fullPage`, y nuevas opciones de calidad) entre el perfil guardado, el runner y el kit, y añadir pruebas automatizadas del recorrido completo captura → asset → UI/PDF.
- Documentar el contrato de evidencia de captura y añadir una comprobación de integración que detecte capturas declaradas pero no persistidas.

## Non-goals

- No se incorpora comparación visual automática ni líneas base de imagen (`toHaveScreenshot` / visual regression). La precisión se entiende como correspondencia entre el estado validado por el test y la imagen mostrada en RunLab.
- No se cambia el almacenamiento subyacente de reportes ni la estructura de perfiles de la API.

## Capabilities

### New Capabilities

- `screenshot-capture-precision`: captura de evidencia en los tests Playwright: cuándo se toma (estado validado y estable), cómo se configura (formato, calidad, escala, fullPage) y cómo se nombra y adjunta para que sea trazable y persistible.
- `screenshot-evidence-delivery`: ciclo posterior en RunLab: persistencia de adjuntos de imagen en los assets del run, exposición en reportes y galería, y visualización/exportación fiel en la UI y el PDF.

### Modified Capabilities

Ninguna: el inventario de specs de este root está vacío; las exigencias relacionadas viven hoy como deltas en changes de otros repositorios y se modelan aquí como capacidades nuevas.

## Impact

- **Kit Playwright** (`playwright-kit-profesional`): `playwright.config.ts`, `fixtures/base.fixture.ts`, `tests/desaduanes/helpers/screenshot-helper.ts`, `tests/user-profile/helpers/profile-graphql-stub.ts` y los specs de desaduanes, perfil y row-actions listados arriba.
- **API RunLab** (`runlab-agrimpex-api`): `services/playwrightRunner.js` (normalización de adjuntos, `toAssetPath`, `publishFailureEvidence`, copia de assets) y `routes/errors.js`; contratos `ReportAttachment`, `ReportSummary.previewImage` y `ErrorImagesResponse`.
- **UI RunLab** (este repo): `src/features/errors/failure-evidence-page.tsx`, `src/features/reports/components/report-detail-sheet.tsx`, `src/features/reports/pdf/report-pdf.ts`, `src/features/settings/components/config-section.tsx` y `src/lib/api.ts`.
- **Contratos y endpoints**: `GET /reports/:id/assets/*`, `GET /errors/images`, `GET /errors/file?name=…`, `config.evidence` y el payload de exportación PDF; se conserva la compatibilidad con la evidencia ya generada.
- **Organización**: los artefactos OpenSpec se crean en el root de la UI, pero la implementación abarcará tres repositorios que deben versionarse por separado; no se prevén cambios rupturadores de API.
