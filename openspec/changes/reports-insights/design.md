## Context

El backend expone historial, analítica, detalle, assets/descargas y borrado de reportes (`/api/reports*`), sujeto a feature `reports`. La ruta `/reports` es placeholder. Ver `proposal.md` y specs.

## Goals / Non-Goals

**Goals:**
- Visualizar historial y analítica con navegación a detalle y acceso a artefactos.
- Permitir eliminar reportes con confirmación y actualización del estado UI.
- Manejar correctamente ausencia de datos y módulo deshabilitado.

**Non-Goals:**
- Comparación avanzada entre corridas o exportaciones no provistas por la API.
- Edición de reportes.

## Decisions

- **Obtención de datos:** TanStack Query para `list`, `analytics` y `detail` (por id), con invalidación tras borrado.
- **Presentación:** tablas/listas para historial y detalle de tests; gráficos (recharts, ya disponible) para KPIs/timeline/por archivo según forma de `analytics`.
- **Artefactos:** usar URLs de descarga/asset del `reportsApi` (navegación/descarga directa) y, si aplica, visor embebido para HTML/assets en contexto seguro.
- **Feature gating:** consultar flags y/o manejar respuesta de acceso denegado mostrando estado "no disponible".

## Risks / Trade-offs

- [Reportes grandes] → paginación/virtualización ligera si es necesario; inicialmente renderizado acotado.
- [Assets faltantes] → mostrar fallback cuando el recurso no exista.
