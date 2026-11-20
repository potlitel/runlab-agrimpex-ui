## 1. Archivos .env

- [x] 1.1 Implementar listado y carga de archivos `.env` (`envApi.files/get`) y editor de variables; verificar render y carga del contenido seleccionado.
- [x] 1.2 Implementar guardado de variables (`envApi.save/update`) con feedback de éxito/error; verificar persistencia tras recarga.

## 2. Entornos guardados por perfil

- [x] 2.1 Implementar CRUD y renombrado de entornos guardados (`profilesApi`); verificar cada operación y actualización del listado.
- [x] 2.2 Manejar estados vacío, errores y feature deshabilitada (`variables`); verificar comportamiento y mensajes.

## 3. Integración con ejecuciones

- [x] 3.1 Exponer selección de fuente de variables/entorno para uso en configuración de ejecuciones; verificar que los valores seleccionados se reflejan en el flujo de run.

## 4. Verificación

- [x] 4.1 Ejecutar `npm run lint` y `npm run build`; verificar que finalizan sin errores.
- [x] 4.2 Validar con backend: edición de `.env` y gestión de entornos operan según contrato.
