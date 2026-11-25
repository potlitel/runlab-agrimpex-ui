# Proposal

## Why

La gráfica "Tendencia reciente" de la vista Reportes dibuja un rectángulo negro sólido que cubre el área de trazado mientras el tooltip está activo. El origen es el cursor del tooltip de Recharts configurado con `hsl(var(--muted) / 0.35)`: los tokens del tema son valores `oklch(...)`, la sintaxis HSL resultante es inválida y SVG aplica negro por defecto. Con una sola categoría, la banda del cursor ocupa todo el ancho y se percibe como un fondo detrás de las barras.

## What Changes

- Sustituir el relleno del cursor del tooltip del gráfico de tendencia por uno transparente, de modo que no se dibuje ningún fondo opaco sobre el área de trazado.
- Mantener sin cambios los datos, el apilado y los colores verde/rojo de las barras, el contenido del tooltip, los ejes, la leyenda y el layout.
- Incorporar una prueba de regresión que falle si el cursor del tooltip vuelve a renderizar un fondo visible.

## Capabilities

### New Capabilities

- `reports-ui`: presentación de la analítica de reportes; se reutiliza el path de la capacidad de reportes existente como delta porque el inventario principal de specs está vacío.

### Modified Capabilities

_(ninguna: el inventario de `openspec/specs/` está vacío; la capacidad relacionada vive como delta en el change `reports-insights` y se modela aquí como capacidad nueva para preservar el path `reports-ui`.)_

## Impact

- **Código UI:** `src/features/reports/components/analytics-overview.tsx` (prop `cursor` del `Tooltip` del gráfico de tendencia).
- **Pruebas:** nuevo test de regresión del componente de analítica.
- **Sin cambios:** contrato/API, dependencias, datos, colores de barras, tooltip, ejes y layout.
