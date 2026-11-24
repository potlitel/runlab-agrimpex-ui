# Tasks

## 1. Kit de Playwright: captura única, estable y trazable

- [x] 1.1 Crear un helper centralizado de captura con modos `viewport`/`full_page`/`element`, `animations: 'disabled'`, `caret: 'hide'`, opciones de formato/calidad y adjunto por `path` en `testInfo.outputPath`; verificar con una ejecución de prueba que el attachment del JSON incluye `path`, `contentType` real y nombre sin prefijos duplicados.
- [x] 1.2 Hacer que el helper registre la anotación `expected-screenshot` con el nombre lógico de cada captura; verificar que dicha anotación aparece en el reporte JSON de una corrida de prueba.
- [x] 1.3 Leer `imageFormat`, `imageQuality` y `scale` desde variables de entorno con valores por defecto documentados; verificar que una ejecución con `imageFormat=jpeg` genera un archivo `.jpg` con la calidad configurada.
- [x] 1.4 Migrar los puntos de captura de `desaduanes-edit`, `desaduanes-create-flow` y `desaduanes-integration` para capturar después de aserciones visibles del estado descrito; verificar ejecutando los tres specs y revisando que cada imagen muestra el estado que su nombre indica.
- [x] 1.5 Migrar `profile-readonly-states`, `profile-activity-heatmap`, `profile-readonly-navigation` y `row-actions-parity` al helper, usando encuadre de viewport/elemento para tooltips y estados efímeros; verificar que los adjuntos generados contienen el elemento validado.
- [x] 1.6 Documentar el contrato del helper y los defaults en `README.md`/`AGENTS.md` del kit; verificar que los ejemplos documentados se pueden ejecutar sin cambios adicionales.

## 2. API de RunLab: persistencia y publicación de la evidencia

- [x] 2.1 Ampliar la normalización de adjuntos en `services/playwrightRunner.js` para escribir imágenes `body`-only en `<runAssetsDir>/attachments/` y rellenar `assetPath`, `contentType` y nombre; verificar con un test unitario que usa un attachment sin `path`.
- [x] 2.2 Publicar capturas de tests `passed`, `failed` y `error` con `status`, `source` y metadatos, conservando screenshot/trace/vídeo de fallo; verificar con una corrida de prueba que `/errors/images` y el JSON del reporte incluyen capturas de tests exitosos.
- [x] 2.3 Comparar las anotaciones `expected-screenshot` con los adjuntos reales y registrar como incidencia de integridad las capturas declaradas y no generadas; verificar con una corrida donde un test declara una captura que no adjunta.
- [x] 2.4 Validar la firma de bytes de los adjuntos declarados como imagen y registrar incidencias sin abortar la corrida; verificar con un test unitario que inyecta un adjunto corrupto junto a uno válido.
- [x] 2.5 Inyectar las opciones de evidencia del perfil como variables de entorno del proceso de Playwright y registrar los valores efectivos; verificar que el log de una corrida muestra los mismos valores guardados en el perfil.
- [x] 2.6 Documentar el contrato ampliado de adjuntos y evidencia en la API; verificar que la documentación coincide con los campos devueltos por `/errors/images` y el reporte JSON.

## 3. UI de RunLab: visualización fiel y configuración

- [x] 3.1 Extender `EvidenceConfig` y `EvidenceItem` en `src/types/contract.ts` con formato, calidad, escala, estado/paso y dimensiones opcionales; verificar que `tsc`/typecheck y los tests de contrato pasan.
- [x] 3.2 Añadir los nuevos campos al panel de evidencias de `config-section.tsx` y verificar que `POST /config` los persiste y que el perfil los devuelve tras recargar.
- [x] 3.3 Ajustar la galería de fallos y el detalle de reporte para conservar la relación de aspecto (`object-contain`), permitir zoom y descarga del original y mostrar metadatos de la captura; verificar manualmente en `/errors` y en el detalle con una captura de prueba.
- [x] 3.4 Corregir `src/features/reports/pdf/report-pdf.ts` para calcular el recuadro según dimensiones reales, respetar el formato (conversión de WebP), añadir timeout al fetch y codificar `assetPath`; verificar con tests que inyectan un data URL de imagen y comprueban que no aparece el placeholder.
- [x] 3.5 Añadir tests de regresión para adjuntos sin `assetPath`, formatos distintos de PNG/JPEG y evidencia faltante; verificar que `npm test` pasa sin fallos nuevos.

## 4. Verificación integral y cierre

- [x] 4.1 Ejecutar un perfil con `screenshot: always` y `fullPage: true` y verificar el recorrido completo: anotaciones y adjuntos en el JSON → assets persistidos → `/errors/images` → detalle de reporte → PDF con proporciones correctas.
- [x] 4.2 Verificar que una captura declarada pero no generada se señala como incidencia y que los reportes generados antes del cambio siguen siendo legibles en galería, detalle y PDF.
- [x] 4.3 Documentar los valores por defecto, el contrato de nombres y el procedimiento de rollback por repositorio; verificar que la documentación existe y es coherente con los tres repositorios.

## Workflow follow-up

- Revisar y aprobar los artefactos antes de aplicar el change.
- Archivar el change una vez completada la verificación integral.
