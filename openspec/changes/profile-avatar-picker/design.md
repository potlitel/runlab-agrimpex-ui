# Design

## Context

La UI ya tiene un `profileStore` hidratado desde `/api/profile-admin`, dos superficies de alta (`ProfileManagerDialog` y `ProfileAdminSection`), renombrado inline en ambas y un `ProfileHeaderBadge` reutilizado por todas las páginas. `ProfileDropdown` existe pero no está montado. El contrato actual de `Profile` solo garantiza `id` y `name`; la API devuelve las entradas de `profiles/index.json`. Ver `proposal.md` para la motivación y `specs/profile-avatar/spec.md` para el comportamiento exigido.

Restricciones relevantes: React 19 + Vite 7 + TypeScript strict, Radix/shadcn para diálogos y avatares, Vitest + Testing Library, despliegue LAN sin dependencia de servicios externos.

## Goals / Non-Goals

**Goals:**

- Un módulo y un componente compartidos para generar y renderizar avatares, evitando duplicar lógica entre las dos superficies de perfiles.
- Un único flujo de edición (nombre + avatar) reutilizado por el diálogo de gestión y por Ajustes.
- Normalizar perfiles heredados en el límite de la API/Store para que los componentes asuman siempre un avatar válido.
- Mantener el avatar fuera del bundle de datos: se persiste `{ style, seed }`, nunca la imagen.

**Non-Goals:**

- Subida de imágenes, recorte o almacenamiento de binarios.
- Integración con el servicio Gravatar o cualquier API remota de avatares.
- Avatares por entorno, por ejecución o por usuario autenticado.
- Cambiar la semántica de aislamiento de perfiles o la sesión Socket.

## Decisions

### Librería de avatares: DiceBear local

Usar `@dicebear/core` 10 + `@dicebear/styles` 10, generando el SVG en el navegador con `new Avatar(style, { seed, size, backgroundColor })` y `toDataUri()`. Estilos curados: `notionists`, `lorelei`, `micah` y `bottts`.

- **Por qué:** es offline (requisito LAN), determinista por `seed`, MIT/CC y permite una galería de N avatares sin tráfico externo.
- **Alternativas descartadas:** API HTTP de DiceBear (dependencia de Internet y de un tercero); Gravatar real (los perfiles no tienen email y requiere red); `Multiavatar`/`Boring Avatars` (menos variedad de estilos); SVG propio (mantenimiento y accesibilidad).
- **Importación:** los estilos se importan como JSON (`@dicebear/styles/<style>.json`) con `resolveJsonModule: true` en `tsconfig.app.json`. Se fijan versiones exactas para que un cambio de major no altere los avatares ya guardados.
- **Bundle:** los cuatro estilos entran en el chunk principal porque cualquier perfil puede usar cualquiera. Se medirá el impacto; si supera el presupuesto acordado, se reduce el catálogo a dos estilos antes de añadir carga dinámica.

### Modelo de avatar

`Profile.avatar` es `{ style: AvatarStyleId; seed: string }`, donde `AvatarStyleId` es la unión literal de los cuatro estilos. La semilla se genera con `crypto.randomUUID()` cuando existe y, si no (contexto no seguro en LAN), con `Math.random().toString(36)` + timestamp. El backend valida estilo y longitud; la UI solo envía la referencia.

- **Por qué:** el índice de perfiles queda pequeño y estable, y el mismo par estilo+seed reproduce el avatar en cualquier cliente.
- **Fondo:** se aplica una paleta pastel determinista derivada de la seed para asegurar contraste, sin persistir el color.
- **Fallback:** `normalizeProfileAvatar` usa `{ style: 'notionists', seed: profile.id }` cuando falta o es inválido. Se aplica al hidratar el store y a las respuestas de la API, de modo que los componentes nunca reciben `avatar` ausente.

### Galería modal compartida

`AvatarPickerDialog` recibe `open`, `onOpenChange`, `value` y `onConfirm`. Muestra 24 candidatos (4×6 en desktop, 4 columnas en móvil) del estilo activo, un selector de estilo (Tabs), "Generar otros" para renovar las seeds y una previsualización de la selección. El avatar actual se incluye como primer candidato cuando el estilo coincide. La confirmación se habilita solo con una selección; cancelar no muta el formulario.

- **Por qué un modal:** el requisito pide navegar N opciones sin abandonar el formulario; Radix Dialog ya aporta foco atrapado, Escape y portal.
- **Accesibilidad:** cada candidato es un `button` con `aria-label` y `aria-pressed`; el modal usa `DialogTitle`/`DialogDescription`; la imagen es decorativa si el nombre está visible y usa `alt` cuando es la única etiqueta.
- **Generación:** se memoiza por `style + seed`; regenerar crea 24 seeds nuevas en estado local y no toca la selección confirmada hasta pulsar "Confirmar".

### Un solo flujo de edición y un campo de avatar reutilizable

Se crea `ProfileAvatarField` (preview + botón "Elegir/Cambiar avatar" + validación) y `EditProfileDialog` (nombre + avatar + guardar). `ProfileManagerDialog` y `ProfileAdminSection` usan ambos componentes; el renombrado inline desaparece. La creación usa `ProfileAvatarField` y deshabilita "Crear" hasta tener nombre y avatar.

- **Por qué:** elimina la duplicación actual de renombrado y garantiza que ambas superficies apliquen la misma regla de obligatoriedad.
- **Duplicado:** se mantiene la acción de un clic; la API copia el avatar de origen, por lo que el perfil resultante nunca queda sin avatar. No se abre el picker porque el avatar ya está definido. Si en el futuro se quiere elegir uno distinto al duplicar, se reutiliza `EditProfileDialog` en modo duplicado.
- **Errores:** si la API falla, el diálogo conserva nombre, avatar y selección, muestra el error con `sonner` y permite reintentar.

### Renderizado consistente

`ProfileAvatar` envuelve `Avatar`/`AvatarImage`/`AvatarFallback` de Radix: genera el data URI con `useMemo` y muestra iniciales (hasta dos) si la generación falla. Se usa en el sidebar (perfil activo y cada opción), en la lista de gestión, en Ajustes, en `ProfileHeaderBadge` y en el estado vacío. `ProfileDropdown` no se monta hoy, pero se actualiza para leer el perfil activo y su avatar en lugar del avatar estático, evitando que quede divergente si se vuelve a usar.

### Contrato y capa API

`Profile.avatar` pasa a ser obligatorio en el tipo; `profileAdminApi.list/create/update/duplicate` normalizan la respuesta y `profileStore` normaliza defensivamente. Se añade `update(id, { name?, avatar? })` contra `PATCH /api/profile-admin/:id`; `rename` se conserva por compatibilidad pero la UI deja de usarlo. `create` recibe `{ avatar, testDataSource? }` y `duplicate` acepta un avatar opcional de override.

## Risks / Trade-offs

- [Bundle inicial por los cuatro estilos JSON] → medir con `npm run build`; si excede el presupuesto, recortar estilos o cargar el picker/estilos bajo demanda.
- [Cambios visuales entre versiones de DiceBear] → versiones exactas y pruebas de determinismo con la misma seed.
- [Perfiles heredados sin avatar] → normalización en API y Store con fallback determinista; la UI nunca asume ausencia.
- [Despliegue desacompasado UI/API] → la UI nueva requiere `PATCH /:id` y que el alta acepte avatar; desplegar ambos cambios juntos o API primero solo si la UI anterior se actualiza en la misma ventana.
- [Contexto no seguro sin `crypto.randomUUID`] → fallback a `Math.random` + timestamp; la seed no es un secreto.
- [Colisiones de IDs internos de SVG] → se usa `<img src="data:...">`, no SVG inline, por lo que no hay colisión de `<defs>`.
- [Accesibilidad de avatares decorativos] → nombre siempre visible junto al avatar; `alt` solo cuando el avatar es la única etiqueta.

## Migration Plan

1. Publicar la API `profile-avatar-persistence` con normalización de perfiles heredados y validación; el alta sin avatar pasa a `400`.
2. Publicar la UI con normalización local; los perfiles existentes muestran el fallback hasta que se editen.
3. Rollback: la UI anterior ignora el campo `avatar` de las respuestas; el índice sigue siendo JSON compatible. Si se revierte la API, los avatares quedan en el índice pero la UI nueva no puede persistir cambios hasta restaurar el endpoint.
