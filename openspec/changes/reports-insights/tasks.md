## 1. Historial y detalle

- [ ] 1.1 Implementar listado de reportes (`reportsApi.list`) con presentación de resumen y navegación a detalle; verificar carga y render de elementos.
- [ ] 1.2 Implementar vista de detalle (`reportsApi.get`) con resultados por test y manejo de reporte no encontrado/error; verificar visualización correcta.

## 2. Analítica y artefactos

- [ ] 2.1 Implementar panel de analítica (`reportsApi.analytics`) con KPIs y visualizaciones según datos disponibles; verificar estados con y sin datos.
- [ ] 2.2 Integrar descargas y acceso a assets (`download/json|html`, assets) desde el listado/detalle; verificar que las acciones apuntan a los recursos correctos.

## 3. Gestión y disponibilidad

- [ ] 3.1 Implementar eliminación de reportes con confirmación e invalidación/refresco de datos; verificar que el reporte se elimina de la UI.
- [ ] 3.2 Manejar feature/módulo no disponible y errores de API; verificar mensajes y comportamiento degradado adecuado.

## 4. Verificación

- [ ] 4.1 Ejecutar `npm run lint` y `npm run build`; verificar que finalizan sin errores.
- [ ] 4.2 Validar con backend y reportes existentes: listado, analítica, detalle, descargas y borrado operan correctamente.
