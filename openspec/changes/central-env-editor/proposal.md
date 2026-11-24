# Proposal

## Why

En el despliegue centralizado, el `.env` del stack solo se puede editar con acceso al servidor, y las variables `VITE_*` se hornean en el bundle: cambiar el hostname obliga a reconstruir la UI. Los usuarios que solo tienen el navegador no pueden configurar la URL pública, el token de agentes ni el transporte, aunque esos valores son parte de la operación diaria del dashboard.

## What Changes

- Añadir una vista de administración del stack que muestre y permita editar solo un conjunto permitido de variables del `.env` central (URLs públicas, puertos, transporte, rutas de datos y token del agente).
- Exponer endpoints de lectura/escritura con allowlist, validación de claves y valores, escritura atómica, copia de seguridad antes de guardar y rollback. Los secretos existentes **nunca** se devuelven al navegador: se muestran como «configurado» y se sobrescriben solo si el usuario escribe un valor nuevo.
- Proteger la administración con el token ya existente (`UPDATE_TOKEN`): sin él, los endpoints quedan deshabilitados (fail closed), igual que `/api/system/update`.
- Resolver las URLs públicas de API y socket en **tiempo de ejecución**, no en el bundle: la UI las obtiene de un recurso servido por el stack, con fallback al valor horneado actual para no romper despliegues existentes.
- Distinguir los cambios que se aplican al instante de los que requieren recrear contenedores (token, bindings, puertos), mostrando el estado «pendiente de aplicar» y la acción exacta a ejecutar, sin exponer secrets en la respuesta.
- Mantener separada esta configuración del stack de los `.env` **del proyecto de pruebas**, que ya se gestionan en `environment-ui`.

## Capabilities

### New Capabilities
- `central-stack-config`: administración segura de la configuración central del stack y resolución en runtime de las URLs públicas consumidas por la UI.

### Modified Capabilities
_(ninguna — `environment-ui` cubre los `.env` del proyecto de pruebas y no cambia; no existen specs canónicas en `openspec/specs/`)_

## Impact

- **UI (`runlab-agrimpex-ui`):** nueva vista bajo Ajustes/Administración, cliente HTTP para los endpoints de configuración y bootstrap que lee la configuración pública en runtime (`src/lib/api.ts`, `src/lib/socket.ts`).
- **API (`runlab-agrimpex-api`):** nuevo módulo de configuración del stack (lectura, validación, escritura atómica, backup/rollback, gate por `UPDATE_TOKEN`) y endpoint de configuración pública.
- **Despliegue:** `docker-compose.yml` debe dar acceso controlado al `.env` central y publicar el recurso de configuración en runtime a la UI; `Dockerfile.npm` / entrada del contenedor de UI puede necesitar un punto de montaje adicional.
- **Seguridad:** token del agente y credenciales de proxy se tratan como write-only; se auditan las escrituras y se evita que valores con saltos de línea o claves arbitrarias alteren el compose.
- **Documentación:** `README.md` debe actualizar el apartado de variables horneadas y el procedimiento de despliegue con hostname real.
