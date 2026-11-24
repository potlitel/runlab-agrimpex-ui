# Tasks

## 1. Configuración del stack en la API

- [x] 1.1 Crear el módulo de configuración del stack con allowlist, parser que conserva comentarios y claves no administrables, validación de valores, escritura temporal + `rename` y copia de seguridad en `/data/config-backups`; verificar con tests la actualización válida, clave no permitida, valor con salto de línea y conservación del resto del archivo.
- [x] 1.2 Añadir `GET`/`PUT /api/system/stack-config` y `POST /api/system/stack-config/restore` con gate por `UPDATE_TOKEN` en comparación de tiempo constante; verificar con tests el `503` sin token, secretos devueltos como `null`, operaciones `keep`/`set`/`clear` y la restauración sin copia disponible.
- [x] 1.3 Exponer `GET /api/system/public-config` sin secretos y publicar `public-config.json` en el volumen compartido con `configVersion`; verificar con tests que la respuesta contiene solo URLs y versión, y que el archivo se actualiza tras un guardado.
- [x] 1.4 Añadir a `docker-compose.yml` el montaje del directorio del `.env` y del volumen de configuración pública, con la documentación del procedimiento; verificar con `docker compose config` que ambos montajes resuelven y que la API puede escribir el archivo.

## 2. Bootstrap de configuración en runtime

- [x] 2.1 Hacer que `src/lib/api.ts` y `src/lib/socket.ts` acepten la configuración pública antes de crear el cliente HTTP y el socket, con fallback a `VITE_API_URL`/`VITE_SOCKET_URL`; verificar con tests la base de axios y el origen del socket con y sin configuración pública.
- [x] 2.2 Cargar `/public-config.json` en el arranque con `cache: 'no-store'`, aplicarlo antes de renderizar y avisar si se usa el fallback; verificar con un test de bootstrap que la UI renderiza en ambos casos y muestra la versión cargada.

## 3. Vista de administración

- [x] 3.1 Añadir la sección de administración del stack en Ajustes con tabla de variables permitidas, campos de secretos write-only y entrada del token de administración guardada solo en `sessionStorage`; verificar con tests el render de secretos enmascarados y el estado deshabilitado cuando la API responde `503`.
- [x] 3.2 Implementar guardado con operaciones `keep`/`set`/`clear`, indicador de «pendiente de aplicar» con el comando exacto de recreación y botón de restaurar con confirmación; verificar con tests el payload enviado, el marcado de cambios que requieren recrear contenedores y la restauración.
- [x] 3.3 Actualizar `README.md` con el nuevo flujo de despliegue con hostname real, el gate por `UPDATE_TOKEN` y la distinción entre este `.env` y los `.env` del proyecto; verificar que el procedimiento sustituye a la instrucción de reconstruir la UI por cambiar `VITE_*`.

## 4. Verificación de integración

- [x] 4.1 Ejecutar `tsc -b`, Vitest, ESLint y el build de la UI; verificar que finalizan sin errores.
- [x] 4.2 Probar el stack reconstruido: sin token la vista queda deshabilitada, con token un cambio de URL pública se aplica sin rebuild, un cambio de token queda pendiente y la restauración recupera el valor anterior; verificar los endpoints y el `configVersion` tras cada paso.
