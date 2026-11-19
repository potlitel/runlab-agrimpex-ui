## Context

El backend lista y sirve imágenes de fallos (`/api/errors/images`, `/api/errors/image`) y puede reportar carpeta no configurada/inexistente; el módulo depende de `errorImages`. Ruta `/errors` es placeholder. Ver `proposal.md` y specs.

## Goals / Non-Goals

**Goals:**
- Presentar galería/listado con metadatos y visor de imagen.
- Representar estados `configured/missing/empty` y errores de carga.
- Respetar disponibilidad del módulo.

**Non-Goals:**
- Anotación/edición de imágenes o gestión de archivos en disco.
- Correlación automática avanzada con reportes (salvo enlaces simples si el dato lo permite en el futuro).

## Decisions

- **Carga:** TanStack Query para `images`; render de miniaturas/lista ordenada por fecha y visor (dialog/panel) usando `errorsApi.imageUrl`.
- **Estados UI:** mensajes dedicados para no configurado, carpeta faltante, sin evidencias y error de fetch.
- **Rendimiento:** carga diferida de imágenes en galería cuando el volumen sea alto.

## Risks / Trade-offs

- [Muchas imágenes] → paginación o carga incremental en UI.
- [Tipos/tamaños variables] → ajuste de contenedor y manejo de fallo de carga por imagen.
