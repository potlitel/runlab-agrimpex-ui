# 🐳 Onboarding Docker — RunLab Agrimpex (QA Dashboard)

> Guía para levantar el stack completo (API + UI) en Docker, entender el flujo
> de construcción de imágenes y resolver los problemas conocidos.
> Sigue el patrón de `DeviceActivityMonitor` (rama `feat/docker-onboarding`),
> adaptado a Express + Socket.io + Playwright.
>
> 📘 Referencia completa del stack (variables, montajes, migración y
> funcionamiento de los `.env`): [RunLab Agrimpex — Orquestación Docker](<../RunLab Agrimpex — Orquestación Docker.md>).

---

## Índice

1. [Arquitectura en Docker](#1-arquitectura-en-docker)
2. [Imágenes a descargar](#2-imágenes-a-descargar)
3. [Prerrequisitos](#3-prerrequisitos)
4. [Inicio rápido](#4-inicio-rápido)
5. [Verificación](#5-verificación)
6. [Configuración](#6-configuración)
7. [Flujo de construcción de imágenes](#7-flujo-de-construcción-de-imágenes)
8. [Comandos de referencia](#8-comandos-de-referencia)
9. [Troubleshooting](#9-troubleshooting)
10. [Mapa de archivos Docker](#10-mapa-de-archivos-docker)
11. [Notas para producción / limitaciones](#11-notas-para-producción--limitaciones)
12. [FAQ](#12-faq)

---

## 1. Arquitectura en Docker

```text
Navegador
   │  http://localhost:3002            (UI)
   │  http://localhost:3001/api        (REST)
   │  ws://localhost:3001/socket.io    (eventos en vivo)
   ▼
┌───────────────────────┐        ┌──────────────────────────────┐
│ runlabqa-ui  :3002      │        │ runlabqa-api  :3001            │
│ node:22-alpine        │        │ node:22-alpine               │
│ serve -s dist         │        │ (base opcional: Playwright)  │
│ (Dockerfile.npm)      │        │ (Dockerfile)                 │
└───────────────────────┘        └──────────────┬───────────────┘
                                                 │ volumen runlabqa-data -> /data
                                                 │ perfiles/, reports/, caches
                                                 ▼
                                    Kit Playwright (montar como volumen)
                                    AUT en el host (host.docker.internal)
```

| Servicio | Puerto host | Puerto contenedor | Imagen | Dockerfile canónico |
|---|---|---|---|---|
| API (Express + Socket.io) | `3001` | `3001` | `runlabqa-agrimpex-api` | `../runlab-agrimpex-api/Dockerfile` |
| UI (React + Vite) | `3002` | `3000` | `runlabqa-agrimpex-ui` | `Dockerfile.npm` |

> ⚠️ El puerto `3000` ya está ocupado por `dam-frontend` del stack de
> referencia (DAM). Por eso la UI de este stack se publica en `3002` y el
> contenedor sigue escuchando en `3000` internamente. Si detienes DAM, puedes
> usar `UI_PORT=3000` en `.env`.

> La red `runlabqa-network` existe para futuros proxies inversos. Hoy el
> navegador llama directamente a la API (CORS abierto), igual que en DAM.

---

## 2. Imágenes a descargar

**No hace falta descargar nada nuevo para levantar el stack**: ambas imágenes
base usan `node:22-alpine`, que ya está en caché en este equipo.

```bash
docker images node:22-alpine   # ya presente
```

### ¿Para qué sirve entonces `mcr.microsoft.com/playwright:v1.62.1-noble`?

No es la imagen de la API ni de la UI. Es una **base opcional** para la API
cuando quieras **ejecutar tests Playwright dentro del contenedor**: trae
Node 24, git, los navegadores y las librerías del sistema ya instaladas, con
la versión 1.62.1 que usa el kit (`playwright-kit-profesional`). Con
`node:22-alpine` el dashboard (REST + Socket.io) funciona normalmente, pero
los runs de Playwright necesitarán navegadores; en ese caso reconstruye con:

```bash
docker compose build runlabqa-api \
  --build-arg API_BASE_IMAGE=mcr.microsoft.com/playwright:v1.62.1-noble
```

o añade `API_BASE_IMAGE=...` a `.env`. Recién ahí sí hay que descargar esa
imagen. Si se actualiza `@playwright/test` en el kit, actualiza también el tag.

| Modo | Base | ¿Descarga? | Playwright dentro del contenedor |
|---|---|---|---|
| Por defecto | `node:22-alpine` | No | No (usar navegadores del host/grid remoto) |
| Opcional | `mcr.microsoft.com/playwright:v1.62.1-noble` | Sí | Sí |

> El CLI de `docker` **no** se instala en la imagen para no exigir otra
> descarga. Si necesitas el módulo `/api/docker`, monta el binario del host
> (ver §6.3).

---

## 3. Prerrequisitos

| Herramienta | Versión | Comando |
|---|---|---|
| Docker Engine | 24+ (probado con 29.7.1) | `docker --version` |
| Docker Compose plugin | v2+ | `docker compose version` |
| RAM libre | ≥ 4 GB | El build de UI + npm de la API requieren memoria |
| Disco | ≥ 1 GB libres | `node:22-alpine` + capas de build + `node_modules` (si activas Playwright, ≈ 1.7 GB extra) |

Red corporativa con proxy:

* Para que Docker descargue imágenes, configurar `registry-mirrors` en
  `/etc/docker/daemon.json` (ver guía de DAM) y `systemctl restart docker`.
* Para `npm install` dentro del build, descomenta `HTTP_PROXY`/`HTTPS_PROXY`
  en `.env`. El Dockerfile los pasa como `ARG`/`ENV`; los `.npmrc` de ambos
  repos incluyen timeouts y retries.

---

## 4. Inicio rápido

```bash
cd /home/potlitel/Trabajo/EICMA/Agrimpex/qa-dashboard/runlab-agrimpex-ui

# 1) Detén los servicios en host si están corriendo (start-dev.sh / npm run dev)
# 2) Configura el entorno
cp .env.example.stack .env

# 3) Construye y levanta todo
docker compose up -d --build
```

Primera vez: varios minutos (`npm ci` en ambos repos). Builds posteriores
usan caché. La imagen base por defecto (`node:22-alpine`) ya está en caché.

> Si vienen de `start-dev.sh`, los puertos 3001 (API) y 5173 (UI) quedarán
> liberados al detenerlo. **No** detengas el stack DAM para usar este: sus
> contenedores `dam-frontend`/`dam-api` ocupan 3000 y 8081, que no se usan aquí.
> Esta UI se publica en **3002**.

---

## 5. Verificación

Ejecuta SIEMPRE desde `runlab-agrimpex-ui/` (aquí está el `docker-compose.yml`).
Si `docker compose ps` sale vacío, el stack **no está levantado**: revisa el
directorio y que las imágenes base ya estén disponibles. Además, la UI
tiene `depends_on` con `condition: service_healthy`, así que si la API no
arranca, Compose tampoco publicará la UI.

```bash
docker compose ps                          # debe mostrar runlabqa-api y runlabqa-ui
curl -i http://localhost:3001/api/openapi.json   # 200 (healthcheck de la API)
curl -i http://localhost:3001/api/profile-admin  # 200, los 5 perfiles previos
curl -i http://localhost:3002/                   # 200 (index.html de la SPA)
docker compose logs -f runlabqa-api
docker compose logs -f runlabqa-ui
```

En el navegador:

* UI: <http://localhost:3002>
* Swagger: <http://localhost:3001/api/docs/>

> Si `http://localhost:3000` te muestra otra aplicación, es `dam-frontend`
> del proyecto de referencia, **no** la UI de RunLab. No es un fallo de este stack.

Para comprobar el canal en vivo, abre la UI y mira la consola del navegador:
debe conectarse a `ws://localhost:3001/socket.io`. Si se construyó con la URL
por defecto, `VITE_API_URL`/`VITE_SOCKET_URL` quedaron horneados en el bundle.

---

## 6. Configuración

### 6.1 URLs del frontend (build-time)

Vite **hornea** `VITE_*` en el bundle durante `npm run build`. Por eso son
`build.args` del compose y no variables del contenedor en ejecución.

| Variable | Default | Regla |
|---|---|---|
| `VITE_API_URL` | `http://localhost:3001/api` | Debe ser alcanzable **desde el navegador**. |
| `VITE_SOCKET_URL` | `http://localhost:3001` | Origen de Socket.io. Si se omite, se deriva de `VITE_API_URL`; en dev (sin variable) se usa el mismo origen y el proxy de Vite. |

Servidor remoto:

```bash
# .env
VITE_API_URL=http://10.0.0.50:3001/api
VITE_SOCKET_URL=http://10.0.0.50:3001
docker compose up -d --build runlabqa-ui
```

La UI en `src/lib/socket.ts` deriva el origen del socket de `VITE_API_URL`,
así que en la mayoría de los casos basta con cambiar esa única variable.

### 6.2 Persistencia

`RUNLABQA_DATA_DIR=/data` usa dos mecanismos complementarios:

| Destino en el contenedor | Origen en el host | Qué guarda |
|---|---|---|
| `/data` | volumen nombrado `runlabqa-data` | Datos generales (p. ej. `/data/json-snapshots.json`) |
| `/data/profiles` | bind mount `../runlab-agrimpex-api/profiles` | `index.json`, configs, entornos, schedules, caché y reportes **previos a Docker** |

```text
/data/profiles/index.json
/data/profiles/<id>/config.json, entornos.json, features.json, schedules.json
/data/profiles/<id>/reports/  /data/profiles/<id>/data/
/data/json-snapshots.json
```

* El bind mount tiene prioridad sobre `/data/profiles` del volumen: los 5
  perfiles que ya existían en el repo (`perfil-1`, `perfil-qa-test-2`,
  `perfil-1-copia`, `alain`, `jorge`) son los que ve la API.
* Los avatares **no son ficheros**: `avatar: { style, seed }` vive dentro de
  cada entrada de `/data/profiles/index.json` (en el host,
  `../runlab-agrimpex-api/profiles/index.json`). La UI genera el SVG con
  DiceBear en memoria; no hay `avatar.svg`/PNG ni data URIs en disco, ni
  llamadas a un servicio externo. Si una entrada antigua no trae avatar, se
  expone `{ style: 'notionists', seed: <id> }` y se escribe en el índice en la
  siguiente mutación.
* `.dockerignore` sigue excluyendo `profiles/` de la **imagen**, pero ahora se
  monta explícitamente desde el host; no se pierde al reconstruir.
* `docker compose down` conserva todo. `docker compose down -v` borra el
  volumen `runlabqa-data`, **pero no borra los perfiles del host**.
* Las variables `RUNLABQA_PROFILES_DIR` y `PLAYWRIGHT_KIT_DIR` en `.env` permiten
  cambiar los orígenes sin editar el compose.

### 6.3 Módulos que dependen del host

El kit Playwright está montado de forma activa en la **misma ruta absoluta**
que tienen los perfiles guardados, así que no hay que tocar `projectPath`:

```yaml
# En docker-compose.yml (activo por defecto):
- ${PLAYWRIGHT_KIT_DIR:-/home/potlitel/Trabajo/EICMA/Agrimpex/playwright-kit-profesional}:${PLAYWRIGHT_KIT_DIR:-/home/potlitel/Trabajo/EICMA/Agrimpex/playwright-kit-profesional}
```

> El kit **no** se incluye en la imagen. Sus `node_modules` (Playwright,
> allure, etc.) deben existir en el host. El montaje es escribible porque las
> corridas generan `test-results/` y `playwright-report/` dentro del proyecto;
> si solo vas a recolectar (`--list`), puedes añadir `:ro`.

Para el módulo `/api/docker`, descomenta además:

```yaml
- /var/run/docker.sock:/var/run/docker.sock
- /usr/bin/docker:/usr/bin/docker:ro
```

AUT en `localhost` del host: el contenedor usa
`host.docker.internal` (definido con `extra_hosts: host-gateway`). Ajusta las
URLs del perfil a `http://host.docker.internal:5000` / `:8990`.

### 6.4 Variables del backend

| Variable | Default en Docker | Descripción |
|---|---|---|
| `PORT` | `3001` | HTTP + Socket.io |
| `RUNLABQA_DATA_DIR` | `/data` | Persistencia (volumen) |
| `RUNLABQA_NOVNC_HOST` | `host.docker.internal` | Proxy noVNC |
| `RUNLABQA_NOVNC_PORT` | `7900` | Proxy noVNC |
| `TZ` | `America/Argentina/Buenos_Aires` | Zona horaria de las calendarizaciones |
| `UPDATE_TOKEN` | *(vacío)* | Sin él, `/api/system/update` responde 503 |

---

## 7. Flujo de construcción de imágenes

```bash
# Manual (equivalente a lo que hace compose):

# API (contexto = ../runlab-agrimpex-api)
docker build \
  -f ../runlab-agrimpex-api/Dockerfile \
  -t runlabqa-agrimpex-api \
  --build-arg HTTP_PROXY=${HTTP_PROXY:-} \
  ../runlab-agrimpex-api

docker run -d --name runlabqa-api -p 3001:3001 \
  -v runlabqa-data:/data \
  --add-host=host.docker.internal:host-gateway \
  runlabqa-agrimpex-api

# UI (contexto = .)
docker build \
  -f Dockerfile.npm \
  -t runlabqa-agrimpex-ui \
  --build-arg VITE_API_URL=http://localhost:3001/api \
  --build-arg VITE_SOCKET_URL=http://localhost:3001 \
  .

docker run -d --name runlabqa-ui -p 3002:3000 runlabqa-agrimpex-ui
```

Reglas aprendidas del repo de referencia y aplicadas aquí:

1. **Todo el build dentro de Docker.** No ejecutar `npm install` en el host:
   evita `node_modules` con dueño root y native bindings mezclados.
2. **`.dockerignore` en cada contexto.** Excluye `node_modules`, `dist`,
   `.git`, secretos y datos runtime (`profiles/`, `reports/`).
3. **Multi-stage en la UI.** `npm ci` + `tsc -b && vite build` en la fase
   build; `serve -s dist` en la fase runner. Sin `NODE_ENV=production` en
   build (omite devDependencies y falla `tsc`).
4. **`npm ci` con lockfile.** Ambos repos tienen `package-lock.json`
   versionado; no usar `npm install` ni yarn.
5. **Sin IP de proxy quemada.** Se pasa como `--build-arg` / variable de `.env`.

---

## 8. Comandos de referencia

```bash
docker compose up -d --build          # construir y levantar
docker compose up -d --build runlabqa-ui # reconstruir solo la UI tras cambiar URLs
docker compose ps                     # estado
docker compose logs -f                # logs de todos
docker compose logs -f runlabqa-api     # logs de la API
docker compose restart runlabqa-api
docker compose down                   # detener (conserva runlabqa-data)
docker compose down -v                # detener y borrar runlabqa-data (no los perfiles del host)
docker compose exec runlabqa-api sh     # shell dentro de la API
docker compose exec runlabqa-api sh -c 'ls /data/profiles'  # perfiles montados
curl -fsS http://localhost:3001/api/profile-admin          # ver los 5 perfiles
```

---

## 9. Troubleshooting

| # | Síntoma | Causa | Solución |
|---|---|---|---|
| 1 | `Cannot find native binding @rolldown/...` o `tsc: not found` en la UI | `node_modules` del host copiado al contexto, o `NODE_ENV=production` en build | `.dockerignore` excluye `node_modules`; no definir `NODE_ENV` en la fase build |
| 2 | La UI carga pero `/api` da 404/ERR_CONNECTION_REFUSED | `VITE_API_URL` apunta a otro host/puerto o la API no arrancó | Revisar `docker compose ps`, `curl :3001/api/openapi.json`, reconstruir UI con la URL correcta |
| 3 | REST funciona pero no llegan eventos en vivo | Socket.io apuntaba al origen de la UI | Verificar `VITE_SOCKET_URL` en el bundle; `src/lib/socket.ts` deriva el origen de `VITE_API_URL` |
| 4 | `EADDRINUSE` en 3001/3002 | `start-dev.sh`, `npm run dev` u otros contenedores ocupan el puerto | Detenerlos o cambiar `API_PORT`/`UI_PORT` en `.env` |
| 4b | `http://localhost:3000` muestra otra app (DAM) | Es `dam-frontend`, del stack de referencia | Usar `http://localhost:3002` para esta UI; no hace falta detener DAM |
| 4c | `docker compose ps` sale vacío y la API no responde | El stack nunca se levantó (directorio equivocado o las imágenes base no están disponibles) | Ejecutar compose desde `runlab-agrimpex-ui/`, verificar `docker images node:22-alpine` y luego `up --build` |
| 5 | Error al colectar/ejecutar tests: `Executable doesn't exist at /root/.cache/ms-playwright/...` | Versión de `@playwright/test` distinta a la imagen | Alinear tag `v1.62.1-noble` con el kit (o actualizar ambos) |
| 6 | Chromium se queda sin memoria / crash | IPC pequeño | Añadir `ipc: host` al servicio `runlabqa-api` en compose |
| 7 | `/api/docker` dice que Docker no está disponible | No hay CLI/socket en el contenedor | Descomenta los dos montajes del §6.3 |
| 8 | El selector de archivos (`/api/config/browse`) no responde | Usa `zenity` y el contenedor es headless | Introducir la ruta manualmente desde la UI; limitación conocida |
| 9 | Scheduler dispara a otra hora | Zona horaria del contenedor | Ajustar `TZ` en `.env` y recrear: `docker compose up -d --force-recreate runlabqa-api` |
| 10 | `npm ci` falla por timeout en la red corporativa | Proxy/registry | Descomenta `HTTP_PROXY`/`HTTPS_PROXY` en `.env`; los `.npmrc` ya tienen retries |
| 11 | `EACCES` escribiendo `/data` | Volumen creado por otro uid | `docker compose exec -u root runlabqa-api chown -R 1000:1000 /data` |
| 12 | Imagen base no descarga | Registry bloqueado | Configurar `registry-mirrors` en `/etc/docker/daemon.json` y reiniciar Docker |

**Regla de oro:** ante un fallo de build revisa, en orden: (1) proxy/daemon,
(2) `.dockerignore`, (3) `node_modules` del host, (4) versiones pinadas
(Node 22 / Playwright 1.62.1).

---

## 10. Mapa de archivos Docker

### Canónicos (usar estos)

| Archivo | Propósito |
|---|---|
| `docker-compose.yml` | Única puerta de entrada del stack |
| `.env.example.stack` | Plantilla completa del stack (puertos, URLs, proxy) |
| `.env.example` | Plantilla `VITE_*` para el dev local de Vite |
| `start-dev.sh` | Arranque manual de API + UI en el host |
| `../runlab-agrimpex-api/Dockerfile` | Imagen de la API (base `node:22-alpine`; Playwright opcional) |
| `../runlab-agrimpex-api/.dockerignore` | Contexto limpio (sin perfiles/reportes) |
| `../runlab-agrimpex-api/.npmrc` | Registry + timeouts/retries |
| `Dockerfile.npm` | Multi-stage build + `serve` |
| `.dockerignore` | Excluye `node_modules` del host |
| `.npmrc` | Registry + timeouts/retries |
| `docs/ONBOARDING_DOCKER.md` | Esta guía |

### Experimentales / históricos (NO usar)

En este repo: `Dockerfile` (Node 18, insuficiente para Vite 7),
`Dockerfile.dev`, `Dockerfile.frontend.nginx`, `Dockerfile.node-serve`,
`Dockerfile.optimized`, `Dockerfile.production`, `Dockerfile.simple`,
`Dockerfile.with-proxy`. Son intentos previos; varios copian `yarn.lock` o
rutas de DAM que no existen aquí. Se conservan por trazabilidad.

---

## 11. Notas para producción / limitaciones

1. **No exponer sin reverse proxy.** Terminar TLS en nginx/traefik delante de
   ambos servicios y restringir CORS (hoy `origin: '*'`).
2. **`UPDATE_TOKEN`:** dejar vacío. Las actualizaciones de código se hacen
   reconstruyendo la imagen, no con `git pull` dentro del contenedor.
3. **Playwright con root vs pwuser:** el contenedor corre como uid 1000 (`node`
   en Alpine, `pwuser` en la imagen Playwright). Para
   testing de sitios trusted está bien; para crawling, seguir las
   recomendaciones de sandbox del image de Playwright.
4. **Tests que usan `localhost` del AUT:** necesitan `host.docker.internal`
   (o `network_mode: host` en Linux). Revisar `projectPath`/URLs por perfil.
5. **Headless:** los diálogos nativos (`zenity`) no funcionan.
6. **Backups:** respaldar el volumen `runlabqa-data` y la carpeta
   `../runlab-agrimpex-api/profiles` (perfiles + reportes).
7. **Escaneo de imágenes:** `docker scout cves runlabqa-agrimpex-api` antes de
   publicar.

---

## 12. FAQ

**¿El frontend y la API deben estar en la misma red Docker?**
Para el build no. En runtime el navegador llama directamente a la API con
`VITE_API_URL` / `VITE_SOCKET_URL`. La red compartida facilita un futuro
proxy inverso.

**¿Se pierden los perfiles al reconstruir?**
No: viven en `../runlab-agrimpex-api/profiles` (bind mount). `docker compose
down -v` solo borra el volumen `runlabqa-data`, no los perfiles del host.

**¿Puedo seguir usando `start-dev.sh`?**
Sí, para desarrollo en host. No lo ejecutes mientras el stack Docker esté
arriba: hay conflicto de puertos.

**¿Por qué Node 22 en ambos servicios?**
Ambos usan `node:22-alpine` por defecto (Vite 7 acepta 22.12+ y ya está en
caché). La API puede usar opcionalmente la imagen oficial de Playwright
(Node 24) con `API_BASE_IMAGE`; Express/Socket.io no tienen restricción de
versión.

---

*Documentado a partir del flujo real de construcción del stack DAM y de las
particularidades de RunLab Agrimpex. Ante dudas: `docker compose logs -f`.*
