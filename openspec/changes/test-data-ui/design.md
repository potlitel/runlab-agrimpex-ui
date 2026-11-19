## Context

El backend expone datos TXT (`/api/txtdata`) y JSON con árbol, lectura/escritura y snapshots (`/api/jsondata*`), gateados por `txtData` y `jsonData`. Ruta `/data` es placeholder. Ver `proposal.md` y specs.

## Goals / Non-Goals

**Goals:**
- Vistas para TXT (tabla) y JSON (árbol + editor + snapshots) según disponibilidad.
- Persistir cambios y reflejar errores/estados de configuración.

**Non-Goals:**
- Transformaciones masivas o validación de esquemas de negocio no provista por backend.
- Gestión de archivos fuera del árbol/base soportado.

## Decisions

- **Composición:** pestañas/secciones por fuente habilitada; cada sección con sus queries/mutaciones (`txtDataApi`, `jsonDataApi`).
- **Editor JSON:** editor de texto/árbol simple con parseo/serialización controlada y manejo de errores de JSON inválido en cliente antes de guardar cuando sea posible.
- **Snapshots:** listado y acciones guardar/eliminar por archivo seleccionado, con confirmación en borrado.

## Risks / Trade-offs

- [Archivos JSON grandes] → edición básica y avisos de rendimiento si aplica.
- [Consistencia de snapshots por archivo] → UI siempre contextualizada al folder/file activo.
