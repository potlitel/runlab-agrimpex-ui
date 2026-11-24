# Design

## Context

Ver `proposal.md` para la motivación. Estado observado que condiciona el diseño:

- El kit de Playwright captura con `page.screenshot({ fullPage: true })` en tres helpers distintos y adjunta el PNG solo en memoria (`testInfo.attach(name, { body, contentType: 'image/png' })`), sin `path`. No hay `toHaveScreenshot`, `test.step`, ni opciones de estabilización (`animations`, `caret`, `scale`, `quality`).
- Varios puntos de captura usan solo `waitForTimeout` o `toHaveURL` (desaduanes) o comprueban un tooltip antes de una captura `fullPage` que lo puede desplazar (heatmap).
- El runner de la API (`playwrightRunner.js`) normaliza adjuntos con `path` → `assetPath`; los adjuntos `body` quedan con `path: ''` y no generan `assetPath`, por lo que no aparecen en `summary.previewImage`, en el detalle ni en la galería. Además, `publishFailureEvidence()` solo publica tests `failed`/`error`.
- La UI consume assets por URL (`/reports/:id/assets/*`, `/errors/file?name=…`), recorta miniaturas con `object-cover`, no muestra dimensiones y, en el PDF, incrusta cada imagen en un recuadro fijo de 90×50 mm con `addImage(..., 'FAST')` y detección de formato solo PNG/JPEG.
- Los artefactos OpenSpec viven en este repo, pero el cambio abarca tres repositorios con despliegue y versionado independientes.

## Goals / Non-Goals

**Goals:**

- Una única forma de declarar, estabilizar, nombrar y adjuntar capturas en el kit, que produzca un archivo persistible y trazable al resultado del test.
- Que el runner persista todos los adjuntos de imagen (incluidos los de tests que pasan) y detecte capturas declaradas que no se generaron.
- Que la UI y el PDF muestren la imagen real, sin recortes engañosos ni deformaciones, con metadatos que permitan identificar test y paso.
- Que la configuración de evidencia del perfil se propague de forma inequívoca a runner y kit.

**Non-Goals:**

- No se añade comparación visual automática ni líneas base (`toHaveScreenshot`).
- No se rediseña el almacenamiento de reportes ni el modelo de perfiles.
- No se modifica el comportamiento de captura automática de fallo de Playwright salvo en lo necesario para no duplicar evidencia.

## Decisions

### D1. Un helper de captura con archivo en disco y `attach` por `path`

Se centraliza la captura en un helper del kit que: (a) recibe el nombre lógico del estado, (b) espera a que el estado validado esté visible, (c) llama a `page.screenshot({ path: testInfo.outputPath(...), animations: 'disabled', caret: 'hide', scale, timeout, type, quality })`, y (d) hace `testInfo.attach(nombre, { path, contentType })`.

**Rationale:** `testInfo.attach` con `path` hace que el reporter JSON incluya una ruta real, que es exactamente lo que el runner necesita para calcular `assetPath`. Mantener `body` como único canal es la causa raíz del cambio.

**Alternativas consideradas:** seguir adjuntando `body` y codificar en base64 en el runner (rompe el contrato del reporter y obliga a parsear el attachment); guardar un manifest propio separado del reporte JSON (duplica fuentes de verdad).

### D2. Modos de captura por estado, no `fullPage` global

El helper admite `viewport`, `full_page` y `element`. Para tooltips, estados de carga y detalles de interfaz se usa `viewport` o `element`; `full_page` se reserva para los casos que declaran explícitamente contexto completo.

**Rationale:** una captura `fullPage` puede reflujar la página y desplazar o descartar portales efímeros; el nombre de la captura debe determinar el encuadre.

**Alternativas consideradas:** mantener `fullPage: true` y añadir un `clip` manual (depende de coordenadas frágiles); comparar píxeles (fuera de alcance).

### D3. Calidad: PNG sin pérdida por defecto, JPEG opcional

`animations: 'disabled'`, `caret: 'hide'` y `scale: 'css'` son los valores por defecto. El formato es PNG sin pérdida; se permite JPEG con `quality` configurable para capturas de página completa grandes. No se cambia `deviceScaleFactor` del contexto.

**Rationale:** la legibilidad del texto es prioritaria y el tamaño de las capturas fullPage es el principal coste; un ajuste por formato evita complejidad en el runner y en la UI.

**Alternativas consideradas:** WebP por defecto (mejor compresión, pero soporte irregular en jsPDF y en visores); escala por dispositivo (cambia las dimensiones esperadas y la comparación con el viewport).

### D4. Declaración de capturas esperadas mediante anotaciones del test

Cada test que declara una captura añade una anotación `expected-screenshot` con el nombre lógico. El runner compara las anotaciones con los adjuntos realmente recibidos y expone las ausencias como incidencia de integridad.

**Rationale:** las anotaciones viajan en el JSON de Playwright y permiten detectar el caso que motiva este cambio —"el test indica una captura que no se tomó"— sin un manifest paralelo.

**Alternativas consideradas:** convención de prefijo en los nombres (no detecta capturas omitidas); parsear el código fuente de los specs (frágil y lento).

### D5. Normalización en el runner y publicación por resultado

En `playwrightRunner.js` se amplía la normalización: si un adjunto de imagen no tiene `path` pero trae `body`, se escribe en `<runAssetsDir>/attachments/<nombre-seguro>.<ext>` y se rellenan `path`, `assetPath`, `contentType` y nombre. La publicación de evidencia deja de estar restringida a fallos: se publican capturas de tests `passed`, `failed` y `error`, conservando `status`, `source` y metadatos. Las imágenes fallidas de Playwright siguen publicándose igual.

**Rationale:** es el punto donde el JSON se convierte en contrato de RunLab; arreglarlo aquí beneficia a cualquier kit que adjunte imágenes en memoria.

**Alternativas consideradas:** cambiar todos los tests para escribir en disco (no cubre kits antiguos ni adjuntos de terceros); publicar solo en el detalle del reporte (no satisface la visibilidad en la galería).

### D6. Configuración propagada por variables de entorno del runner

Los campos nuevos de `config.evidence` (`imageFormat`, `imageQuality`, `scale`) se añaden al contrato de la UI, se guardan con el perfil y el runner los inyecta como variables de entorno en el proceso de Playwright. El helper las lee con valores por defecto documentados.

**Rationale:** el runner ya construye un config envolvente y ya inyecta variables de entorno; no hace falta un nuevo canal de comunicación entre UI, API y kit.

**Alternativas consideradas:** pasar opciones por la línea de comandos de Playwright (no soportado para opciones de screenshot); leer `config.json` directamente desde el kit (acopla el kit al layout de perfiles de la API).

### D7. Fidelidad en UI y PDF

La UI usa `object-contain` y conserva la proporción en miniaturas y visor, añade zoom y descarga del original, y muestra metadatos devueltos por la API (incluidas dimensiones cuando existan). En el PDF se calcula el recuadro a partir de las dimensiones reales, se respeta el formato real (incluida conversión de WebP a PNG antes de `addImage`) y se mantiene el placeholder solo para assets no disponibles.

**Rationale:** el recuadro fijo 90×50 y el mapeo binario PNG/JPEG son la causa de la deformación y de los placeholders erróneos.

**Alternativas consideradas:** regenerar miniaturas en el backend (fuera de alcance y añadiría dependencias); incrustar siempre JPEG (pierde texto pequeño).

## Risks / Trade-offs

- [Muchas capturas de tests que pasan aumentan el tamaño de la galería y del disco] → agrupar por corrida/resultado, permitir filtrar por `status` y `source`, y usar JPEG configurable para `full_page`.
- [Cambiar el encuadre por defecto modifica el aspecto de evidencia histórica] → mantener `full_page` como valor por defecto del perfil existe hoy y documentar el cambio; los reportes antiguos siguen siendo legibles.
- [Un adjunto con `body` corrupto rompe la normalización] → validar la firma de bytes de imagen y registrar la incidencia sin abortar la corrida.
- [Las anotaciones no aparecen en versiones antiguas del reporter JSON] → verificar la versión de Playwright en el runner y degradar la comprobación de integridad a "no disponible" sin marcar falsos positivos.
- [WebP o formatos nuevos fallan al incrustarse en el PDF] → convertir a PNG en cliente y conservar el placeholder solo si la conversión falla.
- [Variables de entorno del perfil no llegan al contenedor] → añadir una comprobación de arranque que registre los valores efectivos y una prueba end-to-end con un perfil de evidencia.
- [Cambios en tres repositorios se despliegan desincronizados] → las rutas nuevas son aditivas y los valores ausentes caen en los defaults actuales; cada repo se despliega de forma independiente.

## Migration Plan

1. **Kit de Playwright**: introducir el helper y migrar los call sites listados en el proposal; conservar los helpers antiguos como envoltorios temporalmente para no romper suites no migradas. Verificar con una ejecución local que los adjuntos tienen `path` y nombre trazable.
2. **API**: ampliar la normalización y la publicación de evidencia; mantener compatibilidad con reportes ya persistidos (adjuntos con `path` existente). Verificar con una corrida de prueba que un adjunto `body` obtiene `assetPath` y aparece en `/errors/images`.
3. **UI**: extender el contrato `EvidenceConfig`/`EvidenceItem`, ajustar galería, detalle, PDF y panel de ajustes. Verificar con tests de `report-pdf` y una revisión manual del visor y del PDF.
4. **Integración**: ejecutar un perfil con `screenshot: always` y `fullPage: true`, comprobar que todas las capturas declaradas están presentes en el JSON, en los assets, en el detalle y en el PDF.
5. **Rollback**: revertir por repositorio; los reportes generados con el nuevo esquema siguen siendo legibles porque los campos son opcionales y la UI mantiene los fallbacks existentes.

## Open Questions

Ninguna que cambie el alcance o la estructura de tareas; las decisiones pendientes son de implementación y quedan recogidas en `Risks / Trade-offs`.
