# Tasks

## 1. Corrección del cursor

- [x] 1.1 En `src/features/reports/components/analytics-overview.tsx`, reemplazar `cursor={{ fill: 'hsl(var(--muted) / 0.35)' }}` por `cursor={{ fill: 'transparent' }}` y verificar que el `Tooltip` conserva `content={<ChartTooltip />}` y `wrapperStyle={{ outline: 'none' }}`
- [x] 1.2 Confirmar que no se modifican datos, `fill` de barras, `background`, ejes ni layout; verificar con `git diff -- src/features/reports/components/analytics-overview.tsx` que el diff es de una sola línea

## 2. Prueba de regresión

- [x] 2.1 Crear `src/features/reports/components/analytics-overview.test.tsx` con un mock mínimo de `recharts` que capture la prop `cursor` del `Tooltip`; renderizar `AnalyticsOverview` con un único punto de timeline y verificar que el cursor usa `fill: 'transparent'`; comprobar con `npm test -- analytics-overview`
- [x] 2.2 En el mismo test, verificar que las barras conservan `fill` `#22c55e`/`#ef4444` y que el tooltip sigue recibiendo los valores de pasados/fallidos; comprobar que la aserción del cursor falla si se restaura el valor anterior

## 3. Verificación integral

- [x] 3.1 Ejecutar `npm run build` y confirmar que TypeScript y Vite compilan sin errores
- [x] 3.2 Revisar `/reports` en tema claro y oscuro, con una y varias corridas: al pasar el cursor no debe aparecer un rectángulo negro, y el tooltip, la leyenda, las barras y el layout deben permanecer intactos

## Workflow follow-up

- Archivar el change cuando la revisión esté aprobada.
- Sincronizar el delta `reports-ui` a las specs principales si corresponde.
