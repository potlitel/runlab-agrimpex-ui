# Design

## Context

La ruta `/` renderiza `ExecutionDashboard`, que compone `ProjectContextCard` (modo `compact`), `LastRunCard`, `ExecutionConsole` y `ResultsTable` a partir de `useExecution`, `useProjectConfig` y `contextFrom`. Los estados vacíos actuales son párrafos aislados: la consola usa `bg-muted/30`, la última corrida muestra texto y un enlace, la tabla usa un `<p>` y los filtros son `<select>` nativos. Ya existen `Skeleton`, `Select` y `Badge` de shadcn/ui, y `lucide-react` está disponible. La prueba `src/features/execution/dashboard.test.tsx` simuló `useExecution`, la API y `Link`, por lo que los cambios de marcado deben preservar esos textos y mocks. Véase `proposal.md` para la motivación y la spec delta para el contrato de comportamiento.

## Goals / Non-Goals

**Goals:**

- Unificar la presentación de estados vacíos de los cuatro paneles con icono, texto orientativo y acción de navegación.
- Hacer legible el contexto disponible frente al contexto «No registrado» sin cambiar `contextFrom` ni las consultas.
- Mantener o mejorar la accesibilidad: región de log anunciable, progreso con valor accesible y botones con etiqueta.
- Reutilizar componentes y tokens existentes, sin añadir dependencias.

**Non-Goals:**

- Cambiar la lógica de `useExecution`, eventos Socket.io, endpoints, cálculo de resúmenes ni exportación de reportes.
- Crear un patrón global de empty states para todo el producto ni tocar otras rutas.
- Permitir iniciar una corrida desde el dashboard: la acción «Iniciar Corrida» navega a `/tests`, donde ya se lanza; el propio panel de contexto indica que las corridas se inician desde Tests.
- Modificar los estilos de los diálogos de evidencias ni del visor de reportes.

## Decisions

1. **Patrón local reutilizable de estado vacío.** Se añade un componente pequeño dentro de `src/features/execution/components/` que recibe icono, título, descripción y acción opcional, y se usa en los cuatro paneles. Alternativa descartada: repetir el marcado en cada archivo (duplicación y divergencia de estilos). También se descarta subirlo a `src/components/`, porque ningún otro módulo lo necesita aún.
2. **Contexto como tarjetas compactas.** En el modo `compact` de `ProjectContextCard`, el `<dl>` se sustituye por una cuadrícula de unidades visuales por campo, cada una con icono, etiqueta y valor. Los presentes usan acento verde y los ausentes estilo neutro con «No registrado». Se conservan `contextFrom`, el badge de configuración, el badge de MCP, los textos de error y los enlaces a Ajustes y Tests. Alternativa descartada: convertirlo en tabla (peor densidad visual en el panel estrecho del dashboard).
3. **Consola con superficie de terminal.** Se mantiene `Card`/`CardHeader` y se aplica el aspecto de terminal únicamente al viewport de logs: fondo oscuro, texto monoespaciado y tipografía legible; el mensaje de espera se integra en esa superficie. Se ajusta el mapa de tonos de log para que conserve contraste sobre fondo oscuro. No se envuelve toda la tarjeta en tema oscuro para no alterar badge, progreso ni resumen. Alternativa descartada: depender de `dark:` del sistema (el aspecto debe ser consistente también en tema claro).
4. **Skeleton informativo en «Última corrida».** Sin `reportId`, se muestra un bloque con barras `Skeleton` que sugieren fecha, duración y tasa de éxito, acompañado del texto existente y del botón a Tests. El esqueleto es decorativo (`aria-hidden`) y el texto accesible sigue presente. Alternativa descartada: solo icono (no comunica qué datos llegarán).
5. **Selects de shadcn/ui en resultados.** Se sustituyen los dos `<select>` nativos por `Select`/`SelectTrigger`/`SelectValue`/`SelectContent`/`SelectItem`, con ancho mínimo fijo y consistente con el buscador, `aria-label` en el trigger y los mismos valores (`all`, estados, `failures`, `duration`). Se conservan el contador, `groupByFile` y `clearFilters`. Alternativa descartada: dar estilo a los nativos (resultados inconsistentes entre navegadores).
6. **Pruebas centradas en comportamiento.** Se amplían las pruebas del dashboard para los estados vacíos y se comprueba que los controles de filtros siguen aplicando búsqueda, estado y orden. Los selectores de Radix se consultan por su etiqueta accesible, no por clases. Alternativa descartada: snapshots de marcado (frágiles ante cambios de estilo).

## Risks / Trade-offs

- [Fondo oscuro de la consola poco legible en tema claro o con contraste forzado] → usar colores con contraste suficiente para texto y tonos de log, y marcar los adornos como `aria-hidden`.
- [El esqueleto puede interpretarse como dato real] → acompañarlo siempre del texto «Todavía no hay una corrida finalizada en esta sesión» y de la acción a Tests; ocultarlo al lector de pantalla.
- [Los `Select` de Radix renderizan en portal y complican las pruebas] → interactuar por rol y nombre accesible, sin depender de la estructura DOM interna; mantener `aria-label`.
- [Cambio de marcado rompe pruebas existentes que buscan textos concretos] → conservar los textos «Consola de ejecución», «Resultados por test» y «Sin coincidencias con los filtros actuales».
- [Añadir un componente compartido incrementa el alcance] → mantenerlo dentro de la feature, sin exportarlo fuera de `execution/`.

## Migration Plan

Sin migración de datos ni despliegue especial: es un cambio de presentación. Orden sugerido: componente de estado vacío → contexto → última corrida → consola → resultados → pruebas. Verificación: `npm test`, `npm run lint`, `npm run build` y revisión visual de `/` con perfil sin configurar, con corrida finalizada y con corrida en curso. Rollback: revertir los archivos de la feature; no hay estado persistente que migrar.
