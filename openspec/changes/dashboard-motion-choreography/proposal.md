# Proposal

## Why

El dashboard de ejecución (`/`) comunica los cambios de estado —nuevas líneas de log, tests que pasan de «En curso» a «Pasado» o «Fallido», llegada del reporte— reemplazando el DOM de golpe. En una consola de monitoreo en vivo, ese cambio abrupto hace que el operador pierda el momento exacto en que un test termina o aparece un resultado, y la interfaz se percibe como una sucesión de saltos en lugar de un flujo continuo.

La aplicación ya usa `tw-animate-css` para overlays de shadcn/ui y algunos keyframes puntuales, pero no tiene una coreografía para las secciones del dashboard. Este change incorpora una capa de movimiento deliberada que jerarquiza la entrada de las secciones y hace legibles las transiciones de datos, sin modificar la lógica de ejecución ni los contratos.

## What Changes

- Añadir `motion` como dependencia y centralizar variantes, transiciones y duraciones en un módulo compartido.
- Aplicar una entrada escalonada a las cinco secciones del dashboard: banner de guía, contexto de ejecución, última corrida, consola y resultados.
- Animar `ProjectContextCard`: chips de contexto con stagger y crossfade entre los estados de configuración, error y vacío.
- Animar `LastRunCard`: transición skeleton → contenido, aparición del badge de estado, count-up de totales, duración y tasa de éxito, y entrada del aviso de corrida abortada.
- Animar `ExecutionConsole`: pills de resumen con stagger, entrada de cada línea de log, porcentaje con spring y pulso en hitos de progreso. Las líneas de log no tendrán animación de salida para que «Limpiar» siga siendo instantáneo.
- Animar `ResultsTable`: entrada solo para filas realmente nuevas, destello verde o rojo cuando un test pasa de `running` a estado terminal y expansión animada de la salida completa. Se conserva la tabla semántica `<table>` y se descartan animaciones de layout o reordenamiento.
- Respetar `prefers-reduced-motion` mediante `MotionConfig`; el count-up salta directamente al valor final cuando la preferencia está activa.
- Desactivar las animaciones en Vitest (`MotionGlobalConfig.skipAnimations`) para mantener deterministas los tests existentes.
- Mover los keyframes `mcp-shine` del `<style>` inline de `ProjectContextCard` a `src/styles/index.css`.
- No modificar endpoints, eventos Socket.io, el estado de ejecución (`use-execution`), los cálculos de resumen ni los contratos de datos.

## Capabilities

### New Capabilities

- `execution-dashboard`: coreografía visual de las secciones del dashboard de ejecución, cubriendo entradas escalonadas, transiciones entre estados de datos y feedback de cambios en vivo, con respeto por la preferencia de movimiento reducido. El spec maestro todavía no existe porque los changes previos no fueron archivados ni sincronizados; este change agrega requirements nuevas bajo la misma capability, sin reutilizar los nombres de requirements de los changes anteriores.

### Modified Capabilities

Ninguna. No hay specs maestras registradas en `openspec list --specs`.

## Impact

- **Código:** `src/features/execution/dashboard.tsx`, `src/features/execution/components/project-context-card.tsx`, `last-run-card.tsx`, `execution-console.tsx` y `results-table.tsx`; nuevo módulo de presets de movimiento y componente reutilizable de count-up; `src/styles/index.css` y `src/test/setup.ts`.
- **Dependencias:** se añade `motion@14` con import desde `motion/react`, usando `LazyMotion` + `domAnimation` para mantener el subconjunto en torno a 15-20 KB gzip. No se añaden endpoints ni servicios.
- **Pruebas:** los tests de componentes del dashboard se mantienen; se agrega la configuración global que resuelve las animaciones al instante en jsdom y cobertura para el count-up y la detección de filas nuevas.
- **Riesgo principal:** que las animaciones compitan con el autoscroll de logs o que el re-render de filtros reproduzca entradas en filas ya visibles. Se mitiga animando solo `opacity`/`transform`, sin salidas en logs y con un registro local de ids ya vistos.
- **Fuera de alcance:** los componentes legacy de `src/features/dashboard/components/` (código muerto), las transiciones de ruta fuera de `/`, la migración de la tabla a un grid de divs y cualquier cambio en la capa de datos o socket.
