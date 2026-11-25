# Tasks

## 1. Providers de Motion compartidos

- [x] 1.1 Mover `MotionConfig reducedMotion='user'` y `LazyMotion features={domAnimation} strict` de `src/features/execution/dashboard.tsx` a `src/components/layout/authenticated-layout.tsx`, envolviendo el contenido del layout por fuera de los providers existentes; verificar con `grep` que el dashboard ya no declara esos wrappers y que `npm run test` sigue pasando.
- [x] 1.2 Comprobar que las rutas autenticadas siguen renderizando y que los tests de componente que usan `m.*` sin layout continúan pasando; verificar con `npm run test` y una revisión rápida de `npm run build`.

## 2. Entrada y feedback de la página de Tests

- [x] 2.1 Aplicar el contenedor `staggerContainer` y la variante `fadeUp` a los tres bloques de contenido de `src/features/execution/tests-page.tsx`, dejando el `Header` fuera y desactivando el stagger con `useReducedMotion()`; verificar con una prueba de render que el contenido final sigue presente y con revisión visual de la carga inicial.
- [x] 2.2 Animar el badge «En ejecución» del header con `popIn`, sin animación de salida; verificar que el badge aparece y desaparece según `running` y que no deja nodos pendientes en los tests.

## 3. Estados del catálogo y de los controles

- [x] 3.1 Envolver las ramas de error, vacío/carga y contenido de `test-explorer.tsx` en un crossfade de opacidad, sin animar la lista filtrada por búsqueda; verificar con una prueba que los textos de error, carga y contenido aparecen en su estado final y que buscar no reprocesa entradas.
- [x] 3.2 Mostrar el total del catálogo y el contador de selección con `AnimatedNumber` y un pop breve en el contador de selección; verificar con pruebas que los contadores terminan en los valores recibidos y que limpiar la selección muestra cero de inmediato.
- [x] 3.3 Crossfadear en `run-controls.tsx` el texto de acción entre «Ejecutar N tests», «Iniciando…» y «Abortar», manteniendo los mismos `disabled` y el envío del formulario; verificar con una prueba que cada estado muestra su texto y que el botón conserva su comportamiento.

## 4. Verificación integrada

- [x] 4.1 Ejecutar `npm run test` y comprobar que toda la suite pasa con `MotionGlobalConfig.skipAnimations`, sin aserciones dependientes de frames intermedios.
- [x] 4.2 Ejecutar `npm run build` y comparar el tamaño de los chunks con el build previo; confirmar que no aparecen advertencias nuevas y que el delta se mantiene pequeño al mover los providers al layout.
- [x] 4.3 Ejecutar `npm run lint` y verificar que no hay errores nuevos; formatear solo los archivos tocados por este change y confirmar que no se introducen cambios de formato en archivos ajenos.
- [x] 4.4 Hacer la verificación manual en Chromium, en tema claro y oscuro: carga inicial, cambio de perfil, selección y limpieza de tests, búsqueda en el catálogo, inicio/abortado de corrida y movimiento reducido; registrar los resultados y cualquier desviación respecto al dashboard.

## Workflow follow-up

- Archivar el change cuando la revisión y la verificación manual estén completas.
- Evaluar en changes separados la coreografía de Reportes, Salud y Calendarizaciones mencionadas en la conversación.
