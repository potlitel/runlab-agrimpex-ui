## 1. Árbol de tests y estado base

- [x] 1.1 Implementar carga de tests (`testsApi.cached`/`collect`) y visualización del árbol/listado con totales y proyectos; verificar render correcto y acción de refresco.
- [x] 1.2 Manejar estados sin proyecto configurado, colección vacía y errores de API; verificar mensajes/acciones de recuperación.

## 2. Configuración y control de ejecución

- [x] 2.1 Construir UI de selección de tests y parámetros de corrida (project/grep/workers, opciones y variables soportadas) y lanzar ejecución (`testsApi.run`); verificar envío del payload correcto y feedback de inicio/conflicto.
- [x] 2.2 Implementar consulta de estado y acción de abortar (`testsApi.status/abort`); verificar que la UI refleja ejecución en curso y aborto.

## 3. Ejecución en vivo y resultados

- [x] 3.1 Integrar suscripciones socket (`execution:*`, `test:*`, `progress`) para actualizar progreso, estado por test y consola de salida en tiempo real; verificar actualización ante eventos simulados/reales.
- [x] 3.2 Presentar resumen/resultados de la corrida al finalizar/abortar y acceso a información del reporte cuando esté disponible; verificar consistencia con eventos recibidos.

## 4. Archivos de test y composición de vistas

- [x] 4.1 Implementar visualización (y guardado si aplica) de archivos de test vía `testsApi.getFile/saveFile`; verificar carga y manejo de errores de acceso.
- [x] 4.2 Componer rutas `/` (Dashboard) y `/tests` con roles definidos reutilizando componentes de ejecución; verificar navegación y ausencia de placeholders.

## 5. Verificación

- [x] 5.1 Ejecutar `npm run lint` y `npm run build`; verificar que finalizan sin errores.
- [x] 5.2 Validar con backend y proyecto configurado: descubrir, ejecutar y abortar tests con eventos en vivo visibles.
