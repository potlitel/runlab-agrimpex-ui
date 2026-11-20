# RunLab Agrimpex — UI

Frontend del dashboard QA **RunLab Agrimpex** para gestionar perfiles, configurar proyectos de automatización, explorar/ejecutar tests Playwright y consultar resultados/evidencias.

- **Stack:** React 19 + TypeScript + Vite + TanStack Router/Query/Table + shadcn/ui + Tailwind CSS 4.
- **Backend hermano:** `runlab-agrimpex-api` (Express + Socket.io), que expone la API REST, emite eventos en tiempo real y sirve el build en producción.
- **Línea base:** esqueleto UI de `DAM.Frontend.React` (plantilla [shadcn-admin](https://github.com/satnaing/shadcn-admin), MIT © Sat Naing; adaptaciones © potlitel).

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

- Node.js 18+
- npm
- API en ejecución (`runlab-agrimpex-api`, por defecto en `:3001`)

## Puesta en marcha

```bash
# Instalar dependencias
npm install

# Desarrollo
npm run dev

# Lint
npm run lint

# Typecheck
npx tsc -b --noEmit

# Build de producción
npm run build

# Vista previa del build
npm run preview
```

> Si el backend corre en otro host/puerto, ajusta el proxy en `vite.config.ts` o define `VITE_API_URL` según corresponda.

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
