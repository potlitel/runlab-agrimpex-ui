## Why

Las vistas **Dashboard** y **Tests** son el núcleo operativo del producto (ejecutar la suite Playwright sin terminal), pero hoy son placeholders; el backend ya expone descubrimiento/ejecución de tests y eventos en vivo por perfil y debe reflejarse en una experiencia de ejecución usable.

## What Changes

- Implementar la consola de ejecución: visualización del árbol de tests (`collect/cached`), refresco/descubrimiento, selección de tests y parámetros de corrida (`project`, `grep`, `workers`, entorno/perfil de variables, `envFile`, `useDocker`, `params`, `paramsByTest`).
- Permitir lanzar y abortar ejecuciones (`/tests/run`, `/tests/abort`, `/tests/status`) mostrando progreso y resultados en tiempo real vía socket (`execution:*`, `test:*`, `progress`).
- Mostrar salida/estado por test y resumen de la corrida; ofrecer acceso al reporte generado cuando aplique.
- Soportar lectura (y edición, si se decide en diseño) de archivos de spec mediante `/tests/file`.
- Resolver el rol de **Dashboard** (consola/resumen en vivo) y **Tests** (explorador/gestión de specs y selección) reutilizando componentes compartidos, evitando duplicación.

## Capabilities

### New Capabilities
- `execution-dashboard`: exploración, configuración y ejecución de tests Playwright con retroalimentación en vivo y resultados por perfil.

### Modified Capabilities
_(ninguna — no existen specs previas; no hay cambios de requisitos a nivel de spec existente)_

## Impact

- **Código UI:** `src/routes/index.tsx`, `src/routes/tests.tsx`, `src/features/dashboard/*` (reemplazo del contenido demo) y nuevos componentes/features de árbol de tests, panel de corrida y consola de eventos.
- **APIs:** `/api/tests/collect`, `/api/tests/cached`, `/api/tests/run`, `/api/tests/abort`, `/api/tests/status`, `/api/tests/file` (GET/POST).
- **Socket:** `execution:preparing|prepare-failed|started|completed|aborted`, `test:started|completed|output`, `progress` (sala `profile:<id>`).
- **Dependencias:** `profile-session-ui` (perfil activo y sala), `contract-client`; integra parámetros provenientes de Entornos/Config/Docker.
