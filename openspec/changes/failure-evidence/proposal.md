## Why

Las fallas de ejecución generan evidencias visuales en el proyecto, pero la vista **Evidencia de fallos** es un placeholder; el backend ya lista y sirve estas imágenes y la UI debe facilitar su inspección para diagnóstico.

## What Changes

- Consultar y mostrar el listado de imágenes de error (`/errors/images`) con metadatos (nombre, fecha, tamaño) y estados `configured`/`missing`.
- Permitir visualizar imágenes servidas por el backend (`/errors/image?name=`) en galería/visor.
- Manejar estados vacíos, carpeta no configurada/inexistente y errores de carga.
- Respetar el feature flag `errorImages`.

## Capabilities

### New Capabilities
- `failure-evidence-ui`: exploración y visualización de evidencias gráficas de fallos de pruebas.

### Modified Capabilities
_(ninguna — no existen specs previas; no hay cambios de requisitos a nivel de spec existente)_

## Impact

- **Código UI:** `src/routes/errors.tsx` y componentes de galería/visor de imágenes.
- **APIs:** `/api/errors/images`, `/api/errors/image`.
- **Dependencias:** `profile-session-ui`, `contract-client`; relación contextual con ejecuciones/reportes.
