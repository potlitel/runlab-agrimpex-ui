# Proposal

## Why

El dashboard opera con múltiples perfiles, pero hoy solo se distinguen por nombre e ID: el selector, la gestión y el header no ofrecen una señal visual para reconocerlos de un vistazo y no existe forma de personalizarlos. Se necesita que todo perfil creado o editado tenga un avatar obligatorio, elegido desde una galería modal de N opciones.

## What Changes

- Incorporar `@dicebear/core` y `@dicebear/styles` (v10) para generar avatares SVG deterministas en el navegador, sin llamadas a servicios externos.
- Crear `src/lib/profile-avatar.ts` con los estilos permitidos, la generación de data URIs, la creación de candidatos aleatorios y el fallback por iniciales.
- Crear el componente compartido `ProfileAvatar` (Radix Avatar + DiceBear) y el `AvatarPickerDialog` con galería de N avatares, selector de estilo, acción "Generar otros" y confirmación explícita.
- Hacer obligatoria la selección de avatar al crear un perfil en las dos superficies existentes: diálogo "Gestionar perfiles" y Ajustes > Perfiles.
- Reemplazar el renombrado inline por un diálogo "Editar perfil" con nombre y avatar, obligatorio en ambas superficies.
- Mostrar el avatar en el selector de perfil del sidebar, en cada opción del dropdown, en la lista de gestión, en Ajustes > Perfiles y en `ProfileHeaderBadge`.
- Extender el contrato local (`Profile.avatar`) y `profileAdminApi` para crear, actualizar y duplicar perfiles con avatar.
- Añadir pruebas del generador, del picker y de los flujos de alta/edición.
- Depender del cambio espejo `profile-avatar-persistence` en `runlab-agrimpex-api`, que persiste y valida el avatar; sin ese backend la UI no puede guardarlo.

## Capabilities

### New Capabilities

- `profile-avatar`: selección obligatoria, generación, renderizado y actualización de avatares de perfil en la UI.

### Modified Capabilities

<!-- No hay specs principales existentes; el cambio introduce una capability nueva. -->

## Impact

- **Dependencias**: `@dicebear/core`, `@dicebear/styles`; `resolveJsonModule` en `tsconfig.app.json`.
- **Código**: `src/types/contract.ts`, `src/lib/api.ts`, `src/lib/profile-avatar.ts` (nuevo), `src/components/profile-avatar.tsx` (nuevo), `src/features/profile-session/profile-switcher.tsx`, `profile-manager-dialog.tsx`, `src/features/settings/components/profile-admin-section.tsx`, `src/components/profile-header-badge.tsx`.
- **Contrato**: `Profile.avatar = { style, seed }`; `POST /api/profile-admin`, `PATCH /api/profile-admin/:id` y `POST /api/profile-admin/:id/duplicate` aceptan/devolveren avatar.
- **Sistemas**: API `runlab-agrimpex-api` (cambio `profile-avatar-persistence`), persistencia en `profiles/index.json`.
