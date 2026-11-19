## Context

El backend ofrece CRUD/toggle/run-now de programaciones (`/api/schedules`) y eventos `schedule:run|log`, gateado por `schedules`. Ruta `/schedules` es placeholder. Ver `proposal.md` y specs.

## Goals / Non-Goals

**Goals:**
- CRUD completo de programaciones con parámetros soportados y ejecución manual.
- Visualizar próxima/última ejecución y actividad reciente.
- Integrar selección de tests desde el catálogo del proyecto.

**Non-Goals:**
- Editor visual complejo tipo calendario completo si no aporta al modelo (hora/días) del backend.
- Garantías de planificación fuera de la lógica del scheduler backend.

## Decisions

- **UI:** listado + formulario (dialog/panel) con campos alineados al contrato (time, days, testIds, repeat, useDocker, params, paramsByTest, enabled); TanStack Query/mutaciones e invalidación.
- **Selección de tests:** reutilizar datos de `testsApi.cached/collect` para picker de `testIds`.
- **Eventos:** suscripción `onSchedule` para actualizar feed/logs y refrescar estado cuando corresponda.

## Risks / Trade-offs

- [Zona horaria/interpretación de horario] → mostrar el valor tal como lo define el backend y documentar comportamiento visible.
- [Catálogo de tests desactualizado] → ofrecer refresco antes de seleccionar.
