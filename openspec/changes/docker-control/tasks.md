## 1. Estado y diagnóstico

- [x] 1.1 Implementar consulta y visualización de estado/diagnóstico de Docker (`dockerApi.check/status/containers`); verificar render de información y estados no disponibles.
- [x] 1.2 Implementar acción de inicio de Docker Desktop cuando aplique (`dockerApi.startDesktop`); verificar feedback de la operación.

## 2. Acciones y reporte

- [x] 2.1 Implementar acciones run/stop (`dockerApi.run/stop`) con control de estado de UI; verificar invocación y actualización tras respuesta.
- [x] 2.2 Exponer acceso al reporte de Docker cuando esté disponible (`dockerApi.reportUrl/status.hasReport`); verificar visibilidad condicional.

## 3. Logs en vivo y disponibilidad

- [x] 3.1 Integrar suscripción a eventos `docker:*` para mostrar logs/estado en tiempo real; verificar actualización ante eventos.
- [x] 3.2 Manejar feature deshabilitada y errores; verificar mensajes y degradación adecuada.

## 4. Verificación

- [x] 4.1 Ejecutar `npm run lint` y `npm run build`; verificar que finalizan sin errores.
- [x] 4.2 Validar con backend/Docker disponible: estado, acciones y logs funcionan según contrato.
