# Tasks

## 1. Base de avatares y contrato

- [x] 1.1 Añadir `@dicebear/core@10.7.0` y `@dicebear/styles@10.6.0` con versiones exactas, y habilitar `resolveJsonModule` en `tsconfig.app.json`; verificar con `npm ls @dicebear/core @dicebear/styles` y `npx tsc -p tsconfig.app.json --noEmit`.
- [x] 1.2 Crear `src/lib/profile-avatar.ts` con `AvatarStyleId`, catálogo de estilos, `normalizeProfileAvatar`, `createAvatarSeed`, `avatarToDataUri`, iniciales y paleta de fondo; cubrir con `src/lib/profile-avatar.test.ts` (determinismo, fallback, iniciales, seed sin `crypto.randomUUID`) y ejecutar `npm test -- profile-avatar`.
- [x] 1.3 Extender `src/types/contract.ts` con `ProfileAvatar` y `Profile.avatar` obligatorio, y adaptar `profileAdminApi` (`list`, `create`, `update`, `duplicate`) para normalizar respuestas y enviar `{ style, seed }`; cubrir con pruebas de mapeo y ejecutar `npm test -- api.profile-avatar`.
- [x] 1.4 Normalizar perfiles heredados en `profileStore` al hidratar y en cada mutación; verificar con una prueba que un perfil sin `avatar` recibe el fallback determinista y que `add`/`update` conservan el avatar.

## 2. Componentes compartidos

- [x] 2.1 Crear `src/components/profile-avatar.tsx` que envuelva `Avatar`/`AvatarImage`/`AvatarFallback`, genere el data URI con `useMemo` y muestre iniciales si falla; verificar con prueba de render con avatar y sin avatar.
- [x] 2.2 Crear `src/features/profile-session/avatar-picker-dialog.tsx` con 24 candidatos, selector de estilo, "Generar otros", selección con `aria-pressed`, confirmar y cancelar; verificar con pruebas de apertura, regeneración, cambio de estilo y cancelación sin mutación.
- [x] 2.3 Crear `src/features/profile-session/profile-avatar-field.tsx` (preview, botón Elegir/Cambiar, mensaje de obligatorio) que abra el picker y propague la selección; verificar que sin valor muestra validación y que confirmar actualiza el campo.

## 3. Flujos de alta y edición

- [x] 3.1 Crear `src/features/profile-session/edit-profile-dialog.tsx` con nombre y avatar, guardado vía `PATCH /api/profile-admin/:id`, actualización del store e invalidación de `['profiles']`; verificar que no guarda sin avatar y que conserva el formulario ante error.
- [x] 3.2 Actualizar `ProfileManagerDialog`: incorporar `ProfileAvatarField` en el alta, bloquear "Crear" sin avatar y reemplazar el renombrado inline por `EditProfileDialog`; verificar los flujos de alta y edición con pruebas de componente.
- [x] 3.3 Actualizar `ProfileAdminSection`: incorporar `ProfileAvatarField` en el alta, bloquear la creación sin avatar, eliminar el renombrado inline y usar `EditProfileDialog`; verificar con pruebas de creación, edición y error de API.
- [x] 3.4 Renderizar `ProfileAvatar` en `ProfileSwitcher` (perfil activo y opciones del dropdown), en la lista de gestión, en Ajustes, en `ProfileHeaderBadge` y en `ProfileDropdown` (hoy no montado, sin avatar estático); verificar que el cambio de perfil activo actualiza el avatar del sidebar/header y que el fallback no rompe el layout.
- [x] 3.5 Documentar en `README.md` el campo `avatar` del perfil, su forma `{ style, seed }`, la obligatoriedad en alta/edición y la dependencia del cambio de API; verificar que la sección describe los endpoints usados.

## 4. Integración y verificación

- [x] 4.1 Ejecutar `npm test` y corregir cualquier regresión en pruebas existentes de perfiles, ejecución y ajustes.
- [x] 4.2 Ejecutar `npm run lint` y `npm run build`; verificar que el build incluye los JSON de DiceBear y registrar el tamaño del chunk para decidir si se recorta el catálogo de estilos.
- [x] 4.3 Con la API `profile-avatar-persistence` aplicada, probar manualmente crear, editar, duplicar, reiniciar el backend y recargar la UI; verificar que el avatar persiste y que un perfil heredado muestra el fallback.

## Workflow follow-up

- Archivar el cambio cuando la revisión y las pruebas estén aprobadas.
- Sincronizar la spec `profile-avatar` a las specs principales al archivar.
