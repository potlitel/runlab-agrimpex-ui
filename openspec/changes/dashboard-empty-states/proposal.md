# Proposal

## Why

La vista principal del dashboard (`/`) pasa la mayor parte del tiempo en estado «En espera»: muestra texto estático, mucho espacio en blanco y paneles que no comunican qué información aparecerá ni qué acción realizar. Un operador que llega sin corrida activa no distingue fácilmente si el proyecto está configurado, cómo iniciar una corrida ni qué esperar en cada panel.

## What Changes

- Añadir estados vacíos visualmente claros en «Contexto de ejecución», «Última corrida», «Consola de ejecución» y «Resultados por test», con iconos de Lucide representativos (`FolderOpen`, `PlayCircle`, `Search`), texto secundario orientativo y una acción directa hacia Ajustes o Tests según corresponda.
- Transformar los datos del contexto de ejecución (proyecto, Docker, entorno, workers, comando) en badges o tarjetas compactas con icono de estado: confirmación verde cuando el dato está disponible e icono neutro cuando figura como «No registrado».
- Dar a la consola en espera apariencia de terminal: fondo oscuro, tipografía monoespaciada y mensaje de espera integrado, conservando el comportamiento accesible actual (`role='log'`, `aria-live`) y la distinción entre espera, ejecución y error.
- Mostrar en «Última corrida» un skeleton elegante con la forma de los datos que aparecerán (fecha, duración, tasa de éxito) cuando no exista reporte, manteniendo la acción para ir a Tests.
- Enriquecer la barra de búsqueda y filtros de «Resultados por test»: selects de shadcn/ui de ancho adecuado y estilo consistente, conservando las opciones, el orden y la limpieza de filtros existentes.
- No modificar contratos API, eventos Socket.io, cálculo de resúmenes ni la lógica de ejecución; el alcance es de presentación y navegación.

## Capabilities

### New Capabilities

- `execution-dashboard`: presentación de los paneles del dashboard de ejecución, incluyendo estados vacíos y de carga, señalización del contexto disponible y acciones de navegación ofrecidas desde cada panel.

### Modified Capabilities

Ninguna.

## Impact

- Componentes: `src/features/execution/components/project-context-card.tsx`, `last-run-card.tsx`, `execution-console.tsx` y `results-table.tsx`; ajustes menores en `src/features/execution/dashboard.tsx` y su prueba `dashboard.test.tsx` si cambian las estructuras renderizadas.
- Dependencias ya presentes: `lucide-react`, componentes shadcn/ui (`Badge`, `Button`, `Skeleton`, `Select`) y Tailwind 4. No se añaden dependencias ni endpoints.
- Riesgo principal: que los nuevos estados vacíos o el tema oscuro de la terminal reduzcan legibilidad o contradigan los mensajes de error/estado existentes; se mitigará reutilizando los tokens de tema y conservando textos y atributos accesibles.
