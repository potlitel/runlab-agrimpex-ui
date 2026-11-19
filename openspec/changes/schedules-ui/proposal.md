## Why

El backend soporta calendarización de ejecuciones, pero la vista **Calendarización** es un placeholder; la UI debe permitir definir y operar programaciones para automatizar corridas de la suite.

## What Changes

- Listar, crear, editar, habilitar/deshabilitar, eliminar y ejecutar bajo demanda programaciones (`/schedules`, CRUD, toggle, run-now) con sus parámetros (hora, días, tests, repetición, uso de Docker, params).
- Mostrar metadatos relevantes como próxima/última ejecución y estado.
- Visualizar eventos/logs de ejecuciones programadas vía socket (`schedule:run|log`).
- Integrar la selección de tests a programar con el catálogo disponible (`/tests/collect|cached`).
- Respetar el feature flag `schedules`.

## Capabilities

### New Capabilities
- `schedules-ui`: gestión y monitoreo de ejecuciones programadas de pruebas.

### Modified Capabilities
_(ninguna — no existen specs previas; no hay cambios de requisitos a nivel de spec existente)_

## Impact

- **Código UI:** `src/routes/schedules.tsx` y componentes de formulario/listado de programaciones y visor de actividad.
- **APIs:** `/api/schedules` (GET/POST), `/api/schedules/:id` (PUT/DELETE), `/api/schedules/:id/toggle` (PATCH), `/api/schedules/:id/run` (POST).
- **Socket:** `schedule:run`, `schedule:log`.
- **Dependencias:** `profile-session-ui`, `contract-client`; coordinación con `execution-dashboard` para selección de tests y parámetros.
