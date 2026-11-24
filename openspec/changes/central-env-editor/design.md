# Design

## Context

Ver `proposal.md` para la motivación. El `.env` del stack vive en la carpeta del repo UI junto a `docker-compose.yml` y hoy no es accesible desde la API. `routes/system.js` ya muestra el patrón de gate con `UPDATE_TOKEN` para `/api/system/update`. En la UI, `src/lib/api.ts` y `src/lib/socket.ts` leen `import.meta.env.VITE_API_URL` / `VITE_SOCKET_URL` al cargar el módulo, y `Dockerfile.npm` los hornea en el bundle. Los `.env` del proyecto de pruebas se gestionan en otro módulo (`environment-ui`) y no deben confundirse con este.

## Goals / Non-Goals

**Goals:**
- Permitir a un administrador con token consultar y cambiar desde el navegador solo las variables del stack que son operables.
- Nunca devolver secretos al navegador ni escribir claves fuera de una lista permitida.
- Que la URL pública sea configurable en runtime y no obligue a reconstruir la imagen de la UI.
- Conservar recuperación ante un cambio incorrecto y señalar qué cambios necesitan recrear contenedores.

**Non-Goals:**
- Proveer autenticación de usuarios completa ni control por roles: se reutiliza el token de administración ya existente como gate.
- Ejecutar `docker compose` desde la API ni exponer el daemon Docker al contenedor.
- Editar los `.env` del proyecto de pruebas ni los archivos de configuración de perfiles.
- Sustituir el build con `VITE_*` para despliegues que no usen el nuevo recurso; se mantiene como fallback.

## Decisions

- **Acceso al archivo:** montar el directorio que contiene el `.env` del stack en la API en una ruta fija y restringir al módulo de configuración a la escritura de ese único archivo. Se usa archivo temporal + `rename` dentro de ese mismo directorio para lograr escritura atómica; las copias de seguridad van al volumen `/data`, nunca al repo. Alternativa descartada: montar solo el archivo `.env`, porque un `rename` sobre un bind mount de archivo puede fallar y no da atomicidad real.
- **Protección:** los tres endpoints de configuración del stack exigen `UPDATE_TOKEN` y lo comparan en tiempo constante, igual que el registro de agentes. Si la variable no está definida, responden `503` sin revelar valores. La UI solicita el token al abrir la vista y lo guarda solo en `sessionStorage` de la pestaña.
- **Modelo de respuesta:** `{ values, secrets, pendingApply, configVersion }`. Las claves secretas devueltas son `null` y se acompañan de `secrets: { CLAVE: { configured: boolean } }`. En la escritura, cada secreto lleva `operation: keep|set|clear`; `keep` es el valor por defecto cuando el campo queda vacío. Alternativa descartada: devolver los secretos enmascarados con caracteres fijos;podría filtrarse en logs o copias de pantalla y no distingue «vacío» de «configurado».
- **Actualizador de `.env`:** parser línea a línea que conserva comentarios, líneas en blanco y claves no administrables, y reemplaza solo el valor de las claves de la allowlist. Validación: nombre `^[A-Z][A-Z0-9_]*$`, valores sin `\r`/`\n` y longitud acotada, URLs con protocolo `http(s)`, puertos numéricos, transporte `agent|local` y rutas absolutas. Cualquier clave desconocida en el payload se rechaza. Alternativa descartada: reescribir todo el archivo desde un mapa; perdería comentarios y variables añadidas a mano.
- **Configuración pública en runtime:** la API publica `GET /api/system/public-config` sin secretos (`apiBaseUrl`, `socketUrl`, `configVersion`) y escribe además un `public-config.json` en un volumen compartido montado como `/public-config.json` en la UI. La UI lo consulta en el bootstrap y actualiza la base de axios y el origen del socket antes de crearlos; si falla, usa los valores horneados actuales. Se elige un archivo servido por la propia UI para resolver el problema del huevo y la gallina: la UI necesita saber la URL de la API antes de poder preguntarle. Alternativa descartada: depender solo del endpoint de la API, que seguiría apuntando al hostname antiguo hasta que se reconstruya el bundle.
- **Superficie en la UI:** nueva sección de administración dentro de Ajustes, con tabla de variables editables, campos de secretos write-only, indicador de «pendiente de aplicar» y botón de restaurar. Los cambios de URL pública tienen efecto al recargar; los de token, transporte, puertos o rutas muestran el comando exacto `docker compose up -d --force-recreate <servicio>` sin ejecutarlo desde la aplicación.
- **Versionado:** cada guardado incrementa `configVersion` y crea una copia `stack-<timestamp>.env` en `/data/config-backups`, conservando las últimas 10. `POST /restore` vuelve a la copia inmediatamente anterior.

## Risks / Trade-offs

- [Montar el directorio del repo en la API Amplía la superficie visible] → el módulo solo acepta la ruta absoluta del `.env`, valida cada clave y nunca expone el contenido del resto del directorio; el daemon Docker sigue sin montarse.
- [Token de administración en `sessionStorage`] → mitigación parcial: se envía por header y no se persiste en `localStorage`; queda como deuda añadir una cookie httpOnly si se introduce autenticación real.
- [Secretos en copias de seguridad] → las copias quedan en el volumen `/data`, con el mismo nivel de confianza que el `.env` del host; se documenta y se limita su número.
- [Dos administradores guardando a la vez] → último escritor gana; las copias de seguridad permiten recuperar la versión anterior y `configVersion` hace visible el cambio.
- [Caché del navegador en `public-config.json`] → fetch con `cache: 'no-store'` y cabeceras sin caché en el servidor estático; la UI muestra la versión de configuración cargada.
- [Cambios solo parcialmente efectivos] → la UI distingue «aplicado» de «pendiente de aplicar» y nunca afirma que un cambio de token ya está activo.

## Migration Plan

1. Definir `UPDATE_TOKEN` en el `.env` del host y recrear la API por primera vez, antes de habilitar la vista.
2. Añadir los montajes del `.env` y del recurso público, desplegar API y UI, y verificar que `/api/system/stack-config` responde `503` sin token y datos enmascarados con token.
3. Probar en un entorno no productivo: cambio de URL pública, cambio de token, restauración y recreación manual de contenedores.
4. Rollback: usar `POST /restore` o copiar la última copia desde `/data/config-backups`; si el cambio afectó al bundle, reconstruir la imagen anterior.
