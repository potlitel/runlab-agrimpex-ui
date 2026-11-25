# Design

## Context

Ver `proposal.md` para la motivación. La ruta `/tests` renderiza `TestsPage` desde `src/features/execution/tests-page.tsx`. El componente externo solo lee el perfil activo y monta `TestsPageView` con `key={activeProfileId}`, de modo que cambiar de perfil remonta la vista. `TestsPageView` usa el mismo `useExecution` que el dashboard: catálogo (`tree`), selección, estado `running`, logs, progreso, resultados y acciones.

La vista apila tres bloques dentro de `Main`: `ProjectContextCard`, una grid con `TestExplorer` y `RunControls`, y un contenedor con `ExecutionConsole` y `ResultsTable`. `TestExplorer` mantiene un `query` local para filtrar archivos/tests y alterna entre tres ramas: error, vacío/carga y lista. `RunControls` mantiene el estado del formulario y muestra acciones dependientes de `selected.length`, `running`, `runPending` y `abortPending`.

Hoy `MotionConfig` y `LazyMotion` se declaran dentro de `ExecutionDashboard`. Los componentes animados usan `m.*` con las variantes de `src/lib/motion.ts` y `AnimatedNumber` ya respeta `useReducedMotion()` y `MotionGlobalConfig.skipAnimations`. En jsdom las aserciones son inmediatas, así que cualquier presencia de nodos en salida rompería los tests.

## Goals / Non-Goals

**Goals:**

- Un único par de providers de Motion para todas las rutas autenticadas, sin duplicarlos por página.
- La misma coreografía y vocabulario visual en Tests que en el dashboard, reutilizando los presets existentes.
- Transiciones de estado legibles sin tocar datos, acciones ni accesibilidad.
- Tests deterministas y verificación manual en tema claro/oscuro y movimiento reducido.

**Non-Goals:**

- Animar el diálogo del visor de archivos ni cualquier overlay de shadcn/ui.
- Agregar animación por archivo/fila al catálogo ligada a la búsqueda.
- Modificar `use-execution`, `execution-state`, la capa de socket ni `src/lib/api.ts`.
- Extender la coreografía a otras rutas en este change.
- Reemplazar el `<table>` de resultados ni animar reordenamientos.

## Decisions

### 1. Providers en el layout autenticado

`AuthenticatedLayout` pasa a envolver su contenido con `MotionConfig reducedMotion='user'` y `LazyMotion features={domAnimation} strict`, por fuera de `SearchProvider`, `LayoutProvider` y `SidebarProvider`. `ExecutionDashboard` elimina ambos wrappers y sus imports.

Alternativas consideradas: crear un `MotionProvider` por ruta descartada porque duplica configuración y deja la página de Tests sin providers; importar el motor completo (`motion.*`) descartado por el costo en el chunk inicial. `strict` solo alerta si se usa `motion.*` dentro de `LazyMotion`; los `m.*` que se renderizan aislados en tests de componente siguen funcionando, como ya ocurre hoy con `ResultsTable`.

### 2. Orquestación de entrada en la página de Tests

Un `m.div` contenedor con `variants={staggerContainer}` envuelve los tres bloques de `Main`, cada uno con `variants={fadeUp}` y `initial/animate` equivalentes a los del dashboard. El `Header` queda fuera del contenedor. Con `useReducedMotion()` activo, el contenedor usa `initial={false}` y las variantes se omiten, de modo que no hay desplazamiento ni escalonado.

La vista ya se remonta por el `key` del perfil, por lo que no se necesita `AnimatePresence` ni una animación de salida. Alternativa descartada: `AnimatePresence mode="wait"` sobre la vista completa, porque haría parpadear el header y retrasaría el cambio de perfil.

### 3. Crossfade de estados, no de listas filtradas

`TestExplorer` envuelve sus tres ramas (error, vacío/carga, contenido) en `AnimatePresence mode='wait'` con `m.div` y `fadeIn`. La búsqueda no cambia de rama: el filtro se calcula con `useMemo` y solo re-renderiza la lista existente. Por el mismo motivo, los archivos del catálogo no reciben `variants` de entrada; la entrada escalonada ocurre solo a nivel de sección.

En `RunControls`, el bloque de acciones y el texto de estado se envuelven en `AnimatePresence mode='wait'` con una clave derivada de `running`/`runPending`, para crossfade entre «Ejecutar N tests», «Iniciando…» y «Abortar». Los `disabled` se calculan como hoy, antes de animar, para que la accesibilidad no dependa del frame.

### 4. Badge y contadores

El badge «En ejecución» del header se renderiza con `AnimatePresence` y `m.span` usando `popIn`. No se anima su salida: al terminar la corrida desaparece de inmediato.

Los contadores de selección (en `TestExplorer` y en el botón de `RunControls`) y el total del catálogo usan `AnimatedNumber`. El formateador por defecto ya produce el valor exacto al finalizar el spring; con movimiento reducido o `skipAnimations`, el componente salta al valor final. El pop del contador de selección se aplica al contenedor del texto con `popIn`, sin envolver la lista completa.

### 5. Movimiento reducido y determinismo

`MotionConfig reducedMotion='user'` en el layout cubre todas las rutas. La página añade el condicional `useReducedMotion()` únicamente para desactivar el stagger de entrada; el resto de las transiciones se escriben en términos de opacidad y transformaciones y Motion se encarga de recortar los transforms. `AnimatedNumber` ya consulta la preferencia y `skipAnimations`, así que no se duplica esa lógica.

En tests, `MotionGlobalConfig.skipAnimations = true` sigue siendo la única fuente de verdad. Las pruebas nuevas verifican el estado final del DOM (textos, contadores y ramas visibles), sin depender de frames intermedios.

### 6. Verificación

Además de `npm run test`, `npm run build` y `npm run lint`, se revisa en Chromium que la entrada escalonada se reproduzca al cargar y al cambiar de perfil, que el badge no parpadee, que la búsqueda no reintroduzca entradas y que `prefers-reduced-motion` suprima desplazamientos. El delta de bundle debería ser pequeño porque no se añade código de motor fuera del layout ya existente.

## Risks / Trade-offs

- **Providers globales afectan a otras rutas** → `reducedMotion='user'` es la misma política que ya usaba el dashboard; `domAnimation` no incluye layout projection ni drag, así que no cambia overlays ni tablas.
- **Crossfade al escribir en la búsqueda** → el filtro no cambia de rama de `AnimatePresence`; solo se animan los bloques de estado.
- **Badge que parpadea por actualizaciones de socket** → una sola instancia con clave estable por transición `running`, sin salida animada.
- **Contadores que se actualizan en cada evento** → spring corto ya existente y `AnimatedNumber` salta al valor final con movimiento reducido.
- **Tests con `AnimatePresence`** → `skipAnimations` global; las aserciones se hacen sobre el estado final, sin nodos en salida.
- **Movimiento reducido difícil de simular en jsdom** → verificación manual con emulación de DevTools y prueba unitaria del valor final de `AnimatedNumber` ya existente.

## Migration Plan

1. Mover los providers al layout autenticado y quitarlos del dashboard; ejecutar tests y build.
2. Aplicar la entrada escalonada y el badge animado en `tests-page.tsx`.
3. Ajustar `test-explorer.tsx` y `run-controls.tsx` para los crossfades y contadores.
4. Agregar pruebas de estado final, ejecutar la verificación completa y revisar visualmente en claro/oscuro y movimiento reducido.

Rollback: revertir los archivos tocados; no hay migración de datos ni cambios de contrato. Los providers pueden volver al dashboard sin impacto en la API.
