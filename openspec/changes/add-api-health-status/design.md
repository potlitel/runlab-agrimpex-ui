# Design

## Context

Ver `proposal.md` para la motivación. Estado observado que condiciona el diseño:

- `server.js` monta `/api/profile-admin` y `/api/system` **antes** de `app.use('/api', resolveProfile)`; cualquier otra ruta `/api` exige la cabecera `X-Profile-Id`. Un healthcheck que dependa de perfil rechazaría el sondeo de Docker.
- El `HEALTHCHECK` actual del Dockerfile consulta `/api/openapi.json`, un endpoint puramente documental que no valida recursos.
- `profileManager` expone `getActiveProfileId()` y `profilePaths(id)`; la configuración de cada perfil incluye `projectPath`, `reportsDir` y `errorImagesPath`, este último usado por la galería de evidencias.
- El cliente UI usa un `api` de Axios con interceptor que inyecta `X-Profile-Id` y React Query para estados remotos; `HeaderTools` es el punto natural de una badge global sin crear una ruta nueva.
- No hay autenticación en la API, por lo que la respuesta de salud no puede filtrar rutas ni configuración sensible.

## Goals / Non-Goals

**Goals:**
- Separar liveness barata de readiness con checks útiles para evidencia.
- Que Docker deje de depender de un endpoint de documentación y no reinicie por checks informativos.
- Que la UI informe del estado del backend sin bloquear pantallas ni duplicar los paneles específicos de Docker/automatización/tests.
- Mantener un contrato estable, seguro y documentado en API y UI.

**Non-Goals:**
- No reparar ni crear directorios automáticamente desde el healthcheck.
- No ejecutar `docker`, Selenium ni Playwright dentro del sondeo.
- No añadir autenticación al endpoint de salud ni exponer paths, tokens o entorno.
- No sustituir los indicadores por feature ni condicionar el arranque de la UI al estado del backend.
- No migrar perfiles, reportes ni assets.

## Decisions

### D1. Dos endpoints en un router sin perfil

`routes/health.js` expondrá `GET /health` y `GET /health/detail` y se montará en `server.js` junto a `/api/profile-admin` y `/api/system`, antes de `resolveProfile`. El sondeo de liveness SHALL NOT exigir `X-Profile-Id`; el detallado puede aceptarlo de forma opcional para elegir el perfil inspeccionado.

**Rationale:** es la única forma de que el healthcheck funcione sin un perfil activo y de que un fallo de configuración de perfil no impida diagnosticar el proceso.

**Alternativas consideradas:** reutilizar `/api/system/updates` (mezcla semántica de actualización de repos con salud) y registrar la ruta después de `resolveProfile` (rompe el healthcheck sin cabecera).

### D2. Criticidad limitada a escritura de directorios

Los checks críticos son `profiles`, `reports` y `evidenceGallery` (esta última solo cuando `errorImagesPath` está configurado). Readiness SHALL comprobar existencia y permiso de escritura y puede crear/borrar un archivo temporal oculto para confirmar la escritura real. Liveness MUST NOT tocar el filesystem.

**Rationale:** `accessSync(W_OK)` no basta con bind mounts y UID del contenedor; una prueba temporal mínima detecta fallos reales de persistencia, que es exactamente lo que impide publicar capturas.

**Alternativas consideradas:** confiar solo en `fs.stat`/`access` (falsos positivos por permisos efectivos) y marcar como crítico cualquier check de feature (provoca flapping).

### D3. Checks informativos con fuentes existentes

`profile`, `projectPath`, `playwrightKit`, `scheduler`, `socket` y `docker/grid` se calculan con lecturas ya disponibles (`profileManager`, configuración guardada, rutas del kit, estado del scheduler y del socket). Un check informativo SHALL devolver `ok`, `degraded` o `not_configured`; MUST NOT cambiar el código de respuesta. Se cachean unos segundos para evitar E/S repetida cuando la UI consulta.

**Rationale:** aporta diagnóstico sin acoplar el healthcheck a Docker/Selenium y sin coste por petición.

**Alternativas consideradas:** consultar `docker ps` y el Grid en cada petición (lento y con efectos laterales) y omitir los checks informativos (deja sin explicación los fallos de evidencia).

### D4. Contrato de respuesta y códigos

`GET /api/health` devuelve `{ status: "ok", uptimeSeconds, version }` con `200`, o falla solo si el proceso no atiende. `GET /api/health/detail` devuelve `{ status, uptimeSeconds, checks: { critical: [...], informational: [...] }, failedChecks: [...] }`; responde `503` únicamente si falla un check crítico. La API SHALL usar identificadores estables de check y mensajes genéricos, sin rutas absolutas.

**Rationale:** un único enum y una lista de ids permiten que la UI pinte la badge sin parsear texto, y evita exponer información interna.

**Alternativas consideradas:** devolver `503` ante cualquier check informativo (reinicios innecesarios) y exponer mensajes de excepción (riesgo de fuga de rutas y secretos).

### D5. Indicador UI no bloqueante

Se añaden `HealthStatus`/`HealthCheck` a `src/types/contract.ts`, `systemApi.health()` y `systemApi.healthDetail()` a `src/lib/api.ts`, y un hook `useHealth` con React Query (`refetchInterval` ~30 s, `retry: 1`). La badge se monta en `HeaderTools`; muestra `OK`, `Degradado` o `Sin conexión`, lista los checks fallidos y ofrece reintento manual. La UI MUST NOT bloquear rutas ni consultas por el resultado del sondeo.

**Rationale:** reutiliza el cliente y el patrón de datos existentes; el header es visible en todas las vistas sin añadir una página de diagnóstico que nadie visitará cuando la API esté caída.

**Alternativas consideradas:** una ruta `/health` exclusiva de la UI (poco descubrible) y un `ErrorBoundary` global (solo reacciona después de fallos, no muestra degradación).

### D6. Documentación, pruebas y despliegue

Swagger documentará ambos endpoints y los esquemas de respuesta; los README de API y UI registrarán el contrato, los checks críticos, los umbrales de polling y el rollback. Las pruebas cubrirán códigos, ausencia de filtrado de paths, `not_configured`, degradación informativa y el cliente/badge de la UI. Tras aplicar el change, se reconstruirán las imágenes y se verificará `/api/health` y `/api/health/detail`.

**Rationale:** el cambio toca contenedor, API y UI; sin prueba de contrato y smoke test posterior al rebuild, el healthcheck podría quedar apuntando al endpoint antiguo.

**Alternativas consideradas:** documentar solo en Swagger (la UI no sabría interpretar la badge) y no reconstruir la imagen (el `HEALTHCHECK` seguiría siendo el antiguo).

## Risks / Trade-offs

- [La prueba de escritura temporal falla por permisos del UID del contenedor] → usar un nombre oculto efímero, limpiar en `finally` y reportar el check como crítico fallido con mensaje genérico.
- [Un check informativo lento bloquea la respuesta detallada] → imponer timeout corto, caché de unos segundos y excluirlos de liveness.
- [La badge sondea con demasiada frecuencia en muchas pestañas] → `refetchInterval` de ~30 s, `retry: 1` y sin sondeo en segundo plano agresivo.
- [El interceptor de Axios añade `X-Profile-Id` a `/health`] → el router ignora la cabecera en liveness y la usa solo como filtro opcional en detalle; se prueba explícitamente.
- [Perfil sin `errorImagesPath`] → check `not_configured`, no crítico; se documenta y se prueba.
- [Rebuild sin verificación] → smoke test de ambos endpoints tras `docker compose up -d --build`.

## Migration Plan

1. **API**: añadir `routes/health.js`, montarlo antes de `resolveProfile`, ampliar `swagger.js` y actualizar el `HEALTHCHECK` del Dockerfile.
2. **UI**: añadir tipos, cliente, hook y badge; conservar los paneles por feature intactos.
3. **Pruebas y documentación**: tests de API y UI, READMEs y verificación de que la respuesta no contiene rutas ni secretos.
4. **Despliegue**: reconstruir imágenes RunLab y comprobar `200` en `/api/health` y `200`/`503` según checks en `/api/health/detail`.
5. **Rollback**: revertir por repositorio. Al volver al healthcheck anterior, `/api/openapi.json` sigue existiendo; la badge se elimina de la UI sin afectar a reportes ni perfiles. No hay migración de datos.
