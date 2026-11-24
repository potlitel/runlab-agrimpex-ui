# Tasks

## 1. Vista de salud y navegación

- [x] 1.1 Crear `src/features/health/health-page.tsx` con estado general, tiempo activo, `failedChecks`, listados de checks críticos/informativos y botón **Actualizar** que reutilice el estado de salud existente; verificar con `npx tsc -b --pretty false` y un test de render que muestra ambos grupos sin vaciar la vista.
- [x] 1.2 Registrar la ruta `/health` en `src/routes/health.tsx` y regenerar `src/routeTree.gen.ts` con el plugin de TanStack Router; verificar que la compilación incluye `'/health'` y que `npx vite build` termina sin errores.
- [x] 1.3 Añadir la entrada **Salud** bajo **Sistema** en `src/components/layout/data/sidebar-data.ts`; verificar en navegador que el enlace `/health` aparece en el sidebar y abre la vista.

## 2. Comportamiento no bloqueante y reintento

- [x] 2.1 Comprobar que la vista usa el mismo sondeo de 30 s y el mismo `refresh()` que la badge, sin segundo cliente ni intervalo propio; verificar con tests que el botón **Actualizar** dispara una sola consulta y que el aviso de desconexión coexiste con la estructura de la página.
- [x] 2.2 Traducir los identificadores de checks a nombres legibles y el estado `not_configured` a «Sin configurar», sin mostrar rutas ni valores de entorno; verificar con tests que un check degradado se lista en su grupo y que un check no configurado no cuenta como fallo.
- [x] 2.3 Verificar en navegador los estados `ok`, `degraded` y `offline` simulados: la vista permanece visible, el aviso indica reintento y el botón restablece el estado real sin recargar la página.

## 3. Documentación y publicación

- [x] 3.1 Documentar la vista `/health`, su reintento y su carácter no bloqueante en el README de la UI; verificar que el índice, la lista de vistas y el árbol de `src/features` mencionan `health/`.
- [x] 3.2 Añadir al README el procedimiento de publicación con `docker compose build runlabqa-api runlabqa-ui` y `docker compose up -d --force-recreate runlabqa-api runlabqa-ui`, explicando que `restart` no actualiza el bundle horneado; verificar que el comando aparece literalmente y que `docker compose ps` muestra ambos contenedores activos tras ejecutarlo.
- [x] 3.3 Verificar la suite UI completa con `npm test`, reconstruir las imágenes, recrear los contenedores y comprobar `GET /api/health`, `GET /api/health/detail` y `http://localhost:3002/health` con respuesta `200`.

## 4. Mejoras visuales y frescura (React/Vite)

- [x] 4.1 Asignar un icono por check y variantes de badge semánticas con etiqueta textual en `src/features/health/health-page.tsx`; verificar con un test de render que `ok`, `not_configured` y fallidos muestran icono, color y texto sin depender solo del color.
- [x] 4.2 Añadir un sparkline/área de uptime o latencia reciente y un indicador radial del porcentaje de checks correctos usando `recharts` con historial en memoria derivado de la query; verificar con tests que los gráficos renderizan con datos simulados sin llamadas API adicionales.
- [x] 4.3 Mostrar cuenta regresiva hasta el próximo sondeo y un punto parpadeante durante el refresco desde `dataUpdatedAt`/`isFetching`; verificar con timers simulados que la cuenta baja de 30 s, se reinicia tras el sondeo y el pulso aparece solo durante la consulta.
- [x] 4.4 Mostrar «Hace Xs» por check, un panel expandible con el mensaje genérico y «Configurar ahora» para `not_configured` hacia `/settings`; verificar con tests que no se renderizan stack traces, rutas ni valores de entorno y que el enlace apunta a ajustes.
- [x] 4.5 Documentar iconos, gráficos, cuenta regresiva, pulso y accordion en el README de la UI; verificar que la sección «Vista de salud» menciona cada mejora y el carácter no bloqueante.
- [x] 4.6 Verificar `npm test`, `npx tsc -b --pretty false` y en navegador que `ok`, `degraded` y `offline` siguen sin vaciar la vista con las mejoras activas; verificar que todas las comprobaciones terminan en verde.

## Workflow follow-up

- Aplicar el grupo 4 antes de archivar: las tareas 1-3 ya están completadas y el código actual no incluye estas mejoras.
- Revisar y aprobar los artefactos revisados antes de aplicar el grupo 4.
- Archivar este change y `add-api-health-status` solo después de la aprobación correspondiente.
- No hacer push, review ni merge sin autorización explícita.
