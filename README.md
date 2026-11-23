# RunLab Agrimpex — UI

Frontend del dashboard QA **RunLab Agrimpex** para gestionar perfiles, configurar proyectos de automatización, explorar/ejecutar tests Playwright y consultar resultados/evidencias.

- **Stack:** React 19 + TypeScript + Vite + TanStack Router/Query/Table + shadcn/ui + Tailwind CSS 4.
- **Backend hermano:** `runlab-agrimpex-api` (Express + Socket.io), que expone la API REST, emite eventos en tiempo real y sirve el build en producción.
- **Línea base:** esqueleto UI de `DAM.Frontend.React` (plantilla [shadcn-admin](https://github.com/satnaing/shadcn-admin), MIT © Sat Naing; adaptaciones © potlitel).

## Índice

- [Arquitectura](#arquitectura)
- [Requisitos](#requisitos)
- [Ejecución manual](#ejecución-manual)
- [Ejecución con Docker](#ejecución-con-docker)
- [Ventaja de la imagen Playwright](#ventaja-de-la-imagen-playwright)
- [Vistas principales](#vistas-principales)
- [Configuración del proyecto y `playwrightCmd`](#configuración-del-proyecto-y-playwrightcmd)

## Arquitectura

```text
runlab-agrimpex-ui (React, dev :5173 / dist en prod)
        │  HTTP /api  +  Socket.io (/socket.io)
        ▼
runlab-agrimpex-api (Express + Socket.io, :3001)
        │
        ├─ Perfiles/workspaces en disco (profiles/<id>/...)
        ├─ Colección y ejecución Playwright sobre projectPath
        └─ Reportes, entornos, Docker, schedules, datos y evidencia
                │
                ▼
      Proyecto de automatización Playwright (AUT / suite)
```

- En desarrollo, Vite hace proxy de `/api` y `/socket.io` hacia `http://localhost:3001`.
- En producción, el backend sirve el `dist` del frontend.
- La sesión de trabajo opera por **perfil activo** (sin autenticación en esta etapa): la UI envía `X-Profile-Id` y se suscribe a la sala Socket.io `profile:<id>`.

## Requisitos

- Node.js 22.12+ (Vite 7 / `@vitejs/plugin-react-swc`; el Dockerfile usa `node:22-alpine`)
- npm
- API en ejecución (`runlab-agrimpex-api`, por defecto en `:3001`)

## Ejecución manual

Modo recomendado para **desarrollar la UI**: Vite sirve React en `:5173` y proxyiza las llamadas a la API, así que no hace falta configurar URLs ni Docker.

### 1) Requisitos

| Herramienta | Versión | Para qué |
|---|---|---|
| Node.js | **22.12+** (Vite 7 / `@vitejs/plugin-react-swc`) | Dev server y build |
| npm | el que traiga Node | Instalar con `package-lock.json` |
| API | `runlab-agrimpex-api` en `:3001` | REST + Socket.io |

### 2) Instalar y arrancar

```bash
cd runlab-agrimpex-ui
npm ci                 # reproducible: usa package-lock.json
npm run dev            # http://localhost:5173
```

Para exponer el dev server en la red:

```bash
npm run dev -- --host 0.0.0.0
```

En desarrollo **no definas `VITE_API_URL`**: `src/lib/api.ts` usa `/api` relativo y `vite.config.ts` redirige `/api` y `/socket.io` (con `ws: true`) a `http://localhost:3001`. El socket se conecta al mismo origen de la página y hace `profile:join` con el perfil activo.

### 3) Si la API está en otro host/puerto

```bash
cp .env.example .env
# VITE_API_URL=http://10.0.0.50:3001/api
# VITE_SOCKET_URL=http://10.0.0.50:3001   # opcional: se deriva de VITE_API_URL
npm run dev
```

También puedes editar directamente el `target` del proxy en `vite.config.ts`. Con `VITE_API_URL` absoluta las peticiones son cross-origin; la API tiene CORS abierto (uso en red de confianza). Si solo cambias `VITE_SOCKET_URL`, reinicia Vite.

### 4) Verificación y quality gates

```bash
npm run lint
npx tsc -b --noEmit
npm run build
```

`npm run build` genera `dist/` con `tsc -b && vite build`. Para probar ese build con `vite preview`, ten en cuenta que **preview no usa el proxy de dev**, así que hornea la URL absoluta:

```bash
VITE_API_URL=http://localhost:3001/api VITE_SOCKET_URL=http://localhost:3001 npm run build
npm run preview        # http://localhost:4173
```

Comprueba en el navegador que el header muestra el perfil activo y que **Tests** lista specs: eso confirma REST + Socket.io.

### 5) Producción local servida por la API

Si prefieres un solo puerto, construye la UI **sin `VITE_API_URL`** (para que use `/api` relativo) y deja que el backend sirva `dist/`:

```bash
npm run build
cd ../runlab-agrimpex-api
QADASH_DIST_DIR=../runlab-agrimpex-ui/dist npm start
# http://localhost:3001
```

Ver [Ejecución manual de la API](../runlab-agrimpex-api/README.md#ejecución-manual).

---

## Ejecución con Docker

El stack completo (API + UI) se levanta desde la **raíz del workspace** (`qa-dashboard/`), no desde esta carpeta. El build ocurre íntegramente dentro de Docker: no hace falta Node/npm en el host ni copiar `node_modules`.

### 1) Arranque estándar

```bash
cd /home/potlitel/Trabajo/EICMA/Agrimpex/qa-dashboard   # o: cd .. desde este repo
cp .env.example .env        # opcional: los defaults ya funcionan
docker compose up -d --build
docker compose ps
```

| Servicio | Contenedor | URL desde el host | Observaciones |
|---|---|---|---|
| `qadash-api` | `qadash-api` | <http://localhost:3001> · `/api/docs/` | Healthcheck en `/api/openapi.json`; datos en volumen `qadash-data` |
| `qadash-ui` | `qadash-ui` | <http://localhost:3002> | Espera a que la API esté `healthy`; sirve `dist` en `:3000` dentro del contenedor |

> ⚠️ `http://localhost:3000` es el stack DAM de referencia (`dam-frontend`), no este dashboard. Usa **`3002`**. Si necesitas sí o sí el `3000`, detén `dam-frontend` y pon `UI_PORT=3000` en `.env`.

La UI se construye con `Dockerfile.npm` (multi-stage, patrón del repo `DeviceActivityMonitor`, rama `feat/docker-onboarding`): `npm ci` + `tsc -b && vite build` en la fase build y `serve -s dist -l tcp://0.0.0.0:3000` en la fase runner. Los otros `Dockerfile*` del repo son experimentales.

### 2) Verificación

```bash
curl -i http://localhost:3001/api/openapi.json     # 200
curl -i http://localhost:3002/                     # 200
docker compose logs -f qadash-ui
```

Resultado ya verificado en este equipo:

```text
qadash-ui   Up   0.0.0.0:3002->3000/tcp
HTTP 200 /  ·  <title>RunLab Agrimpex — QA Dashboard</title>
Bundle: http://localhost:3001/api y http://localhost:3001
```

### 3) Variables horneadas (importante)

`VITE_API_URL` y `VITE_SOCKET_URL` se escriben en el bundle en **tiempo de build** y deben ser alcanzables desde el **navegador**. Defaults: `http://localhost:3001/api` y `http://localhost:3001`.

Para desplegar en otro equipo:

```bash
# .env de la raíz
VITE_API_URL=http://10.0.0.50:3001/api
VITE_SOCKET_URL=http://10.0.0.50:3001

docker compose up -d --build qadash-ui
```

`src/lib/socket.ts` deriva el origen del socket de `VITE_API_URL`, así que normalmente basta con cambiar esa variable. Reconstruir es obligatorio: cambiar `.env` y hacer solo `restart` no modifica el bundle ya generado.

### 4) Ciclo de vida

```bash
docker compose up -d --build          # construir y levantar todo
docker compose up -d --build qadash-ui # solo la UI (tras cambiar VITE_*)
docker compose logs -f qadash-ui
docker compose restart qadash-ui
docker compose down                   # conserva qadash-data
docker compose down -v                # BORRA perfiles/reportes de la API
```

### 5) Build y run equivalentes sin Compose

Útil si quieres lanzar solo la UI contra una API que ya está corriendo en `:3001`:

```bash
docker build -f runlab-agrimpex-ui/Dockerfile.npm \
  -t qadash-agrimpex-ui \
  --build-arg VITE_API_URL=http://localhost:3001/api \
  --build-arg VITE_SOCKET_URL=http://localhost:3001 \
  runlab-agrimpex-ui

docker run -d --name qadash-ui -p 3002:3000 qadash-agrimpex-ui
```

> Compose sigue siendo preferible: añade red compartida, `depends_on` con healthcheck y `restart: unless-stopped`.

Ver [guía completa de onboarding Docker](../docs/ONBOARDING_DOCKER.md).

---

## Ventaja de la imagen Playwright

Esta UI **no usa directamente** `mcr.microsoft.com/playwright:v1.62.1-noble`: la usa la API cuando ejecuta Playwright **dentro de su contenedor**. El dashboard (REST, Socket.io, catálogo, consola en vivo y reportes) funciona igual con la base por defecto `node:22-alpine`.

¿Por qué merece la pena cuando corres tests en Docker?

1. **Catálogo y corridas fiables:** el tag `v1.62.1` coincide con `@playwright/test@1.62.1` del kit. Si las versiones divergen, Playwright no encuentra los binarios y la UI muestra fallos de colección/ejecución (`Executable doesn't exist at ...`).
2. **Navegadores y librerías del sistema ya instalados:** Chromium, Firefox y WebKit sobre Ubuntu `noble` (glibc). Con `node:22-alpine` (musl) Firefox/WebKit no están soportados y habría que instalar muchas dependencias del sistema.
3. **Menos fragilidad detrás de proxy:** evita repetir `npx playwright install --with-deps` en cada build de la API. La imagen trae además Node y `git`.
4. **Evidencias consistentes:** screenshots, videos y trazas se generan con la misma versión de navegador en local y en CI; la UI puede mostrar la miniatura por reporte y los adjuntos sin sorpresas de entorno.
5. **Mismo contenedor, sin cambios de permisos:** el uid `1000` es `node` en Alpine y `pwuser` en la imagen Playwright, compatible con el volumen `/data`.

**Coste:** es una imagen grande (≈ 1.7 GB) y requiere descargarla una vez. Si solo usas el dashboard o tus tests apuntan a un grid Selenium remoto (`SELENIUM_REMOTE_URL`), quédate con `node:22-alpine`.

Para activarla desde la raíz del workspace:

```bash
echo 'API_BASE_IMAGE=mcr.microsoft.com/playwright:v1.62.1-noble' >> .env
docker compose up -d --build qadash-api
```

Además, monta el kit de tests y pon `projectPath=/workspace/playwright-kit-profesional` en la config del perfil. El detalle completo está en [Ventaja de la imagen Playwright (API)](../runlab-agrimpex-api/README.md#ventaja-de-la-imagen-playwright).

---

## Vistas principales

- **Dashboard (`/`)**: consola y resultados de la ejecución en vivo del perfil activo.
- **Tests (`/tests`)**: proyecto de pruebas visible/configurado, catálogo de specs, configuración de corrida, consola/resultados y visor de archivos del proyecto.
- **Reportes (`/reports`)**: historial, analítica y detalle de ejecuciones. El historial incluye una **miniatura de evidencia** por reporte (cuando el run genera imagen/`summary.previewImage`) y el detalle permite visualizar adjuntos/evidencias de imagen por test.
- **Evidencia de fallos (`/errors`)**: galería de capturas/evidencias generadas durante corridas.
- **Entornos (`/env`)**: edición de archivos `.env` del proyecto y entornos/variables guardados por perfil.
- **Docker (`/docker`)**: estado del entorno Docker/grid y acciones asociadas.
- **Calendarización (`/schedules`)**: programación de ejecuciones automáticas.
- **Datos de prueba (`/data`)**: fuentes de datos TXT/JSON (según módulos habilitados).
- **Ajustes (`/settings`)**: configuración de proyecto/rutas, módulos (feature flags), automatización, perfiles y sistema. Incluye la tarjeta **Evidencias de ejecución (Playwright)** para controlar capturas (screenshot/video/trace y página completa) por perfil.

## Header y herramientas globales

Las páginas principales mantienen herramientas de navegación/utilidad en el header:

- **Búsqueda / Command Menu** (`Ctrl+K` / `⌘K`): acceso rápido a vistas y acciones como cambio de tema.
- **Cambio de tema**: claro, oscuro o sistema.
- **Ajustes visuales (rueda dentada)**: tema, layout, sidebar y dirección.

Además, el sidebar incluye el selector de perfil activo y la navegación por secciones.

## Tests: proyecto visible y visor de archivos

En la vista `/tests`:

- Se muestra de forma destacada el **proyecto de pruebas configurado** para el perfil activo (ruta `projectPath`, comando Playwright, projects y cantidad de tests del catálogo), con estado **Configurado / Sin configurar**.
- El **catálogo** permite recolectar/actualizar specs, buscar, seleccionar tests/archivos y lanzar corridas con parámetros (project, grep, workers, fuente de variables, Docker, `params`).
- El botón **Abrir archivo** (y la acción «Ver» por archivo del catálogo) abre un **visor de contenidos** para cualquier archivo del proyecto:
  - Apertura por ruta relativa al `projectPath` configurado (p. ej. `playwright.config.ts`, `tests/...`).
  - Metadatos (ruta, tamaño, fecha de modificación, líneas), búsqueda dentro del archivo, ajuste de línea, copiado de ruta/contenido y numeración de líneas.
  - El contenido se obtiene vía `GET /api/tests/file?name=<ruta-relativa>` (lectura dentro del proyecto).

> Si al ejecutar aparece «Project path not configured», configura el proyecto en **Ajustes > Proyecto** (ruta del proyecto y comando Playwright) y actualiza el catálogo.

## Configuración del proyecto y `playwrightCmd`

La configuración por perfil se gestiona en **Ajustes > Proyecto** (persistida por la API en `profiles/<id>/config.json`).

Campos principales:

- **Ruta del proyecto (`projectPath`)**: ruta absoluta al proyecto de automatización Playwright.
- **Archivo .env (`envPath`)**: archivo de entorno del proyecto (opcional; también puede detectarse).
- **Comando Playwright (`playwrightCmd`)**: **comando base** que la API usa para recolectar y ejecutar tests.
  - **Valor recomendado:** `npx playwright`
  - **Importante:** es el comando base, **sin** subcomando `test`; el backend agrega `test` y los argumentos necesarios:
    - Colección: `<playwrightCmd> test --list --reporter=json`
    - Ejecución: `<playwrightCmd> test <targets> [--project=...] [-g ...] [--workers=...] --reporter=line,json`
  - Ejemplos válidos: `npx playwright`, `pnpm exec playwright` (según el entorno del proyecto).
  - Si usas `npx playwright test` como base, el comando resultante será incorrecto (duplicará `test`).
- **Comando Pytest (`pytestCmd`)**: campo **deprecado** mantenido por compatibilidad; para proyectos Playwright usa `playwrightCmd`.
- Rutas opcionales de datos/evidencias y URL remota de Selenium/Grid según los módulos habilitados.
- **Evidencias de ejecución (Playwright) (`evidence`)**: permite definir overrides por perfil para `screenshot` (`always`/`only-on-failure`/`off`), `video`, `trace` y `fullPage`. La opción *“Según proyecto (sin override)”* respeta el `playwright.config` del proyecto. Con `screenshot = always` se generan capturas también para tests pasados y el historial puede mostrar una foto por reporte.

## Estructura relevante del frontend

```text
src/
  components/        # UI base, layout, header, theme/config/search
  context/           # theme, layout, search, direction, font
  features/
    execution/       # dashboard, tests, catálogo, corrida, consola, visor de archivos
    reports/         # historial y analítica
    errors/          # evidencia de fallos
    environment/     # archivos .env y entornos guardados
    docker/          # control/estado Docker
    schedules/       # calendarización
    test-data/       # datos TXT/JSON
    settings/        # configuración, módulos, automatización, perfiles, sistema
    profile-session/ # sesión/perfil activo
  lib/api.ts         # cliente API y contratos de endpoints
  routes/            # rutas TanStack Router
  stores/            # estado global (perfil, etc.)
  types/contract.ts  # tipos del contrato con la API
```

## Notas

- Los módulos disponibles pueden variar según los **feature flags** del perfil activo.
- Algunas capacidades (ejecución real, Docker, rutas locales) dependen de la configuración del perfil y del entorno donde corre la API.
