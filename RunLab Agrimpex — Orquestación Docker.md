# RunLab Agrimpex — Orquestación Docker (`runlabqa`)

Este repositorio (el frontend) aloja además la **infraestructura de ejecución** del dashboard QA de Agrimpex: el `docker-compose.yml` que levanta la API y la UI como un único stack, su plantilla de configuración y la guía de onboarding. La carpeta `qa-dashboard/` queda únicamente con los dos repositorios: `runlab-agrimpex-api/` y `runlab-agrimpex-ui/`.

> **Prefijo:** los recursos Docker y las variables de entorno propias usan `runlabqa` / `RUNLABQA_`. El nombre `QADash` solo aparece cuando se cita el **proyecto base del que se adaptó** el contrato REST + Socket.io (crédito/licencia), nunca para nombrar recursos actuales.

---

## Índice

1. [Qué contiene este repositorio](#1-qué-contiene-este-repositorio)
2. [Requisitos](#2-requisitos)
3. [Arranque rápido](#3-arranque-rápido)
4. [Mapa de servicios](#4-mapa-de-servicios)
5. [Anatomía de `docker-compose.yml`](#5-anatomía-de-docker-composeyml)
6. [Cómo funcionan los `.env` en este YAML](#6-cómo-funcionan-los-env-en-este-yaml)
7. [Referencia completa de variables](#7-referencia-completa-de-variables)
8. [Persistencia y montajes](#8-persistencia-y-montajes)
9. [Red y puertos](#9-red-y-puertos)
10. [Ciclo de vida](#10-ciclo-de-vida)
11. [Verificación](#11-verificación)
12. [Migración desde los antiguos nombres `qadash-*`](#12-migración-desde-los-antiguos-nombres-qadash-)
13. [Imagen Playwright opcional](#13-imagen-playwright-opcional)
14. [Solución de problemas](#14-solución-de-problemas)
15. [Seguridad](#15-seguridad)
16. [Relación con los repos de API y UI](#16-relación-con-los-repos-de-api-y-ui)

---

## 1. Qué contiene este repositorio

La infraestructura del stack vive **dentro del repo de la UI**. La carpeta
`qa-dashboard/` solo contiene los dos repositorios:

```text
qa-dashboard/
├── runlab-agrimpex-api/          ← repo Git (API)
└── runlab-agrimpex-ui/           ← repo Git (UI + infraestructura)
    ├── docker-compose.yml
    ├── .env                      ← creado, ignorado por Git
    ├── .env.example.stack        ← plantilla completa del stack
    ├── .env.example              ← se conserva (solo VITE_*, dev local)
    ├── RunLab Agrimpex — Orquestación Docker.md
    ├── start-dev.sh
    └── docs/
        ├── ONBOARDING_DOCKER.md
        └── creative-direction.md
```

> ⚠️ **Directorio de trabajo:** los comandos `docker compose ...` ahora se
> ejecutan desde **`qa-dashboard/runlab-agrimpex-ui/`**, no desde la raíz
> `qa-dashboard/`. Es ahí donde viven el `docker-compose.yml` y el `.env` que
> Compose lee. Si `docker compose ps` sale vacío, casi siempre es por estar en
> el directorio equivocado.

- Los `build.context` son relativos al `docker-compose.yml`: `../runlab-agrimpex-api` para la API y `.` para la UI.
- `.env` **no** se versiona; `.env.example.stack` sí. El `.env.example` histórico de la UI sigue siendo la plantilla de Vite para desarrollo local.
- `runlab-agrimpex-api/` conserva su propio `.git` y su `README.md`.

---

## 2. Requisitos

| Herramienta | Versión | Obligatoria para Docker |
|---|---|---|
| Docker Engine | 24+ | Sí |
| Docker Compose plugin | v2 (`docker compose`, con espacio) | Sí |
| Acceso a `node:22-alpine` | ya en caché en este equipo | Sí (o descarga única) |
| Node.js / npm | 22 / 10 | Solo para ejecución manual (ver READMEs de API y UI) |

Puertos que deben estar libres en el host:

- `3001` → API.
- `3002` → UI de este stack.
- `3000` **no** se usa aquí: lo ocupa `dam-frontend`, del stack de referencia DAM. No hay que detenerlo.

---

## 3. Arranque rápido

```bash
cd /home/potlitel/Trabajo/EICMA/Agrimpex/qa-dashboard/runlab-agrimpex-ui

cp .env.example.stack .env  # opcional: los defaults ya funcionan
docker compose config --quiet
docker compose up -d --build
docker compose ps
```

Verificación mínima:

```bash
curl -fsS http://localhost:3001/api/openapi.json | head -c 120; echo
curl -fsS -o /dev/null -w 'ui=%{http_code}\n' http://localhost:3002/
```

Resultado esperado: `200` en ambos, con services `runlabqa-api` y `runlabqa-ui`.

---

## 4. Mapa de servicios

| Servicio Compose | Contenedor | Imagen | Host | Interno | Función |
|---|---|---|---|---|---|
| `runlabqa-api` | `runlabqa-api` | `runlabqa-agrimpex-api` | `localhost:3001` | `runlabqa-api:3001` | Express + Socket.io, Playwright runner, persistencia JSON |
| `runlabqa-ui` | `runlabqa-ui` | `runlabqa-agrimpex-ui` | `localhost:3002` | `runlabqa-ui:3000` | React/Vite estático servido con `serve -s dist` |

- `restart: unless-stopped` en ambos: sobreviven a reinicios de Docker.
- Swagger UI: <http://localhost:3001/api/docs/>; spec cruda: `/api/openapi.json`.
- La UI **espera** a que la API esté `healthy` antes de arrancar (`depends_on.condition: service_healthy`).

---

## 5. Anatomía de `docker-compose.yml`

### 5.1 Bloque `build`

```yaml
build:
  context: ../runlab-agrimpex-api
  dockerfile: Dockerfile
  args:
    API_BASE_IMAGE: ${API_BASE_IMAGE:-node:22-alpine}
    HTTP_PROXY: ${HTTP_PROXY:-}
    HTTPS_PROXY: ${HTTPS_PROXY:-}
    NO_PROXY: ${NO_PROXY:-}
```

- `context`: directorio que se envía al daemon; su `.dockerignore` excluye `node_modules`, `dist`, `.git`, secretos y datos runtime.
- `dockerfile`: `Dockerfile` para la API y `Dockerfile.npm` para la UI (canónico, multi-stage).
- `args` son **build-args**: solo existen mientras se construye la imagen. Cambiarlos exige `docker compose up -d --build <servicio>`.

| Build-arg | Sirve para |
|---|---|
| `API_BASE_IMAGE` | Base de la imagen de la API. Default `node:22-alpine`; opcional `mcr.microsoft.com/playwright:v1.62.1-noble`. |
| `HTTP_PROXY` / `HTTPS_PROXY` / `NO_PROXY` | Salida a Internet detrás de proxy corporativo durante `npm ci`. |
| `VITE_API_URL` / `VITE_SOCKET_URL` | URLs que Vite **hornea en el bundle** de la UI. Deben ser visibles desde el navegador. |

### 5.2 `image` y `container_name`

```yaml
image: runlabqa-agrimpex-api
container_name: runlabqa-api
```

- `image`: nombre con el que se etiqueta el resultado del build.
- `container_name`: nombre fijo del contenedor (permite `docker logs runlabqa-api` sin buscar IDs).
- Ambos usan el prefijo `runlabqa`; ya no quedan recursos `qadash-*`.

### 5.3 `environment`

Son variables **de ejecución** (disponibles dentro del contenedor ya arrancado):

```yaml
environment:
  PORT: "3001"
  RUNLABQA_DATA_DIR: /data
  RUNLABQA_NOVNC_HOST: ${RUNLABQA_NOVNC_HOST:-host.docker.internal}
  RUNLABQA_NOVNC_PORT: ${RUNLABQA_NOVNC_PORT:-7900}
  TZ: ${TZ:-America/Argentina/Buenos_Aires}
  UPDATE_TOKEN: ${UPDATE_TOKEN:-}
```

- `PORT` y `RUNLABQA_DATA_DIR` están fijos en el compose para que el healthcheck y el volumen coincidan.
- El resto se resuelve desde `.env` o usa un default.
- Cambiar estas variables requiere **recrear** el contenedor (`docker compose up -d`), no necesariamente reconstruir la imagen.

### 5.4 `ports`

```yaml
ports:
  - "${API_PORT:-3001}:3001"
  - "${UI_PORT:-3002}:3000"
```

Formato `HOST:CONTENEDOR`. El contenedor de la UI escucha en `3000` (interno) y se publica en `3002` (host) por el conflicto con DAM.

### 5.5 `volumes`

```yaml
volumes:
  - runlabqa-data:/data
  - ${RUNLABQA_PROFILES_DIR:-../runlab-agrimpex-api/profiles}:/data/profiles
  - ${PLAYWRIGHT_KIT_DIR:-/home/.../playwright-kit-profesional}:${PLAYWRIGHT_KIT_DIR:-/home/.../playwright-kit-profesional}
```

Tres capas con efectos distintos:

1. **Volumen nombrado `runlabqa-data` → `/data`**: datos generales (snapshots, artefactos no-perfil).
2. **Bind mount de perfiles → `/data/profiles`**: los perfiles creados antes de dockerizar. Tiene prioridad sobre la ruta `/data/profiles` del volumen anterior.
3. **Bind mount del kit Playwright → su misma ruta absoluta**: así los `projectPath` guardados en `config.json` siguen siendo válidos sin editarlos.

> El mount del kit **no** lleva `:ro` porque las ejecuciones escriben `test-results/` y `playwright-report/`. Si solo recolectas el catálogo (`--list`), puedes añadir `:ro`.

### 5.6 `extra_hosts`

```yaml
extra_hosts:
  - "host.docker.internal:host-gateway"
```

Permite que la API alcance servicios del host (AUT en `localhost:5000` / `:8990`) como `host.docker.internal:5000` / `:8990`.

### 5.7 `networks`

```yaml
networks:
  - runlabqa-network

networks:
  runlabqa-network:
    name: runlabqa-network
    driver: bridge
```

Red bridge privada: la UI habla con la API por nombre de servicio. No se publica al exterior; solo los `ports` declarados son accesibles desde el host.

### 5.8 `depends_on` + healthcheck

```yaml
depends_on:
  runlabqa-api:
    condition: service_healthy
```

El healthcheck del `Dockerfile` de la API hace `GET /api/openapi.json` cada 30 s. La UI no arranca hasta que responde `200`.

---

## 6. Cómo funcionan los `.env` en este YAML

Versión corta: **Compose lee el `.env` que está junto al `docker-compose.yml` (aquí, `runlab-agrimpex-ui/`) y sustituye `${VAR}` por su valor; si no existe, usa el default después de `:-`.** Esos valores se inyectan al compose, no directamente a la app.

Detalle importante:

1. **Dónde se lee.** Al ejecutar `docker compose ...` en `runlab-agrimpex-ui/`, Compose busca `./.env`. El `.env.example.stack` es solo la plantilla; hay que copiarlo si quieres cambiar algo.
2. **Sintaxis.** `${VAR:-valor}` = “usa `VAR`; si no está definida o está vacía, usa `valor`”. `${VAR}` sin default deja cadena vacía.
3. **Prioridad.** Variables exportadas en la shell > valores de `.env` > default `:-` del YAML. Ejemplo: `API_PORT=3011 docker compose up -d` gana sobre `API_PORT=3001` del `.env`.
4. **Un solo `.env`, dos lectores.** Como el compose y Vite viven en la misma carpeta, el mismo `.env` lo lee Compose para el stack y también Vite en `npm run dev` local. El backend manual usa variables de shell o su propio `.env`.
5. **Build-time vs runtime.**
   - `VITE_*` y `API_BASE_IMAGE` / proxy se convierten en **build-args**: se graban en la imagen; requieren `--build`.
   - `TZ`, `RUNLABQA_NOVNC_*`, `UPDATE_TOKEN`, puertos y rutas de montaje son **runtime**: basta `up -d` para recrear el contenedor.
   - Los `VITE_*` además se **hornean en el bundle JavaScript**: los descarga el navegador, así que deben apuntar a una IP/puerto accesibles desde el navegador, no desde dentro del contenedor.
6. **Buenas prácticas.** `KEY=VAL` sin espacios alrededor de `=`; sin `export`; una variable por línea; comentarios con `#`. `.env` está en `.gitignore`: nunca subas tokens. Si cambias `VITE_API_URL` en `.env`, reconstruye la UI: `docker compose up -d --build runlabqa-ui`.

 Ejemplo mental:

```dotenv
# .env (repo de la UI)
UI_PORT=3002
VITE_API_URL=http://localhost:3001/api
```

```yaml
ports:
  - "${UI_PORT:-3002}:3000"          # → 3002:3000
args:
  VITE_API_URL: ${VITE_API_URL:-...} # → se escribe en el bundle
```

---

## 7. Referencia completa de variables

| Variable | Tipo | Default | Cuándo aplica | Descripción |
|---|---|---|---|---|
| `API_PORT` | Compose / runtime | `3001` | `up -d` | Puerto publicado de la API. |
| `UI_PORT` | Compose / runtime | `3002` | `up -d` | Puerto publicado de la UI. `3000` es DAM. |
| `VITE_API_URL` | Build-arg Vite | `http://localhost:3001/api` | `--build runlabqa-ui` | Base REST horneada en el bundle. |
| `VITE_SOCKET_URL` | Build-arg Vite | `http://localhost:3001` | `--build runlabqa-ui` | Origen Socket.io; se deriva de `VITE_API_URL` si se omite. |
| `API_BASE_IMAGE` | Build-arg API | `node:22-alpine` | `--build runlabqa-api` | Base opcional Playwright. |
| `HTTP_PROXY` | Build-arg | vacío | `--build` | Proxy para npm. |
| `HTTPS_PROXY` | Build-arg | vacío | `--build` | Proxy para npm. |
| `NO_PROXY` | Build-arg | vacío | `--build` | Excepciones de proxy. |
| `RUNLABQA_DATA_DIR` | Runtime (fijo en compose) | `/data` | `up -d` | Raíz de persistencia de la API. |
| `RUNLABQA_NOVNC_HOST` | Runtime | `host.docker.internal` | `up -d` | Host del proxy noVNC. |
| `RUNLABQA_NOVNC_PORT` | Runtime | `7900` | `up -d` | Puerto del proxy noVNC. |
| `TZ` | Runtime | `America/Argentina/Buenos_Aires` | `up -d` | Zona horaria de schedules. |
| `UPDATE_TOKEN` | Runtime | vacío | `up -d` | Habilita `/api/system/update` (vacío = 503). |
| `RUNLABQA_PROFILES_DIR` | Bind mount | `../runlab-agrimpex-api/profiles` | `up -d` | Origen de los perfiles previos. |
| `PLAYWRIGHT_KIT_DIR` | Bind mount | ruta absoluta del kit | `up -d` | Se monta en la misma ruta dentro del contenedor. |

---

## 8. Persistencia y montajes

| Ruta | Origen | Se borra con `down -v`? | Contenido |
|---|---|---|---|
| `/data` | volumen `runlabqa-data` | Sí | Datos generales, snapshots |
| `/data/profiles` | `../runlab-agrimpex-api/profiles` | **No** | `index.json`, configs, entornos, schedules, caché, reportes |
| ruta del kit | `/home/.../playwright-kit-profesional` | **No** | Suite Playwright del kit |

Consecuencias:

- `docker compose down` → contenedores fuera, datos intactos.
- `docker compose down -v` → se elimina el volumen `runlabqa-data`; **los perfiles del host sobreviven**.
- Copia de seguridad de los perfiles:

```bash
tar -czf ~/runlabqa-profiles-$(date +%F).tgz \
  -C ../runlab-agrimpex-api profiles
```

---

## 9. Red y puertos

```text
Navegador
   │ :3002
   ▼
runlabqa-ui:3000 ──red runlabqa-network──► runlabqa-api:3001
                                                │
                                                ├─ /data       (runlabqa-data)
                                                ├─ /data/profiles (repo)
                                                └─ kit Playwright (host)
```

- `host.docker.internal` apunta al host gracias a `extra_hosts`.
- Si despliegas en otro equipo, cambia `VITE_API_URL` y `VITE_SOCKET_URL` a `http://<IP-del-servidor>:3001...` y reconstruye la UI.
- No expongas la API directamente a internet: no tiene autenticación y CORS es abierto.

---

## 10. Ciclo de vida

```bash
docker compose config --quiet                     # validar YAML + .env
docker compose up -d --build                      # construir y levantar todo
docker compose up -d --build runlabqa-ui          # solo UI (tras cambiar VITE_*)
docker compose up -d --build runlabqa-api         # solo API (tras cambiar build-args)
docker compose up -d runlabqa-api                 # recrear por cambios de entorno
docker compose ps                                 # estado
docker compose logs -f                            # logs de ambos
docker compose logs -f runlabqa-api               # logs de la API
docker compose exec runlabqa-api sh               # shell en la API
docker compose restart runlabqa-ui                # reiniciar sin recrear
docker compose down                               # parar, conservar datos
docker compose down -v                            # parar y borrar runlabqa-data
```

---

## 11. Verificación

```bash
docker compose ps
curl -i http://localhost:3001/api/openapi.json   # 200
curl -i http://localhost:3001/api/profile-admin   # 200, 5 perfiles
curl -i http://localhost:3002/                    # 200
docker compose exec runlabqa-api sh -c 'ls /data/profiles'
```

Esperado:

```text
runlabqa-api   Up (healthy)   0.0.0.0:3001->3001/tcp
runlabqa-ui    Up             0.0.0.0:3002->3000/tcp
count=5
perfil-1, perfil-qa-test-2, perfil-1-copia, alain, jorge
<title>RunLab Agrimpex — QA Dashboard</title>
```

---

## 12. Migración desde los antiguos nombres `qadash-*`

Si aún tienes contenedores/volúmenes del naming anterior:

```bash
# 1) Parar y quitar contenedores antiguos
docker stop qadash-ui qadash-api 2>/dev/null || true
docker rm qadash-ui qadash-api 2>/dev/null || true

# 2) Crear el volumen nuevo y copiar el contenido del antiguo
docker volume create runlabqa-data
docker run --rm \
  -v qadash-data:/old \
  -v runlabqa-data:/new \
  node:22-alpine sh -c 'cp -a /old/. /new/'

# 3) Levantar con los nombres nuevos
docker compose up -d --build

# 4) Limpiar recursos antiguos (opcional pero recomendado)
docker network rm qadash-network 2>/dev/null || true
docker volume rm qadash-data 2>/dev/null || true
docker rmi qadash-agrimpex-api qadash-agrimpex-ui 2>/dev/null || true
```

> Los perfiles no estaban en `qadash-data`: viven en `../runlab-agrimpex-api/profiles` y ya se montan directamente. El paso 2 preserva solo los datos generales del volumen.

---

## 13. Imagen Playwright opcional

`mcr.microsoft.com/playwright:v1.62.1-noble` **no es necesaria** para levantar el dashboard; REST y Socket.io funcionan con `node:22-alpine`. Se usa solo si quieres ejecutar Playwright **dentro del contenedor de la API**.

Ventajas: versión `1.62.1` alineada con `@playwright/test`, Chromium/Firefox/WebKit + libs del sistema ya instaladas (glibc), builds reproducibles tras el primer pull, paridad con CI y mismo uid `1000` (`pwuser`). Coste: ~1.7 GB y descarga única.

Activación:

```bash
# .env (repo de la UI)
API_BASE_IMAGE=mcr.microsoft.com/playwright:v1.62.1-noble

docker compose up -d --build runlabqa-api
```

Si tus tests usan un grid remoto (`SELENIUM_REMOTE_URL`), puedes quedarte con Alpine.

---

## 14. Solución de problemas

| Síntoma | Causa | Acción |
|---|---|---|
| `http://localhost:3000` muestra otra app | Es `dam-frontend` | Usa `3002`. |
| La UI carga pero `/api` falla | `VITE_API_URL` incorrecta o API caída | Revisar `ps`, `curl :3001/api/openapi.json`, reconstruir UI. |
| REST ok, sin eventos en vivo | Origen Socket.io distinto | Verificar `VITE_SOCKET_URL` en el bundle. |
| `EADDRINUSE` en 3001/3002 | Proceso host u otro contenedor | Cambiar `API_PORT`/`UI_PORT` en `.env` o liberar el puerto. |
| `Executable doesn't exist at ...` | Versión de navegadores distinta | Usar la imagen Playwright `v1.62.1-noble`. |
| No aparecen los 5 perfiles | Falta el bind mount | Verificar `RUNLABQA_PROFILES_DIR` y `ls /data/profiles`. |
| `EACCES` en `/data` | Volumen con otro uid | `docker compose exec -u root runlabqa-api chown -R 1000:1000 /data`. |
| Cambié `.env` y no surte efecto | Variable de build o contenedor no recreado | `up -d --build` para build-args / `VITE_*`; `up -d` para runtime. |

---

## 15. Seguridad

- Red de confianza: la API no tiene autenticación y CORS está abierto.
- `UPDATE_TOKEN` vacío deshabilita `/api/system/update` (503). No lo expongas.
- El socket de Docker y el CLI del host están **comentados** en el compose; actívalos solo si necesitas `/api/docker`.
- El kit se monta escribible por las corridas; no lo expongas fuera del host.

---

## 16. Relación con los repos de API y UI

- [README de la API](../runlab-agrimpex-api/README.md) — ejecución manual, variables `RUNLABQA_*`, contrato REST/Socket.io y Playwright.
- [README de la UI](README.md) — desarrollo con Vite, production build y consumo del stack Docker.
- [Guía de onboarding Docker](docs/ONBOARDING_DOCKER.md) — recorrido paso a paso para terceros.
