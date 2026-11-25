# Tasks

## 1. Dependencia e infraestructura de movimiento

- [x] 1.1 Agregar `motion@14` a `package.json` e instalar; verificar con `npm ls motion` que resuelve la versión 14 y que `npm run build` compila sin errores de tipos.
- [x] 1.2 Crear `src/lib/motion.ts` con las variantes `fadeUp` y `staggerContainer`, las transiciones compartidas y la duración del stagger; verificar que `npm run build` acepta los tipos exportados.
- [x] 1.3 Crear `src/components/motion/animated-number.tsx` con `useMotionValue`, `useSpring`, `useTransform`, formato configurable y salto al valor final cuando `useReducedMotion()` está activo; verificar con una prueba unitaria que el valor final y el formato son correctos.
- [x] 1.4 Envolver el dashboard en `MotionConfig reducedMotion='user'` y `LazyMotion features={domAnimation} strict`; verificar que `npm run test` pasa y que un `grep` no encuentra usos de `motion.*` fuera de `m.*` en los componentes del dashboard.

## 2. Entrada escalonada y transiciones de paneles

- [x] 2.1 Aplicar el contenedor de stagger y la variante `fadeUp` al banner de guía y a las cinco secciones en `src/features/execution/dashboard.tsx`; verificar con la prueba existente del dashboard y una revisión visual de la carga inicial.
- [x] 2.2 Animar `ProjectContextCard`: chips con stagger, crossfade entre configuración, error y vacío, y ajuste de altura con `height: auto`; verificar con la prueba del componente que los valores y acciones siguen presentes tras la transición.
- [x] 2.3 Animar `LastRunCard`: crossfade esqueleto → contenido, pop del badge de estado, count-up de totales, duración y tasa de éxito, y entrada del aviso de aborto; verificar con pruebas que el estado final muestra los valores correctos y que el count-up termina en el valor recibido.
- [x] 2.4 Animar `ExecutionConsole`: pills de resumen con stagger, porcentaje con spring y pulso en hitos de 25/50/75/100; verificar con las pruebas de consola que logs, progreso y atributos accesibles se mantienen.
- [x] 2.5 Verificar el cambio de perfil: el encabezado permanece estable, el contenido vuelve a entrar con el escalonado y no hay animación de salida de la vista; comprobarlo manualmente con dos perfiles y registrar el resultado.

## 3. Resultados y logs

- [x] 3.1 Extraer `ResultRow` en `results-table.tsx`, agregar la entrada de fila y el registro de ids ya vistos; verificar con una prueba que una fila conocida no recibe el marcador de entrada y una fila nueva sí.
- [x] 3.2 Implementar el destello verde/rojo solo en la transición `running` → estado terminal; extraer la regla a una función pura y verificarla con una prueba de tabla de verdad, además de comprobar que la carga inicial de un reporte no destella.
- [x] 3.3 Animar la expansión y contracción de la salida con `AnimatePresence` y `height: auto`; verificar con la prueba existente que el `<pre>` aparece al expandir y que `aria-expanded` cambia, y revisar visualmente que la fila no salta.
- [x] 3.4 Animar la entrada de cada línea de log sin animación de salida; verificar con una prueba que limpiar logs elimina las líneas de inmediato y revisar manualmente que el autoscroll sigue el evento más reciente.

## 4. Accesibilidad, limpieza y verificación

- [x] 4.1 Mover los keyframes `mcp-shine` de `ProjectContextCard` a `src/styles/index.css` y eliminar el `<style>` inline; verificar con `grep` que no queda `MCP_STYLE` y que el badge MCP conserva el brillo en una revisión visual.
- [x] 4.2 Configurar `MotionGlobalConfig.skipAnimations` en `src/test/setup.ts` (o mockear `motion/react` si el export no existe); verificar que la suite completa `npm run test` pasa sin fallos por nodos en salida.
- [x] 4.3 Verificar el movimiento reducido: con `useReducedMotion` simulado en una prueba, `AnimatedNumber` muestra el valor final; manualmente con la emulación de `prefers-reduced-motion` de DevTools, las secciones no se desplazan y los números no cuentan.
- [x] 4.4 Ejecutar `npm run build` y comparar el tamaño del chunk del dashboard con el build previo; dejar registrado el delta de gzip y confirmar que no aparecen advertencias nuevas.
- [x] 4.5 Ejecutar `npm run lint` y `npm run format:check`; corregir cualquier problema introducido por los nuevos archivos y verificar que ambos comandos terminan sin errores.
- [x] 4.6 Hacer la verificación manual integrada en tema claro y oscuro: carga inicial, cambio de perfil, corrida con logs, transición de un test a pasado/fallido, filtros, agrupación, expansión de salida y limpieza de logs; registrar los resultados en la conversación del change.

## Workflow follow-up

- Archivar el change cuando la revisión y la verificación manual estén completas.
- Evaluar en un change separado la eliminación de los componentes legacy de `src/features/dashboard/components/`.
