## Why

La correcta operación del dashboard requiere configurar el proyecto, flags y servicios auxiliares, pero la vista **Ajustes** es un placeholder; el backend ya expone endpoints de configuración, features, automatización, administración de perfiles y actualización del sistema que deben ser accesibles desde la UI.

## What Changes

- Implementar configuración del proyecto (`/config`): edición/guardado, validación, detección de `.env` y exploración de rutas (projectPath, envPath, comandos, rutas de datos/evidencias, Selenium, etc.).
- Gestionar feature flags (`/features`) para habilitar/deshabilitar módulos condicionados por el backend.
- Proveer UI de automatización/entorno del repositorio de pruebas (`/automation`): config, chequeos, instalación/actualización, ramas, estado, setup de venv/deps, apply; con visualización de progreso/logs y eventos (`automation:*`, `env:*`).
- Incluir administración completa de perfiles del dashboard (`/profile-admin`) en Ajustes (complementando o integrando el selector global definido en `profile-session-ui`).
- Exponer estado y disparo de actualizaciones del sistema (`/system/updates`, `/system/update` con token) y mostrar eventos `system:update`, respetando las restricciones de seguridad del backend.

## Capabilities

### New Capabilities
- `settings-ui`: configuración del proyecto, gestión de módulos/automatización, administración de perfiles y operaciones de sistema desde la interfaz.

### Modified Capabilities
_(ninguna — no existen specs previas; no hay cambios de requisitos a nivel de spec existente)_

## Impact

- **Código UI:** `src/routes/settings.tsx` y secciones/paneles de configuración, features, automatización, perfiles y sistema.
- **APIs:** `/api/config*`, `/api/features`, `/api/automation/*`, `/api/profile-admin/*`, `/api/system/updates` y `/api/system/update`.
- **Socket:** `automation:progress|log|done|failed|update-*`, `env:progress|log|venv-done|deps-done|failed`, `system:update`.
- **Dependencias:** `profile-session-ui`, `contract-client`; define parámetros consumidos por ejecución, entornos, docker y datos.
