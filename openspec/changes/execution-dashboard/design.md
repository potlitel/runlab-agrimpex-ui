## Context

El backend ofrece descubrimiento (`/tests/collect|cached`), ejecución/control (`/tests/run|abort|status`), acceso a archivos (`/tests/file`) y eventos en vivo (`execution:*`, `test:*`, `progress`). Las rutas `/` y `/tests` son placeholders. Ver `proposal.md` y specs.

## Goals / Non-Goals

**Goals:**
- Entregar una consola de ejecución usable (árbol, selección, parámetros, ejecución/aborto, progreso en vivo y resultados).
- Reutilizar componentes entre Dashboard y Tests con roles claros (resumen/consola vs explorador).
- Integrar parámetros provenientes de entorno/configuración cuando estén disponibles.

**Non-Goals:**
- Editor avanzado/IDE de tests (salvo visualización básica de archivo si se incluye).
- Persistencia de configuraciones de corrida complejas fuera del alcance del backend actual.
- Reimplementar analítica histórica (cubierta por reportes).

## Decisions

- **Modelo de datos UI:** usar TanStack Query para fetch/cache de `collect/cached/status` y estado local/store para la corrida activa; suscripciones socket vía `useSocket` para actualizar progreso/resultados incrementales.
- **Estructura de componentes:** feature `execution` (árbol/selector, barra de acciones, panel de parámetros, consola de logs/progreso, tabla de resultados) compartida; `Dashboard` enfatiza estado en vivo/resumen, `Tests` enfatiza exploración/selección (o alias según UX final mínima viable).
- **Parámetros de run:** mapear controles a payload soportado (`testIds`, `project`, `grep`, `workers`, `useDocker`, `profileName`/`envFile`, `params`, `paramsByTest`) sin enviar campos no soportados.
- **Manejo de estados:** vacíos (sin proyecto/config, sin tests), conflicto 409 (ejecución en curso), errores de API y eventos de fallo/preparación.

## Risks / Trade-offs

- [Volumen de eventos/logs] → limitar/renderizar incrementalmente el buffer de salida para no degradar la UI.
- [Divergencia entre árbol y ejecución] → refrescar estado al completar/abortar y permitir recarga manual.
- [Dependencia de configuración del proyecto] → guiar al usuario hacia Ajustes/Entornos cuando falten prerrequisitos.
