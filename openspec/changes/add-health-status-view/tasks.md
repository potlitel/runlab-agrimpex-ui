# Tasks

## 1. Vista de salud y navegación

- [ ] 1.1 Crear `src/features/health/health-page.tsx` con estado general, tiempo activo, `failedChecks`, listados de checks críticos/informativos y botón **Actualizar** que reutilice el estado de salud existente; verificar con `npx tsc -b --pretty false` y un test de render que muestra ambos grupos sin vaciar la vista.
- [ ] 1.2 Registrar la ruta `/health` en `src/routes/health.tsx` y regenerar `src/routeTree.gen.ts` con el plugin de TanStack Router; verificar que la compilación incluye `'/health'` y que `npx vite build` termina sin errores.
- [ ] 1.3 Añadir la entrada **Salud** bajo **Sistema** en `src/components/layout/data/sidebar-data.ts`; verificar en navegador que el enlace `/health` aparece en el sidebar y abre la vista.

## 2. Comportamiento no bloqueante y reintento

- [ ] 2.1 Comprobar que la vista usa el mismo sondeo de 30 s y el mismo `refresh()` que la badge, sin segundo cliente ni intervalo propio; verificar con tests que el botón **Actualizar** dispara una sola consulta y que el aviso de desconexión coexiste con la estructura de la página.
- [ ] 2.2 Traducir los identificadores de checks a nombres legibles y el estado `not_configured` a «Sin configurar», sin mostrar rutas ni valores de entorno; verificar con tests que un check degradado se lista en su grupo y que un check no configurado no cuenta como fallo.
- [ ] 2.3 Verificar en navegador los estados `ok`, `degraded` y `offline` simulados: la vista permanece visible, el aviso indica reintento y el botón restablece el estado real sin recargar la página.

## 3. Documentación y publicación

- [ ] 3.1 Documentar la vista `/health`, su reintento y su carácter no bloqueante en el README de la UI; verificar que el índice, la lista de vistas y el árbol de `src/features` mencionan `health/`.
- [ ] 3.2 Añadir al README el procedimiento de publicación con `docker compose build runlabqa-api runlabqa-ui` y `docker compose up -d --force-recreate runlabqa-api runlabqa-ui`, explicando que `restart` no actualiza el bundle horneado; verificar que el comando aparece literalmente y que `docker compose ps` muestra ambos contenedores activos tras ejecutarlo.
- [ ] 3.3 Verificar la suite UI completa con `npm test`, reconstruir las imágenes, recrear los contenedores y comprobar `GET /api/health`, `GET /api/health/detail` y `http://localhost:3002/health` con respuesta `200`.

## Workflow follow-up

- Revisar y aprobar los artefactos antes de aplicar el change.
- Archivar este change y `add-api-health-status` solo después de la aprobación correspondiente.
- No hacer push, review ni merge sin autorización explícita.
