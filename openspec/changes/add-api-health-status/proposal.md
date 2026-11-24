# Proposal

## Why

El `HEALTHCHECK` del contenedor API consulta `/api/openapi.json`, que solo prueba que Express responde; no detecta que los directorios de perfiles, reportes o evidencias estén escribibles, ni que el perfil activo, el kit de Playwright o el scheduler estén disponibles. Después de publicar capturas validadas, RunLab necesita saber si el backend está realmente en condiciones de persistirlas y servirlas, y la UI necesita un indicador que explique por qué una corrida no entrega evidencia.

## What Changes

- Añadir `GET /api/health` como sondeo de liveness barato, sin perfil y sin efectos secundarios, registrado antes del middleware `resolveProfile`.
- Añadir `GET /api/health/detail` como sondeo de readiness: distingue checks **critical** (directorios de perfiles, reportes y galería de evidencias cuando está configurada) de checks informativos (perfil activo, `projectPath`, kit de Playwright, scheduler, socket.io y Docker/Grid según features).
- Devolver `200` cuando los checks críticos pasan y `503` cuando fallan; los checks informativos SHALL NOT cambiar el código de respuesta ni reiniciar el contenedor.
- Reducir la respuesta a estados y mensajes genéricos: la API MUST NOT exponer rutas absolutas, tokens ni valores de entorno.
- Actualizar el `HEALTHCHECK` del Dockerfile para usar `/api/health` y documentar ambos endpoints en Swagger.
- Extender el contrato UI con `HealthStatus` y un cliente `systemApi.health()`/`healthDetail()`; mostrar una badge no bloqueante en el header con el estado del backend, checks fallidos y reintento manual.
- Añadir pruebas de API y UI, y documentar el contrato, los umbrales y el rollback en los README de API y UI.

**BREAKING**: ninguno. Los endpoints son aditivos y la badge UI es informativa; `/api/openapi.json` se conserva para documentación.

## Capabilities

### New Capabilities
- `runtime-health`: estado de liveness/readiness del backend RunLab y de los recursos necesarios para ejecutar tests y entregar evidencia, junto con su representación no bloqueante en la UI.

### Modified Capabilities
Ninguna: el inventario de specs de este root está vacío y no hay requirements previos que cambiar.

## Impact

- **API RunLab** (`runlab-agrimpex-api`): nuevo `routes/health.js` montado antes de `resolveProfile` en `server.js`, `swagger.js`, `Dockerfile` y tests del contrato de respuesta/códigos.
- **UI RunLab** (este repo): `src/types/contract.ts`, `src/lib/api.ts`, un hook de React Query, `src/components/layout/header-tools.tsx` o `header.tsx` para la badge, y tests de cliente/componente.
- **Contratos**: `GET /api/health`, `GET /api/health/detail`, `HealthStatus`, `HealthCheck`; sin cambios en perfiles, reportes ni assets.
- **Operación**: el healthcheck dejará de depender de un endpoint de documentación; al reconstruir la imagen se verificará `/api/health` y `/api/health/detail` con un perfil activo y con la galería de evidencias configurada.
- **Organización**: los artefactos OpenSpec viven en este repo, pero la implementación abarca API y UI con versionado independiente; no se prevén migraciones de datos.
