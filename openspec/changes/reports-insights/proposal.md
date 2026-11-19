## Why

El backend persiste y expone historial, analítica y artefactos de cada corrida, pero la vista **Reportes** es un placeholder; se requiere visibilidad de resultados históricos y métricas para evaluar la calidad y evolución de la suite.

## What Changes

- Listar el historial de ejecuciones con resumen (`/reports`) y permitir navegar al detalle de un reporte (`/reports/:id`).
- Presentar analítica agregada (`/reports/analytics`): KPIs, tasa de éxito, ejecuciones únicas/nunca ejecutadas, desglose por archivo y línea temporal.
- Visualizar detalle de tests por corrida (estado, duración, errores/salida, adjuntos) y acceder a assets/descargas (`/reports/:id/assets/*`, `download/json|html`).
- Permitir eliminar reportes (`DELETE /reports/:id`) con confirmación.
- Respetar el feature flag `reports` (vista/acciones deshabilitadas u ocultas cuando no aplica).

## Capabilities

### New Capabilities
- `reports-ui`: consulta, análisis y gestión del historial de reportes y evidencias asociadas a ejecuciones.

### Modified Capabilities
_(ninguna — no existen specs previas; no hay cambios de requisitos a nivel de spec existente)_

## Impact

- **Código UI:** `src/routes/reports.tsx` y nueva feature de reportes (tablas, gráficos, vista detalle/visor de reporte y assets).
- **APIs:** `/api/reports`, `/api/reports/analytics`, `/api/reports/:id`, `/api/reports/:id/assets/*`, `/api/reports/:id/download/json|html`, `DELETE /api/reports/:id`.
- **Dependencias:** `profile-session-ui`, `contract-client`; consume resultados generados por ejecuciones (`execution-dashboard`).
