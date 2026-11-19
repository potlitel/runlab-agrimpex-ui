## 1. api-client — Cliente HTTP tipado

- [x] 1.1 Reescribir `src/lib/api.ts`: instanciar `axios` con `baseURL: import.meta.env.VITE_API_URL || '/api'`, interceptor de request inyecta `X-Profile-Id` desde `profileStore.getState().activeProfileId`; sin interceptor de auth; respuesta devuelve `data` cruda (sin envoltura `{data:...}`); verificar `GET /api/config` con header `X-Profile-Id` → 200.
- [x] 1.2 Añadir `configApi` con `get()`, `save(payload)`, `validate()`, `detectEnv()`, `browse()`; probar `configApi.get()` → objeto de config con `projectPath`, `playwrightCmd`, etc.
- [x] 1.3 Añadir `testsApi` con `collect()`, `cached()`, `run(testIds, project?, grep?, workers?)`; probar `testsApi.collect()` → árbol con `files`, `total`, `projects`; `testsApi.run([...])` → acuse con `reportId`.
- [x] 1.4 Añadir namespaces: `reportsApi`, `envApi`, `profilesApi`, `dockerApi`, `schedulesApi`, `errorsApi`, `automationApi`, `featuresApi`, `txtDataApi`, `jsonDataApi`, `profileAdminApi`, `systemApi` con métodos `get()/list()/create()/update()/delete()` según contrato; probar al menos 3 (p. ej. `reportsApi.list()`, `envApi.get()`, `dockerApi.check()`).
- [x] 1.5 Tipo `ApiError` con `status` y `payload`; interceptor de respuesta lanza `ApiError` en 4xx/5xx sin redirigir; probar `GET /api/unknown` → rechazo con `status` y `payload`.

## 2. socket-client — Conexión Socket.io y eventos

- [x] 2.1 Crear `src/lib/socket.ts`: singleton `io()` con `autoConnect:false`, método `connect()` que abre conexión y `joinProfile(profileId)` que emite `profile:join` y guarda `currentProfileId`; `disconnect()` emite `profile:leave` y cierra; reconexión automática con re-join al perfil activo.
- [x] 2.2 Hook `useSocket(profileId?)` que expone `connect()`, `disconnect()`, `onExecution(handler)`, `onTest(handler)`, `onProgress(handler)`, `onDocker(handler)`, `onAutomation(handler)`, `onEnv(handler)`, `onSchedule(handler)`, `onProfileStatus(handler)`, `onSystem(handler)`; tipado de payloads via `src/types/contract.ts`.
- [x] 2.3 Tipos en `src/types/contract.ts`: interfaces para payloads de `execution:started`, `test:started`, `test:completed`, `progress`, `execution:completed/aborted`, `docker:log/started/exit`, `automation:progress/log/done/failed`, `env:progress/log/venv-done/deps-done/failed`, `schedule:run/log`, `profiles:status`, `system:update`; todos con `profileId` obligatorio.
- [x] 2.4 Reconexión: al reconectar, re-unirse a sala del perfil activo; probar cortar backend, esperar reconectar, verificar que eventos siguen llegando.

## 3. Integración y tipos compartidos

- [x] 3.1 Crear `src/stores/profileStore.ts` (zustand): `activeProfileId`, `profiles[]`, `setActive(id)`, `setProfiles(list)`, `add(profile)`; consumido por `api` interceptor (`getState().activeProfileId`) y por `useSocket` (`joinProfile`).
- [x] 3.2 `src/types/contract.ts`: exportar `Profile`, `TestTree`, `TestRunRequest`, `TestRunResponse`, `ReportSummary`, `ReportDetail`, `Config`, `EnvVar`, `Schedule`, `DockerStatus`, `AutomationStatus`, `ErrorImage`, `TxtData`, `JsonData`, `FeatureFlags`, `SystemUpdate` y todos los payloads de socket; exportar `ApiError` (status, payload, message).
- [x] 3.3 Verificación de tipos: compilar `tsc -b` sin errores; `npm run lint` limpio.

## 4. Verificación end-to-end

- [x] 4.1 Levantar backend (`runlab-agrimpex-api` en :3001) y frontend dev (`runlab-agrimpex-ui` en :5173 con proxy); abrir UI, crear perfil → header `X-Profile-Id` via en `/api/config`; socket conecta y `profile:join` emitido.
- [ ] 4.2 Ejecutar `testsApi.collect()` desde la UI → árbol con projects; `testsApi.run()` con un test → eventos `test:started` → `test:completed` → `progress` → `execution:completed` pintados en consola del hook.
- [ ] 4.3 Cambiar perfil activo → socket sale de sala anterior y entra a nueva; eventos del perfil nuevo llegan, del anterior no.
- [x] 4.4 Compilar `npm run build` → dist sin errores; `npm run lint` limpio.