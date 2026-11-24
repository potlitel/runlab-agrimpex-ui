# Tasks

## 1. Patrón compartido de estado vacío

- [x] 1.1 Crear `src/features/execution/components/execution-empty-state.tsx` con icono, título, texto secundario y acción opcional, y verificar que TypeScript compila con `npm run build` y que el componente se usa desde los cuatro paneles

## 2. Contexto de ejecución

- [x] 2.1 Sustituir el `<dl>` del modo `compact` de `project-context-card.tsx` por tarjetas compactas por campo con icono y estado visual, preservando `contextFrom`, el badge de MCP, los textos «No registrado» y los enlaces a Ajustes y Tests; verificar visualmente los casos configurado, parcial y error de consulta

## 3. Última corrida

- [x] 3.1 Mostrar en `last-run-card.tsx` un bloque de `Skeleton` para fecha, duración y tasa de éxito cuando no haya `reportId`, conservando el texto «Todavía no hay una corrida finalizada en esta sesión», el botón a Tests y el marcado `aria-hidden` del esqueleto; verificar que con `reportId` se muestran los datos reales y no el esqueleto

## 4. Consola de ejecución

- [x] 4.1 Aplicar en `execution-console.tsx` la superficie de terminal al área de logs (fondo oscuro, monoespaciado, tonos con contraste), mantener `role='log'`, `aria-live`, la barra de progreso accesible y los estados «En espera»/«En ejecución»; verificar con logs vacíos, con eventos y con error que los textos y atributos accesibles siguen presentes

## 5. Resultados por test

- [x] 5.1 Sustituir los `<select>` nativos de `results-table.tsx` por `Select` de shadcn/ui con ancho mínimo consistente y `aria-label` en el trigger, manteniendo valores, contador, agrupación y limpieza de filtros; verificar que buscar y filtrar por estado y orden sigue cambiando las filas visibles
- [x] 5.2 Dar estilo de estado vacío con icono de búsqueda al caso sin resultados y conservar el mensaje «Sin coincidencias con los filtros actuales» y su botón; verificar ambos estados con una prueba de componente

## 6. Verificación integrada

- [x] 6.1 Actualizar `src/features/execution/dashboard.test.tsx` para cubrir los estados vacíos y ejecutar `npm test`, comprobando que siguen presentes «Consola de ejecución», «Resultados por test» y «reports: false»
- [x] 6.2 Ejecutar `npm run lint` y `npm run build` y verificar que no hay errores de tipos ni de estilo
- [x] 6.3 Revisar `/` en los tres escenarios (perfil sin configurar, corrida finalizada y corrida en curso) y verificar que los nuevos estados no ocultan errores ni resultados

## Workflow follow-up

- Entregar el resultado final únicamente con el código modificado (HTML, TS, CSS/Tailwind) y un resumen de 1 línea por archivo, sin explicaciones adicionales salvo que se soliciten.
- Archivar el change una vez superada la revisión.
