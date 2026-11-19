## Why

La ejecución y configuración de pruebas dependen de variables y entornos, pero la vista **Entornos** es un placeholder; el backend ya permite gestionar archivos `.env` del proyecto y conjuntos de variables guardados por perfil, y la UI debe exponer estas capacidades.

## What Changes

- Listar y editar archivos `.env` del proyecto (`/env/files`, `GET/POST /env`) mostrando/actualizando variables (clave/valor/comentarios) de forma segura.
- Gestionar entornos guardados por perfil (CRUD y renombrado) vía `/profiles` (módulo de variables del perfil activo).
- Permitir seleccionar/usar estos entornos o archivos como fuente de parámetros al preparar ejecuciones (integración con el flujo de `tests/run`).
- Respetar el feature flag `variables` y manejar errores/estados vacíos.

## Capabilities

### New Capabilities
- `environment-ui`: gestión de variables de entorno (`.env`) y entornos guardados por perfil para la ejecución de pruebas.

### Modified Capabilities
_(ninguna — no existen specs previas; no hay cambios de requisitos a nivel de spec existente)_

## Impact

- **Código UI:** `src/routes/env.tsx` y componentes de editor de variables, selector de archivos `.env` y gestión de entornos nombrados.
- **APIs:** `/api/env/files`, `/api/env` (GET/POST, query `file`), `/api/profiles` (GET, POST `/:name`, PATCH `/:name/rename`, DELETE `/:name`).
- **Dependencias:** `profile-session-ui`, `contract-client`; provee insumos a `execution-dashboard`.
