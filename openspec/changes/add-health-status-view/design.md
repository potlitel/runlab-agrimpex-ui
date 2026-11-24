# Design

## Context

La API ya expone `GET /api/health` para liveness y `GET /api/health/detail` para readiness, y el header consume el detalle mediante una única consulta de React Query con sondeo de 30 s. La badge resuelve el aviso rápido, pero no ofrece el desglose de checks; además, el README documenta `docker compose up -d --build` para publicar cambios, aunque no registra el flujo explícito de reconstruir imágenes y recrear contenedores que se usó para esta entrega. Ver `proposal.md` para la motivación y `specs/runtime-health/spec.md` para los requisitos.

## Goals / Non-Goals

**Goals:**

- Reutilizar el estado de salud existente para que badge y vista nunca divergan.
- Presentar checks críticos e informativos con etiquetas legibles sin exponer datos internos.
- Mantener la vista utilizable ante errores de red y ofrecer reintento manual.
- Mejorar la diagnosis visual con iconos, badges semánticos, tendencias y detalle por demanda.
- Hacer visible la frescura de los datos mediante cuenta regresiva, pulso de refresco y tiempo relativo.
- Dejar registrado el procedimiento de build y recreate de contenedores en el README.

**Non-Goals:**

- Cambiar los endpoints, el healthcheck de Docker ni la semántica de códigos de respuesta.
- Añadir autenticación, persistencia nueva ni dependencias externas.
- Mostrar stack traces o mensajes crudos de Express; los mensajes siguen siendo genéricos.
- Migrar la vista a Angular ni crear `src/app/modules/health/`.
- Bloquear rutas o queries cuando el backend esté degradado o inalcanzable.
- Modificar perfiles, reportes, evidencias ni el `projectPath` de `perfil-1`.

## Decisions

- **Una sola fuente de estado.** La vista consume el mismo estado de React Query que la badge, en lugar de crear un segundo cliente o un intervalo propio. Alternativa descartada: consultar `/api/health/detail` de forma independiente, que duplicaría peticiones y podría mostrar estados distintos entre header y vista.
- **Ruta dedicada con layout autenticado.** Se añade `/health` al árbol de rutas de TanStack Router y una entrada **Salud** bajo **Sistema** en el sidebar, usando el mismo `AuthenticatedLayout` que las demás vistas. Alternativa descartada: un panel dentro de Ajustes, que dificultaría el acceso desde la navegación principal.
- **Presentación por grupos.** Los checks se dividen en críticos e informativos; los identificadores estables se traducen a nombres legibles y `not_configured` se muestra como «Sin configurar» sin contarse como fallo. Alternativa descartada: mostrar el JSON crudo, que expondría detalle interno y sería difícil de interpretar.
- **Errores como aviso, no como compuerta.** Un error de red se representa como `offline` con un mensaje de reintento; la estructura de la vista y las demás queries siguen activas. Alternativa descartada: una pantalla de error de ruta, que impediría diagnosticar y confirmar la recuperación.
- **Documentación operativa explícita.** El README pasa a incluir la secuencia `docker compose build runlabqa-api runlabqa-ui` seguida de `docker compose up -d --force-recreate runlabqa-api runlabqa-ui`, porque `up -d --build` no garantiza por sí solo el recreado forzoso de contenedores ya existentes con la misma imagen. Alternativa descartada: `restart`, que no incorpora cambios del bundle horneado.
- **Iconografía y semántica sin ambigüedad.** Un mapa de iconos por identificador de check y variantes de badge por estado se complementan siempre con la etiqueta textual. Alternativa descartada: distinguir estados solo por color.
- **Gráficos sin nuevo contrato.** El sparkline y el indicador radial se derivan del historial en memoria de las respuestas ya recibidas, usando `recharts` (dependencia existente). Alternativa descartada: añadir un endpoint de métricas históricas en la API.
- **Frescura derivada del estado de consulta.** La cuenta regresiva se calcula desde `dataUpdatedAt` y el punto de refresco desde `isFetching`, sin un temporizador paralelo. Alternativa descartada: un intervalo independiente que pudiera desincronizarse del sondeo real.
- **Detalle sanitizado y acción contextual.** Cada check muestra su tiempo relativo y un panel expandible con el mensaje genérico; `not_configured` ofrece «Configurar ahora» hacia `/settings`. Alternativa descartada: exponer el error crudo de Express o su stack trace.

## Risks / Trade-offs

- [La vista y la badge comparten caché] → Un reintento manual actualiza ambas; se documenta como comportamiento esperado.
- [El bundle hornea `VITE_*`] → Cualquier cambio de URLs exige reconstruir la imagen UI; el README indica el procedimiento.
- [Los mensajes de checks pueden contener detalle sensible] → La UI muestra solo el mensaje genérico devuelto por la API y nunca interpreta rutas ni valores de entorno.
- [La ruta nueva depende del `routeTree.gen.ts` generado] → La tarea de implementación incluye regenerarlo y verificar `tsc -b` antes de publicar.
- [El historial en memoria se pierde al recargar] → La vista muestra «Sin datos» y reconstruye la tendencia con las siguientes respuestas.
- [`recharts` aumenta el tamaño del bundle] → Ya está instalado y se carga solo en esta vista; se acepta el coste frente a un endpoint de métricas nuevo.
- [Múltiples indicadores pueden distraer] → Se agrupan en la cabecera y todos conservan etiquetas accesibles.

## Migration Plan

No hay migración de datos. Para publicar: reconstruir las imágenes API y UI, recrear ambos contenedores y comprobar `/api/health`, `/api/health/detail` y `/health`. Para revertir solo las mejoras visuales, retirar los componentes de gráficos, iconos, cuenta regresiva y accordion, dejando la vista base con checks y reintento. Para revertir la vista completa: retirar la ruta, la entrada del sidebar y el directorio `features/health`, regenerar el árbol de rutas y restaurar el README; los endpoints y el healthcheck pueden permanecer activos de forma independiente.

## Open Questions

Ninguna: el contrato de salud, el intervalo de sondeo y el comportamiento no bloqueante ya están definidos por el change `add-api-health-status`.
