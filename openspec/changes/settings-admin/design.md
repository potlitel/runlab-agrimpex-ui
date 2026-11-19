## Context

Ajustes concentra múltiples dominios backend: `/api/config`, `/api/features`, `/api/automation/*`, `/api/profile-admin/*` y `/api/system*` con eventos asociados. Ruta `/settings` es placeholder. Ver `proposal.md` y specs.

## Goals / Non-Goals

**Goals:**
- Organizar en secciones claras (Proyecto, Módulos/Features, Automatización, Perfiles, Sistema) las operaciones soportadas.
- Mostrar progreso/logs de operaciones largas (automatización/env/system update) y manejar restricciones (conflictos, token de sistema).

**Non-Goals:**
- Exponer operaciones no soportadas por el backend ni eludir protecciones (p. ej. `UPDATE_TOKEN`).
- Rediseñar flujos transversales ya cubiertos (selector global de perfil) salvo integración/coherencia.

## Decisions

- **Arquitectura UI:** página de Ajustes con navegación interna (tabs/side sections) y componentes por dominio; mutaciones con feedback (sonner) e invalidación de queries relevantes.
- **Automatización y sistema:** suscripciones socket para progreso/logs y estados derivados de `/automation/status` y respuestas de API.
- **Perfil admin:** reutilizar capacidades de `profile-session-ui` o compartir componentes para evitar duplicación, manteniendo una vista de administración completa en Ajustes.
- **Seguridad UX:** solicitar token de actualización solo cuando se ejecute la acción, sin persistirlo en cliente más allá de lo necesario.

## Risks / Trade-offs

- [Superficie amplia] → implementación incremental por secciones con estados de carga/error independientes.
- [Operaciones mutuamente excluyentes] → reflejar flags `installing/pulling/envBusy` y errores 409.
