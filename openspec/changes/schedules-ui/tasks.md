## 1. Listado y CRUD de programaciones

- [ ] 1.1 Implementar listado de programaciones (`schedulesApi.list/get`) con metadatos relevantes; verificar render y estados vacío/error.
- [ ] 1.2 Implementar creación y edición de programaciones (`create/update`) con formulario de parámetros soportados; verificar persistencia y refresco del listado.
- [ ] 1.3 Implementar toggle y eliminación con confirmación (`toggle/delete`); verificar cambios de estado y borrado en UI.

## 2. Ejecución y actividad

- [ ] 2.1 Implementar ejecución manual (`runNow`) y manejo de respuestas de conflicto/error; verificar feedback al usuario.
- [ ] 2.2 Integrar eventos `schedule:run|log` para mostrar actividad; verificar actualización ante eventos recibidos.

## 3. Integración y disponibilidad

- [ ] 3.1 Integrar selección de tests desde el catálogo (`testsApi.cached/collect`) en el formulario; verificar que se guardan los `testIds` seleccionados.
- [ ] 3.2 Manejar feature deshabilitada; verificar comportamiento de módulo no disponible.

## 4. Verificación

- [ ] 4.1 Ejecutar `npm run lint` y `npm run build`; verificar que finalizan sin errores.
- [ ] 4.2 Validar con backend: CRUD, toggle, run-now y eventos operan según contrato.
