# Proposal

## Why

La página de Tests (`/tests`) comparte el mismo flujo de ejecución que el dashboard, pero sus cambios de estado —catálogo vacío → cargado → error, selección → corrida en curso— siguen reemplazando el DOM de golpe. Tras la coreografía del dashboard, es la continuación natural para que la experiencia sea consistente en las dos vistas principales de ejecución.

Además, los providers de `motion` viven hoy dentro de `dashboard.tsx`. Cualquier otra ruta que use los componentes animados compartidos depende de que el dashboard esté montado; moverlos al layout autenticado elimina esa dependencia accidental sin cambiar el comportamiento del dashboard.

## What Changes

- Mover `MotionConfig reducedMotion='user'` y `LazyMotion features={domAnimation} strict` de `src/features/execution/dashboard.tsx` a `src/components/layout/authenticated-layout.tsx`, y eliminar los wrappers locales del dashboard.
- Aplicar una entrada escalonada a las secciones de la página de Tests (contexto de proyecto, explorador + controles, consola + resultados), reutilizando las variantes de `src/lib/motion.ts`. El encabezado queda estable al cambiar de perfil y no se anima la salida de la vista.
- Resolver con crossfade los cambios entre estados vacío, carga, error y contenido del catálogo, y entre las acciones de «Ejecutar», «Iniciando…» y «Abortar» en los controles de corrida.
- Añadir un pop breve al badge «En ejecución» del encabezado y al contador de selección, y count-up en los contadores de tests, usando el componente compartido `AnimatedNumber`.
- Respetar `prefers-reduced-motion` y mantener el determinismo de Vitest con la configuración global ya existente.
- No modificar `use-execution`, los contratos de API/socket, los cálculos de resumen ni las animaciones propias de los overlays de shadcn/ui.

## Capabilities

### New Capabilities

- `tests-page`: coreografía visual de la página de Tests, cubriendo la entrada escalonada de secciones, las transiciones entre estados del catálogo y de los controles, el feedback de selección y ejecución, y el respeto por la preferencia de movimiento reducido. No existen specs maestras registradas (`openspec list --specs` devuelve vacío), así que este change agrega requirements nueva bajo una capability durable para la página, sin reutilizar nombres de changes anteriores.

### Modified Capabilities

Ninguna. No hay specs maestras registradas en `openspec list --specs`.

## Impact

- **Código:** `src/components/layout/authenticated-layout.tsx`, `src/features/execution/dashboard.tsx`, `src/features/execution/tests-page.tsx`, `src/features/execution/components/test-explorer.tsx` y `src/features/execution/components/run-controls.tsx`. Se reutilizan `src/lib/motion.ts` y `src/components/motion/animated-number.tsx` sin cambios de API.
- **Dependencias:** no se añaden paquetes; se usa `motion@14` ya instalado y el mismo subconjunto `domAnimation`.
- **Pruebas:** se agregan pruebas de componente para los estados del explorador y las acciones de corrida; la suite existente sigue corriendo con `MotionGlobalConfig.skipAnimations`.
- **Riesgo principal:** que el crossfade se reproduzca al escribir en la búsqueda del catálogo o que el badge parpadee en cada actualización de estado. Se mitiga animando solo los bloques de estado, no la lista filtrada, y mostrando un único badge con transición de entrada.
- **Fuera de alcance:** el visor de archivos y demás overlays de shadcn/ui, las transiciones de ruta, los paneles de Docker/entorno/salud/evidencias, los componentes legacy de `src/features/dashboard/components/` y cualquier cambio en la capa de datos o socket.
