# Proposal

## Why

La badge del header avisa del estado del backend, pero no explica qué check falló ni distingue un problema crítico de una configuración incompleta. Después de añadir los endpoints de salud, los operadores necesitan una vista donde diagnosticar `failedChecks`, uptime y la separación entre checks críticos e informativos sin que el diagnóstico se convierta en una pantalla de carga ni bloquee el resto del dashboard.

## What Changes

- Añadir la ruta `/health` con una vista dedicada que reutiliza `useHealth` y el mismo contrato `GET /api/health/detail` que la badge, sin introducir un segundo cliente ni otra lógica de sondeo.
- Mostrar estado general, tiempo activo, `failedChecks` y dos listados (críticos e informativos) con etiquetas legibles para los identificadores estables y los estados `ok`, `degraded`, `unhealthy` y `not_configured`.
- Incluir un botón **Actualizar** que dispara `refresh()` y mantiene el sondeo automático de 30 s; en caso de desconexión, avisar sin vaciar la vista ni condicionar otras queries.
- Asignar un icono Lucide a cada check y badges con colores semánticos (verde `ok`, gris/amarillo `not_configured`, rojo error), acompañados siempre de su etiqueta textual para no depender solo del color.
- Añadir un mini-gráfico de tendencia (sparkline/área) del uptime o la latencia reciente y un indicador radial con el porcentaje de checks correctos, derivados de las respuestas ya consultadas y sin nuevo endpoint.
- Mostrar una cuenta regresiva hasta el próximo sondeo de 30 s y un punto parpadeante mientras la consulta está en curso, compartiendo el estado existente sin duplicar el intervalo.
- Mostrar el tiempo relativo desde la última verificación de cada check y un panel expandible con el mensaje genérico recibido; la vista MUST NOT mostrar stack traces, rutas, tokens ni valores de entorno.
- Ofrecer una acción rápida «Configurar ahora» en los checks `not_configured` que abra la sección de ajustes correspondiente.
- Registrar la navegación en **Sistema > Salud** y documentar la vista en el README de la UI.
- Documentar en el README el ciclo operativo usado para publicar este tipo de cambios: construir las imágenes y recrear los contenedores con `docker compose up -d --force-recreate runlabqa-api runlabqa-ui`.
- No modificar los endpoints, el `HEALTHCHECK` de Docker, los perfiles ni el contrato de salud; la vista es aditiva y no introduce cambios rupturistas.

**BREAKING**: ninguno.

## Capabilities

### New Capabilities
- `runtime-health`: estado de liveness/readiness del backend RunLab y su representación en la UI; este delta amplía la capability propuesta en `add-api-health-status` con la vista de diagnóstico dedicada.

### Modified Capabilities
Ninguna: no existen specs maestras en `openspec/specs/`; los requisitos previos viven como deltas en changes aún no archivados.

## Impact

- **UI RunLab** (este repo, React/Vite): nuevos `src/features/health/*` y `src/routes/health.tsx`, regeneración de `src/routeTree.gen.ts`, entrada en `src/components/layout/data/sidebar-data.ts` y tests de la vista. Las mejoras visuales se implementan en React con los componentes existentes de shadcn/ui y Lucide; no se introduce Angular ni `src/app/modules/health/`.
- **Dependencias**: se usa `recharts`, ya presente en `package.json`, para el sparkline y el indicador radial; no se añaden paquetes nuevos.
- **Contrato**: reutiliza `HealthDetail`, `HealthCheck` y `systemApi.healthDetail()`; sin cambios en la API ni en el healthcheck del contenedor.
- **Documentación**: `README.md` de la UI (vista de salud y ciclo build + recreate de contenedores).
- **Operación**: requiere reconstruir la imagen de la UI para hornear la nueva ruta y recrear los contenedores; no hay migración de datos ni cambios en `perfil-1`.
