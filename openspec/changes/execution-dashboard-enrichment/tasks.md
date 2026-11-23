# Tasks

## 1. Estado de la corrida y resumen

- [x] 1.1 Conservar y exponer `reportId`, `timestamp` y las opciones efectivas de la última corrida en `useExecution`, alimentándolos desde `execution:completed`, `execution:aborted` y el momento del lanzamiento; verificado con una prueba que emite ambos eventos y comprueba los valores devueltos.
- [x] 1.2 Extraer un helper puro de fusión de resumen que priorice los campos presentes del reporte, conserva `duration` y `previewImage`, marque el estado como parcial cuando falle el detalle y derive la tasa de éxito sobre ejecutados; verificado con tests unitarios de los cuatro escenarios del spec.
- [x] 1.3 Mostrar en la consola y en el resumen del dashboard los nuevos campos (errores, omitidos, duración y tasa de éxito) y el indicador de resumen parcial; verificado con prueba de componente y revisión manual con detalle disponible y no disponible.

## 2. Última corrida y acciones de reporte

- [x] 2.1 Crear el bloque de «última corrida» que consuma `reportId`, `timestamp` y `summary`, y que preserve el progreso alcanzado en abortos; verificado con render sin reporte, con corrida completada y con corrida abortada.
- [x] 2.2 Conectar las acciones de ver reporte, exportar PDF y descargar JSON/HTML reutilizando el generador y las URLs existentes; verificado con un `reportId` local comprobando que el PDF se genera y que los enlaces apuntan al reporte correcto.
- [x] 2.3 Aplicar el feature gating del módulo `reports` con mensaje explicativo y acciones deshabilitadas; verificado con el módulo activo e inactivo, confirmando que consola y resultados siguen operativos.

## 3. Resultados explorables y evidencias

- [x] 3.1 Extraer helpers puros de búsqueda, filtro por estado, orden por fallos/duración y agrupación por archivo; verificado con tests unitarios que cubren coincidencias, sin coincidencias y orden mixto de estados.
- [x] 3.2 Añadir los controles de exploración y la expansión de salida completa en `ResultsTable`, con etiquetas de estado legibles; verificado con prueba de componente sobre una corrida simulada extensa.
- [x] 3.3 Mostrar miniaturas de `attachments` por fila y delegar la apertura al visor de evidencias existente, con fallback cuando un asset falle; verificado con un resultado con adjuntos válidos y otro con una URL rota.
- [x] 3.4 Mostrar un estado explícito cuando el resultado no tiene salida ni adjuntos, sin acciones vacías; verificado con un resultado mínimo en la tabla.

## 4. Contexto de ejecución del perfil activo

- [x] 4.1 Extraer la tarjeta de configuración/MCP de `tests-page.tsx` a un componente compartible sin cambiar su comportamiento en `/tests`; verificado con comparación visual de la pantalla de Tests antes y después.
- [x] 4.2 Renderizar en `/` la variante compacta de solo lectura con proyecto, entorno, Docker, workers, grep, detección de MCP y enlace a `/tests`, usando las opciones guardadas en 1.1 y los datos de configuración disponibles; verificado con perfil configurado y con corrida iniciada en esta sesión.
- [x] 4.3 Mostrar prerrequisito faltante, enlace a Ajustes o Entornos y acción de reintento cuando falle la consulta de configuración; verificado forzando el error de la query y omiendo valores desconocidos en corridas heredadas.

## 5. Estados y accesibilidad del monitor en vivo

- [x] 5.1 Distinguir espera, carga, sin resultados y error en consola y tabla, incorporando el error de catálogo/contexto y su reintento; verificado con los estados de las queries forzados en pruebas de componente.
- [x] 5.2 Exponer la consola como región de registro anunciable, el progreso con su valor accesible y una acción «Limpiar» que no altere resultados; verificado con aserciones de atributos en el DOM y revisión manual con lector de pantalla.

## 6. Verificación de integración

- [x] 6.1 Recorrer el flujo completo con un perfil configurado: iniciar una corrida desde `/tests`, volver a `/`, comprobar resumen, contexto, resultados filtrables, evidencias, exportar PDF y navegar al reporte; verificado manualmente en entorno local y con `npm run build` y la suite de tests existente en verde.
