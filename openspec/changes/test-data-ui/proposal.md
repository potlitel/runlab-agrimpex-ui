## Why

Las suites de pruebas pueden apoyarse en datos externos (TXT/JSON) y el backend ya expone su lectura y gestión, pero la vista **Datos de prueba** es un placeholder; la UI debe facilitar la consulta y edición de estos datos.

## What Changes

- Visualizar datos TXT parseados desde la carpeta configurada (`/txtdata`) en formato tabular, con manejo de estado no configurado/errores.
- Explorar y editar archivos JSON (`/jsondata/tree`, `GET/POST /jsondata/file`) y gestionar snapshots/perfiles de datos por archivo (`/jsondata/snapshots` list/save/delete).
- Presentar la vista de forma unificada (p. ej. secciones/pestañas por fuente) respetando feature flags `txtData` y `jsonData`.

## Capabilities

### New Capabilities
- `test-data-ui`: exploración y gestión de datos de prueba en formatos TXT y JSON, incluyendo snapshots.

### Modified Capabilities
_(ninguna — no existen specs previas; no hay cambios de requisitos a nivel de spec existente)_

## Impact

- **Código UI:** `src/routes/data.tsx` y componentes de árbol/editores JSON, gestión de snapshots y tabla de datos TXT.
- **APIs:** `/api/txtdata`, `/api/jsondata/tree`, `/api/jsondata/file` (GET/POST), `/api/jsondata/snapshots` (GET/POST/DELETE).
- **Dependencias:** `profile-session-ui`, `contract-client`; usa rutas de configuración de datos definidas en Ajustes/Config.
