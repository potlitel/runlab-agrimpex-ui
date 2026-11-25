# Design

## Context

Ver `proposal.md` — Why para la motivación.

- **Componente:** `src/features/reports/components/analytics-overview.tsx`, sección "Tendencia reciente"; `BarChart` apilado de Recharts 3.10.1 (`recharts` declarado como `^3.8.1`).
- **Tema:** `src/styles/theme.css` define `--muted`, `--muted-foreground` y `--border` como valores `oklch(...)`.
- **Cursor del tooltip:** Recharts dibuja el cursor de un `BarChart` como un `Rectangle` (`.recharts-tooltip-cursor`) que cubre la banda activa. Con una sola categoría, `tooltipAxisBandSize` ocupa todo el ancho del área de trazado, por eso el rectángulo se percibe como fondo de las barras.
- **Causa raíz:** el prop actual `cursor={{ fill: 'hsl(var(--muted) / 0.35)' }}` produce `hsl(oklch(...) / 0.35)`, un color inválido. El navegador descarta el `fill` y SVG aplica negro por defecto.
- **Descartado como causa:** `Bar background={{ fill: 'transparent' }}`, `CartesianGrid fill='transparent'` y las clases `bg-transparent` del wrapper ya son transparentes.

## Goals / Non-Goals

**Goals:**

- Eliminar el rectángulo negro en tema claro y oscuro, con una o varias categorías.
- Mantener sin cambios el tooltip, los datos, los colores de barras, los ejes, la leyenda y el layout.
- Dejar una prueba de regresión que detecte la reaparición del fondo.

**Non-Goals:**

- Corregir la sintaxis `hsl(var(--...))` de ejes y grid: cambiaría colores no solicitados y queda fuera del defecto reportado.
- Alterar el gráfico de tendencia del PDF o los datos de analítica.
- Rediseñar el componente o el gráfico.

## Decisions

### D1: Relleno transparente del cursor del tooltip

Cambiar `cursor={{ fill: 'hsl(var(--muted) / 0.35)' }}` por `cursor={{ fill: 'transparent' }}`.

- **Por qué:** elimina el fondo opaco sin tocar el tooltip ni la detección de la categoría activa; es el cambio mínimo y no depende del formato de los tokens del tema.
- **Alternativa descartada:** `cursor={false}` (patrón usado en `health-charts.tsx`). También elimina el fondo, pero suprime por completo el rectángulo de cursor; se prefiere mantener la configuración explícita y transparente para no alterar más de lo necesario el comportamiento de Recharts.

### D2: No tocar el `background` de las barras ni el wrapper

Los `background={{ fill: 'transparent' }}` de ambos `<Bar>` y las clases de transparencia del contenedor no producen el rectángulo negro. Mantenerlos evita un diff mayor y conserva la configuración actual del gráfico.

### D3: Prueba de regresión a nivel de configuración

- Añadir `src/features/reports/components/analytics-overview.test.tsx`.
- Mockear `recharts` con stubs mínimos que capturen la prop `cursor` del `Tooltip`; renderizar `AnalyticsOverview` con analítica de un único punto.
- Verificar que el cursor usa `fill: 'transparent'`, que las barras conservan `fill` `#22c55e`/`#ef4444` y que el tooltip personalizado sigue recibiendo los valores de pasados/fallidos.
- **Por qué:** jsdom no calcula layout SVG, por lo que una aserción de píxeles no es viable. La prueba fija la causa raíz (color del cursor) sin depender de geometría.
- **Alternativa descartada:** renderizar el Recharts real con `initialDimension` y simular hover; más frágil y dependiente de coordenadas de jsdom.

## Risks / Trade-offs

- **[El test se acopla a la prop de Recharts]** → Se complementa con verificación visual manual en tema claro/oscuro y con una o varias categorías.
- **[Una futura versión de Recharts podría cambiar el cursor por defecto]** → `fill: 'transparent'` es explícito y la prueba falla si se elimina o se cambia por un color opaco.
- **[Persisten colores inválidos en ejes/grid]** → Fuera de alcance; si se reporta ilegibilidad en tema oscuro, se corrige en un change separado reemplazando `hsl(var(--...))` por `var(--...)`.

## Migration Plan

- Cambio de una línea en UI; sin migración de datos ni de API.
- **Rollback:** restaurar el prop `cursor` anterior.
- **Verificación:** `npm test -- analytics-overview`, `npm run build` y revisión visual de `/reports` en tema claro y oscuro.

## Open Questions

Ninguna.
