# Tasks

## 1. API: liveness sin perfil

- [x] 1.1 Crear `routes/health.js` con `GET /health` que devuelva `{ status: 'ok', uptimeSeconds, version }` sin exigir `X-Profile-Id` ni acceder al filesystem; verificar con un test que responde `200` sin cabecera de perfil y que el payload no contiene rutas.
- [x] 1.2 Montar el router en `server.js` antes de `app.use('/api', resolveProfile)`, junto a `/api/profile-admin` y `/api/system`; verificar con `curl -i http://localhost:3001/api/health` sin cabeceras y comprobando que `/api/system/updates` sigue respondiendo.
- [x] 1.3 Documentar `/api/health` en `swagger.js` y en el README de la API, indicando que no requiere perfil; verificar que `/api/openapi.json` incluye el path y que la sección de health del README coincide con la respuesta real.

## 2. API: readiness y contrato seguro

- [x] 2.1 Implementar en `routes/health.js` los checks críticos `profiles`, `reports` y `evidenceGallery` (solo si `errorImagesPath` está configurado), con prueba temporal de escritura limpiada en `finally`; verificar con tests que directorios temporales válidos devuelven `200`/`ok` y uno no escribible devuelve `503`/`unhealthy`.
- [x] 2.2 Implementar checks informativos `profile`, `projectPath`, `playwrightKit`, `scheduler`, `socket` y `docker/grid` con caché corta y estado `not_configured` cuando aplique; verificar con un test que un fallo informativo devuelve `200`/`degraded` y que `errorImagesPath` vacío no cuenta como crítico.
- [x] 2.3 Fijar el contrato de respuesta con `status` (`ok`/`degraded`/`unhealthy`), `failedChecks` por identificadores estables y sin rutas, tokens ni mensajes de excepción; verificar con un test que `JSON.stringify(response)` no contiene la ruta temporal ni variables de entorno.
- [x] 2.4 Documentar `/api/health/detail`, criticidad, códigos y checks `not_configured` en `swagger.js` y README de la API; verificar que la documentación enumera los mismos ids que devuelve el endpoint.

## 3. Contenedor: healthcheck

- [x] 3.1 Cambiar el `HEALTHCHECK` del Dockerfile para consultar `/api/health` en lugar de `/api/openapi.json`; verificar con `docker inspect` que el comando usa `/api/health` y que `/api/openapi.json` sigue disponible para documentación.
- [x] 3.2 Documentar en el README de la API el cambio del healthcheck y su rollback al endpoint anterior; verificar que el procedimiento reproduce un `docker inspect` y una respuesta `200`.

## 4. UI: contrato, cliente e indicador

- [x] 4.1 Añadir `HealthStatus`, `HealthCheck` y `HealthDetail` a `src/types/contract.ts` y `systemApi.health()`/`healthDetail()` a `src/lib/api.ts`; verificar con `npx tsc -b --pretty false` y un test de cliente que ambas URLs se construyen sobre `VITE_API_URL`.
- [x] 4.2 Crear `useHealth` con React Query (`refetchInterval` ~30 s, `retry: 1`) sin bloquear otras queries; verificar con un test que expone `status`, `failedChecks` y `refresh` y que un error no lanza excepción a la UI.
- [x] 4.3 Montar una badge en `HeaderTools` que muestre `OK`/`Degradado`/`Sin conexión`, liste checks fallidos y ofrezca reintento manual; verificar con tests de render que degrade y desconexión no vacían la pantalla y que el botón dispara `refresh`.
- [x] 4.4 Documentar en el README de la UI el contrato de salud, el intervalo de sondeo y el rollback de la badge; verificar que la documentación coincide con los estados del tipo `HealthStatus`.

## 5. Verificación integral y cierre

- [x] 5.1 Reconstruir imágenes con `docker compose up -d --build runlabqa-api runlabqa-ui` y verificar que el contenedor API queda `healthy`, `GET /api/health` devuelve `200` y `GET /api/health/detail` devuelve `200` con perfil activo.
- [x] 5.2 Verificar en `http://localhost:3002` que la badge muestra el estado real, que las vistas siguen cargando con `status: degraded` simulado y que el reintento manual actualiza el indicador.
- [x] 5.3 Verificar coherencia final: `openspec validate add-api-health-status --type change --strict --json` sin issues, tests completos de API y UI en verde y `git status --short` solo con los archivos previstos.

## Workflow follow-up

- Revisar y aprobar los artefactos antes de aplicar el change.
- Archivar el change una vez completada la verificación integral.
