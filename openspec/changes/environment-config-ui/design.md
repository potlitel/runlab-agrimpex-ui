## Context

El backend expone edición de archivos `.env` (`/api/env`) y entornos guardados por perfil (`/api/profiles`) bajo feature `variables`. La ruta `/env` es placeholder. Ver `proposal.md` y specs.

## Goals / Non-Goals

**Goals:**
- UI para listar/cargar/editar/guardar `.env` y gestionar entornos nombrados del perfil.
- Integrar selección de fuente de variables con el flujo de ejecución.

**Non-Goals:**
- Cifrado/gestión de secretos más allá de lo provisto por el backend.
- Edición de archivos arbitrarios fuera de los endpoints soportados.

## Decisions

- **Modelo:** separar secciones "Archivos .env" y "Entornos guardados" (tabs/paneles) con TanStack Query + mutaciones para persistencia.
- **Edición de variables:** representación en tabla/form (clave, valor, comentario/flag) preservando estructura que acepte el backend.
- **Integración con runs:** exponer selección (envFile/profileName/params) consumible por `execution-dashboard` mediante estado compartido o props/contexto de la vista de ejecución.
- **Gating:** respetar feature `variables` y mostrar estados de no configuración.

## Risks / Trade-offs

- [Formato/orden de variables] → minimizar transformaciones y round-trip según contrato del backend.
- [Concurrencia de edición] → recarga tras guardar y aviso ante errores de escritura.
