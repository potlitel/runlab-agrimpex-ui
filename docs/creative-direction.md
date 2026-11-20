# Dirección creativa — RunLab Agrimpex UI

> Documento de dirección creativa del dashboard. Cubre la capa **conductual** (cómo se comporta el producto) y la capa **visual** (cómo se ve), alineado con la base `shadcn-admin`, Tailwind 4 y el contrato de `runlab-agrimpex-api`.

## 1. Norte creativo

**Concepto:** *Consola de operaciones QA en vivo, no panel administrativo.*

La interfaz debe sentirse como una consola técnica de monitoreo y control: densa en información, sobria, rápida y con el estado siempre visible. El producto no decora: informa, ejecuta y deja trabajar.

**Declaración de dirección:** “El perfil es el contexto, los datos son el contenido; la interfaz se aparta del camino.”

**Personalidad:** precisa, técnica, confiable, directa. Sin humor, sin ornamentos, sin jerga innecesaria. La confianza se construye con consistencia y feedback, no con efectos.

## 2. Principios conductuales (behavioral design)

| Principio | Qué significa | Se hace | No se hace |
|---|---|---|---|
| **El perfil manda** | El perfil activo es el contexto global y visible; todo lo que depende de perfil cambia con él. | Mostrar el perfil en el shell y propagarlo a REST (`X-Profile-Id`) y socket (`profile:<id>`). | Ocultar el contexto o duplicar selectores por vista. |
| **El estado es explícito** | Loading, vacío, error, en curso y deshabilitado se representan siempre. | Skeletons, badges, contadores y mensajes accionables. | Dejar huecos en blanco o spinners infinitos. |
| **Datos en vivo** | Los eventos de socket se consumen como flujo continuo. | Actualizar progreso, logs y resultados sin recargar la página. | Refrescar toda la vista para “ver si cambió algo”. |
| **Acciones seguras** | Las acciones destructivas se confirman y las largas se pueden abortar. | ConfirmDialog, estados intermedios y opción de cancelar. | Ejecutar borrados o corridas sin confirmación ni salida. |
| **Feedback inmediato** | Toda acción responde. | Toasts, actualización optimista cuando el backend lo permita y deshabilitado mientras hay una operación. | Fallos silenciosos o dobles envíos. |
| **Divulgación progresiva** | Primero lo esencial; el detalle a un clic. | Resumen → detalle → consola/archivo. | Volcar toda la información a la vez. |
| **Navegación predecible** | La posición y el estado relevante viven en la URL y en atajos. | Rutas estables, command palette y estado de filtros seleccionable. | Navegación solo por clic y estado escondido en memoria. |
| **Densidad útil** | Optimizar para escanear y comparar. | Tablas compactas, métricas, tabular numbers y consola de logs. | Filas enormes y tarjetas decorativas. |
| **Consistencia por tokens** | Un solo sistema visual para todo el producto. | Tokens semánticos de color, spacing y radios; componentes shadcn reutilizados. | Colores y estilos ad hoc por vista. |

## 3. Lenguaje visual

### Color

- Base neutral (`background`, `foreground`, `card`, `muted`) con un único acento funcional (`primary`).
- El color comunica estado, no decora: éxito, error, en curso y advertencia con `chart-*` y `destructive`.
- Paridad light/dark obligatoria; el modo oscuro es el contexto natural de una consola de operaciones.
- Superficies con contraste suficiente para datos y logs; nunca texto de color sobre fondos saturados.

### Tipografía

- **Inter** para UI y lectura; **Manrope** para títulos/display.
- Escala compacta y jerarquía clara: títulos contenidos, cuerpo legible, metadatos en `text-xs`.
- Números tabulares en métricas y tablas para evitar saltos de ancho.
- Evitar mayúsculas sostenidas y tracking agresivo en bloques largos.

### Espaciado y forma

- Radio base `0.625rem`; densidad media-alta (filas y controles compactos).
- Separación por bloques, no por líneas excesivas; bordes suaves y sombras solo para elevación real.
- Header fijo con blur únicamente cuando hay scroll.

### Iconografía

- Lucide, trazo consistente, tamaños 16–20 px; iconos como apoyo semántico, nunca como decoración.
- Un icono por acción, mismo significado en todo el producto.

### Movimiento

- Transiciones de 150–200 ms, `ease-out`; microinteracciones solo para cambios de estado.
- Nada de animaciones que compitan con la lectura de datos; respetar `prefers-reduced-motion`.

### Visualización de datos

- Gráficos con la paleta `chart-1…chart-5`, series limitadas y etiquetas directas.
- Priorizar tendencias y comparaciones; evitar gráficos 3D y decoraciones que oculten los datos.
- Estados vacíos de gráficos con mensaje y acción sugerida.

## 4. Voz y tono

- Español directo y técnico. Frases cortas. Cero lenguaje de marketing.
- Mensajes de error: qué pasó + qué puede hacer el usuario.
- Confirmaciones: verbo + objeto (“Eliminar perfil”, “Abortar ejecución”).
- Evitar humor, emojis y signos de exclamación en la interfaz principal.

## 5. Patrones por módulo

| Vista | Rol creativo | Comportamiento clave |
|---|---|---|
| **Dashboard** | Consola/resumen operativo en vivo | Estado de ejecución, progreso y últimos resultados; acceso al detalle. |
| **Tests** | Explorador y selección de specs | Árbol por archivo/proyecto, selección y parámetros de corrida. |
| **Reportes** | Historial y analítica | Listado, KPIs, detalle por test, descargas y artefactos. |
| **Evidencia de fallos** | Galería/visor | Miniaturas con metadatos y visor de imagen. |
| **Entornos** | Editor de variables y entornos guardados | `.env` por archivo + conjuntos por perfil. |
| **Docker** | Panel de control | Estado, acciones y consola de logs en vivo. |
| **Calendarización** | Listado y formulario de programaciones | CRUD, toggle, ejecución manual y actividad. |
| **Datos de prueba** | Explorador de datos | Tabla TXT, árbol/editor JSON y snapshots. |
| **Ajustes** | Configuración y administración | Config, features, automatización, perfiles y sistema. |

## 6. Accesibilidad

- Contraste mínimo AA, foco visible y navegación por teclado en todos los controles.
- `aria-live` para estados y progreso; etiquetas asociadas a inputs.
- Objetivos táctiles cómodos y `font-size: 16px` en inputs móviles.
- Respeto a `prefers-reduced-motion`; nunca depender solo del color para comunicar estado.

## 7. Implementación

- La dirección se implementa sobre la capa existente: `src/lib/api.ts` (REST tipado), `src/lib/socket.ts` y `src/hooks/use-socket.ts` (eventos), `src/stores/profileStore.ts` (sesión), `src/types/contract.ts` (contrato) y componentes shadcn/ui.
- TanStack Query para estado de servidor; Zustand para estado de sesión; sonner para feedback; Tailwind 4 + tokens para estilo.
- Cada vista debe declarar sus estados de carga, vacío, error y permiso/feature deshabilitada.

## 8. Anti-patrones

- Spinners infinitos, modales para todo, estética de plantilla genérica, color decorativo, estado oculto, fetch duplicado, fallos silenciosos y acciones destructivas sin confirmación.

## 9. Checklist de calidad

- [ ] La vista tiene contexto de perfil visible y consistente.
- [ ] Estados de carga, vacío, error y deshabilitado implementados.
- [ ] Acciones con feedback inmediato y sin dobles envíos.
- [ ] Eventos de socket reflejados sin recarga.
- [ ] Navegación por teclado y foco visible.
- [ ] Tokens y componentes compartidos, sin estilos ad hoc.
- [ ] Sin errores de consola; `npm run lint` y `npm run build` en verde.
