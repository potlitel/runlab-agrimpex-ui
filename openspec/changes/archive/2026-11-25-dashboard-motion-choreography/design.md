# Design

## Context

La ruta `/` renderiza `ExecutionDashboard` desde `src/features/execution/dashboard.tsx`. `src/features/dashboard/` es solo un facade: `index.tsx` re-exporta el dashboard de ejecución y sus `components/` son demos legacy que ningún archivo importa. El dashboard real apila cinco secciones dentro de un contenedor `space-y-4`: banner de guía, `ProjectContextCard` en modo compacto, `LastRunCard`, `ExecutionConsole` y `ResultsTable`.

El estado proviene de `useExecution`, respaldado por un store de Zustand por perfil. `ExecutionDashboardView` lleva `key={activeProfileId}`, por lo que cambiar de perfil remonta la vista y reinicia el estado local. Los logs se acumulan hasta 500 entradas con ids incrementales y las más antiguas se descartan; los resultados se indexan por id de test y se actualizan en sitio cuando un test cambia de estado. El progreso y el resumen llegan por Socket.io.

La aplicación ya usa `tw-animate-css` en overlays de shadcn/ui, keyframes propios para Radix Collapsible en `src/styles/index.css` y animaciones puntuales (`animate-spin`, `animate-pulse`, `animate-ping`, `mcp-shine` inline). No hay librería de movimiento. Los tests corren en Vitest con jsdom y hacen aserciones inmediatas después de `fireEvent`.

Restricciones que condicionan el diseño: el dashboard es la ruta índice, así que cualquier dependencia importada allí entra al chunk inicial; la tabla debe conservar su semántica; y el autoscroll de la consola no puede pelearse con animaciones que cambien la altura de las líneas.

## Goals / Non-Goals

**Goals:**

- Un lenguaje de movimiento consistente, centralizado en variantes y transiciones reutilizables.
- Coreografía completa donde aporta: entradas, transiciones entre estados, feedback de datos en vivo y salidas de paneles.
- Mantener intactos los datos, el estado de ejecución, los contratos y la accesibilidad.
- Tests deterministas y build sin advertencias nuevas.

**Non-Goals:**

- Animar `src/features/dashboard/components/` (código muerto).
- Transiciones de ruta fuera de `/`.
- Migrar la tabla a un grid de divs o animar reordenamientos.
- Reemplazar las animaciones de shadcn/ui por motion.
- Tocar `use-execution`, `execution-state`, la capa de socket o `src/lib/api.ts`.

## Decisions

### 1. Librería: `motion@14` con `LazyMotion` y `domAnimation`

Se adopta `motion` (sucesor de `framer-motion`) importado desde `motion/react`. Es la opción que cubre salidas, orquestación, springs y reduced motion sin escribir infraestructura propia.

Alternativas descartadas: CSS + `tw-animate-css` no ofrece salidas ni orquestación; `@formkit/auto-animate` resuelve listas pero no count-ups ni coreografía; GSAP es imperativo y más pesado para este alcance.

Para acotar el costo, el dashboard se envuelve en `LazyMotion features={domAnimation} strict` y se usan componentes `m.*`. `domAnimation` incluye animaciones, variantes, salidas y gestos, pero no layout projection ni drag, que este change no necesita. El subconjunto queda en torno a 15-20 KB gzip en lugar de los ~30-45 KB del import completo. `strict` obliga a usar `m.*` y evita que se cuele `motion.*` con el motor completo.

### 2. Orquestación de entrada

Un `motion.div` contenedor con `variants={staggerContainer}` envuelve las cinco secciones; cada sección usa `variants={fadeUp}`. El stagger es de 60 ms y el desplazamiento de 8 px, con `easeOut` y 350-450 ms. La entrada se ejecuta al montar y se repite al cambiar de perfil porque la vista se remonta por diseño.

El encabezado queda fuera de la animación. No se anima la salida al cambiar de perfil: un `AnimatePresence mode="wait"` sobre la vista completa haría parpadear el header y retrasaría el cambio; la entrada escalonada del contenido nuevo comunica el cambio sin ese costo.

### 3. Transiciones entre estados de los paneles

Cada panel usa `AnimatePresence mode="wait"` para alternar entre estado vacío, carga, error y contenido. `ProjectContextCard` además escalona sus chips y anima el cambio de altura con `height: auto` (animación de valor estándar, no requiere `layout`). `LastRunCard` hace crossfade del esqueleto al contenido y `ExecutionConsole` alterna entre el estado de espera y la lista de logs.

### 4. Números animados

Se crea `AnimatedNumber` con `useMotionValue`, `useSpring` y `useTransform`, formateando con `Intl.NumberFormat` o un `format` provisto. Se usa en los totales, la duración y la tasa de éxito de `LastRunCard`, y en el porcentaje y las pills de `ExecutionConsole`. Con `useReducedMotion()` activo, el componente escribe el valor final sin animar. El spring es corto para que las actualizaciones en vivo no se sientan lentas.

### 5. Resultados: tabla semántica con movimiento acotado

Se conserva `<table>`. Se extrae `ResultRow` para encapsular la lógica por fila:

- **Entrada**: `m.tr` con opacidad y 2-4 px de desplazamiento. Un `Set` de ids ya vistos en un ref decide si la fila es nueva; las filas conocidas usan `initial={false}` para que buscar, filtrar, ordenar o agrupar no reproduzca la entrada.
- **Destello de estado**: un ref guarda el estado anterior. Solo cuando pasa de `running` a `passed`/`failed`/`error` se dispara `useAnimationControls` con un fondo verde o rojo que se desvanece. La carga inicial de un reporte (sin estado previo `running`) no destella.
- **Expandir salida**: `AnimatePresence` + `m.div` con `height: 0` → `auto` y opacidad, dentro de la celda. No se usa `layout` ni se reordena nada.

### 6. Logs sin salida

Cada línea es un `m.div` con `initial={{ opacity: 0, x: -4 }}` y `animate={{ opacity: 1, x: 0 }}` de 150 ms. No hay `AnimatePresence` ni exit: limpiar el buffer debe ser instantáneo y una salida por línea multiplicaría el costo cuando se descartan las más antiguas. Solo se animan opacidad y transform, de modo que la altura no cambia y el autoscroll con `endRef` sigue funcionando.

### 7. Movimiento reducido

`MotionConfig reducedMotion="user"` en la raíz del dashboard delega en la preferencia del sistema. Motion desactiva transforms y layout pero conserva opacidad; el count-up consulta `useReducedMotion()` y salta al valor final. No se agregan condicionales por componente.

### 8. Tests deterministas

En `src/test/setup.ts` se configura `MotionGlobalConfig.skipAnimations = true` (si el export no existe en `motion/react`, se mockea el módulo). Sin esto, `AnimatePresence` deja nodos en el DOM hasta terminar la animación y los tests existentes pueden ver estados intermedios. Se agregan pruebas para el valor final de `AnimatedNumber`, para la regla de fila nueva y para que el destello no se repita en filas ya terminales.

### 9. Limpieza de `mcp-shine`

Los keyframes `mcp-shine` se mueven del `<style>` inline de `ProjectContextCard` a `src/styles/index.css`. Elimina una inyección de estilo por render y deja todos los keyframes del dashboard en un solo lugar. No cambia el comportamiento visual.

## Risks / Trade-offs

- **Peso en el chunk inicial** → `LazyMotion` + `domAnimation` + `m.*`; medir el bundle con `npm run build` antes y después y dejar registrado el delta.
- **Replay de entradas al filtrar** → `Set` de ids vistos; probar búsqueda, filtro, orden y agrupación.
- **Logs de alta frecuencia** → sin exit, solo opacidad/transform, y ninguna animación que cambie la altura de la línea.
- **`motion.tr` con transform** → validar en Chromium claro/oscuro; si el desplazamiento se ve mal, degradar a opacidad sola sin cambiar el resto del diseño.
- **Tests con `AnimatePresence`** → `skipAnimations` global; revisar que ninguna aserción dependa de nodos que salen.
- **Reduced motion difícil de simular en jsdom** → verificación manual con la emulación de DevTools y una prueba unitaria que mockee `useReducedMotion`.
- **Count-up ruidoso durante la corrida** → spring corto y actualización solo cuando cambia el valor; si resulta excesivo, limitar el count-up a la transición de «sin reporte» a «reporte» y dejar el resto con actualización directa.
- **Repetición del stagger al cambiar de perfil** → mantener la coreografía por debajo de 400 ms y el header estable; si se percibe repetitivo, se puede limitar la entrada al primer montaje por sesión sin cambiar el spec.

## Migration Plan

1. Instalar `motion`, crear los presets y `AnimatedNumber`, y envolver el dashboard en `MotionConfig` + `LazyMotion`.
2. Integrar sección por sección en este orden: banner, contexto, última corrida, consola y resultados. Después de cada una, correr `npm run test` y `npm run build`.
3. Mover `mcp-shine` a `index.css` y ajustar el setup de tests.
4. Verificar manualmente: carga inicial, cambio de perfil, corrida con logs, transición `running` → terminal, expandir salida, limpiar logs, tema claro/oscuro y movimiento reducido.

Rollback: quitar la dependencia y revertir los componentes; no hay migración de datos ni cambios de contrato.
